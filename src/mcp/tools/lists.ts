import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const listListsSchema = z.object({
  boardId: z.string().describe('Board ID to get lists from'),
  filter: z.enum(['all', 'open', 'closed']).optional().default('open').describe('Filter for lists to include'),
});

export const getListSchema = z.object({
  id: z.string().describe('List ID to retrieve'),
  includeCards: z.boolean().optional().describe('Whether to include cards in the response'),
});

export const createListSchema = z.object({
  boardId: z.string().describe('Board ID to create the list in'),
  name: z.string().min(1).max(16384).describe('Name of the list'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position of the list (number, "top", or "bottom")'),
});

export const updateListSchema = z.object({
  id: z.string().describe('List ID to update'),
  name: z.string().min(1).max(16384).optional().describe('New name for the list'),
  closed: z.boolean().optional().describe('Whether the list is closed/archived'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('New position of the list'),
  subscribed: z.boolean().optional().describe('Whether the user is subscribed to the list'),
});

export const archiveListSchema = z.object({
  id: z.string().describe('List ID to archive'),
});

export const unarchiveListSchema = z.object({
  id: z.string().describe('List ID to unarchive'),
});

export const moveListSchema = z.object({
  id: z.string().describe('List ID to move'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).describe('New position of the list (number, "top", or "bottom")'),
});

export const getListCardsSchema = z.object({
  id: z.string().describe('List ID to get cards from'),
  filter: z.enum(['all', 'open', 'closed']).optional().default('open').describe('Filter for cards to include'),
  limit: z.number().min(1).max(1000).optional().describe('Maximum number of cards to return'),
});

// ===== TOOL HANDLERS =====

export async function listLists(args: z.infer<typeof listListsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, filter: args.filter }, 'Listing lists');
  
  const lists = await trelloClient.listLists(args.boardId, args.filter);
  
  return {
    success: true,
    data: lists,
    summary: `Found ${lists.length} ${args.filter} lists on board`,
  };
}

export async function getList(args: z.infer<typeof getListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id }, 'Getting list details');
  
  const list = await trelloClient.getList(args.id);
  
  // Optionally get cards if requested
  let cards = undefined;
  if (args.includeCards) {
    cards = await trelloClient.listLists(list.idBoard, 'open');
    const targetList = cards.find(l => l.id === args.id);
    if (targetList?.cards) {
      cards = targetList.cards;
    }
  }
  
  const result = {
    ...list,
    ...(cards && { cards }),
  };
  
  return {
    success: true,
    data: result,
    summary: `Retrieved list "${list.name}"${cards ? ` with ${cards.length} cards` : ''}`,
  };
}

export async function createList(args: z.infer<typeof createListSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, name: args.name }, 'Creating new list');
  
  const request = {
    name: args.name,
    idBoard: args.boardId,
    ...(args.pos !== undefined && { pos: args.pos }),
  };
  
  const list = await trelloClient.createList(request);
  
  return {
    success: true,
    data: list,
    summary: `Created list "${list.name}" with ID ${list.id}`,
  };
}

export async function updateList(args: z.infer<typeof updateListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id }, 'Updating list');
  
  const { id, ...updateData } = args;
  const list = await trelloClient.updateList(id, updateData);
  
  return {
    success: true,
    data: list,
    summary: `Updated list "${list.name}"`,
  };
}

export async function archiveList(args: z.infer<typeof archiveListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id }, 'Archiving list');
  
  const list = await trelloClient.archiveList(args.id);
  
  return {
    success: true,
    data: list,
    summary: `Archived list "${list.name}"`,
  };
}

export async function unarchiveList(args: z.infer<typeof unarchiveListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id }, 'Unarchiving list');
  
  const list = await trelloClient.unarchiveList(args.id);
  
  return {
    success: true,
    data: list,
    summary: `Unarchived list "${list.name}"`,
  };
}

export async function moveList(args: z.infer<typeof moveListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id, pos: args.pos }, 'Moving list');
  
  const list = await trelloClient.updateList(args.id, { pos: args.pos });
  
  return {
    success: true,
    data: list,
    summary: `Moved list "${list.name}" to position ${args.pos}`,
  };
}

export async function getListCards(args: z.infer<typeof getListCardsSchema>, context: McpContext) {
  context.logger.info({ listId: args.id, filter: args.filter }, 'Getting list cards');
  
  // Get the list first to get board ID, then get cards
  const list = await trelloClient.getList(args.id);
  const boardLists = await trelloClient.listLists(list.idBoard, 'all');
  const targetList = boardLists.find(l => l.id === args.id);
  
  if (!targetList?.cards) {
    return {
      success: true,
      data: [],
      summary: `List "${list.name}" has no cards`,
    };
  }
  
  let cards = targetList.cards;
  
  // Apply filter
  if (args.filter === 'closed') {
    cards = cards.filter(card => card.closed);
  } else if (args.filter === 'open') {
    cards = cards.filter(card => !card.closed);
  }
  
  // Apply limit
  if (args.limit) {
    cards = cards.slice(0, args.limit);
  }
  
  return {
    success: true,
    data: cards,
    summary: `Found ${cards.length} ${args.filter} cards in list "${list.name}"`,
  };
}
