/**
 * @fileoverview This file defines the MCP tools for interacting with Trello lists.
 * It includes functions for listing, retrieving, creating, updating, and managing lists,
 * with corresponding Zod schemas for input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `listLists` tool.
 */
export const listListsSchema = z.object({
  boardId: z.string().describe('The ID of the board to get lists from.'),
  filter: z.enum(['all', 'open', 'closed']).optional().default('open').describe('The filter to apply to the lists (e.g., "open", "closed", "all").'),
});

/**
 * Schema for the `getList` tool.
 */
export const getListSchema = z.object({
  id: z.string().describe('The ID of the list to retrieve.'),
  includeCards: z.boolean().optional().describe('Set to true to include the cards within the list.'),
});

/**
 * Schema for the `createList` tool.
 */
export const createListSchema = z.object({
  boardId: z.string().describe('The ID of the board to create the list in.'),
  name: z.string().min(1).max(16384).describe('The name for the new list.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('The position of the list on the board.'),
});

/**
 * Schema for the `updateList` tool.
 */
export const updateListSchema = z.object({
  id: z.string().describe('The ID of the list to update.'),
  name: z.string().min(1).max(16384).optional().describe('A new name for the list.'),
  closed: z.boolean().optional().describe('Set to true to archive the list.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('A new position for the list.'),
  subscribed: z.boolean().optional().describe('Set to true to subscribe to the list.'),
});

/**
 * Schema for the `archiveList` tool.
 */
export const archiveListSchema = z.object({
  id: z.string().describe('The ID of the list to archive.'),
});

/**
 * Schema for the `unarchiveList` tool.
 */
export const unarchiveListSchema = z.object({
  id: z.string().describe('The ID of the list to unarchive.'),
});

/**
 * Schema for the `moveList` tool.
 */
export const moveListSchema = z.object({
  id: z.string().describe('The ID of the list to move.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).describe('The new position for the list.'),
});

/**
 * Schema for the `getListCards` tool.
 */
export const getListCardsSchema = z.object({
  id: z.string().describe('The ID of the list to get cards from.'),
  filter: z.enum(['all', 'open', 'closed']).optional().default('open').describe('The filter to apply to the cards.'),
  limit: z.number().min(1).max(1000).optional().describe('The maximum number of cards to return.'),
});

// ===== TOOL HANDLERS =====

/**
 * Lists all lists on a specified board.
 * @param {z.infer<typeof listListsSchema>} args - The arguments for listing lists.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the list of lists and a summary.
 */
export async function listLists(args: z.infer<typeof listListsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, filter: args.filter }, 'Listing lists');
  const lists = await trelloClient.listLists(args.boardId, args.filter);
  return {
    success: true,
    data: lists,
    summary: `Found ${lists.length} ${args.filter} lists on board.`,
  };
}

/**
 * Retrieves a single Trello list by its ID, with an option to include its cards.
 * @param {z.infer<typeof getListSchema>} args - The arguments for getting a list.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the list data and a summary.
 */
export async function getList(args: z.infer<typeof getListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id }, 'Getting list details');
  const list = await trelloClient.getList(args.id);
  
  let cards;
  if (args.includeCards) {
    const boardLists = await trelloClient.listLists(list.idBoard, 'open');
    cards = boardLists.find(l => l.id === args.id)?.cards;
  }
  
  const result = { ...list, ...(cards && { cards }) };
  return {
    success: true,
    data: result,
    summary: `Retrieved list "${list.name}"${cards ? ` with ${cards.length} cards` : ''}.`,
  };
}

/**
 * Creates a new list on a Trello board.
 * @param {z.infer<typeof createListSchema>} args - The details of the list to create.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the new list data.
 */
export async function createList(args: z.infer<typeof createListSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, name: args.name }, 'Creating new list');
  const list = await trelloClient.createList({ idBoard: args.boardId, ...args });
  return {
    success: true,
    data: list,
    summary: `Created list "${list.name}" with ID ${list.id}.`,
  };
}

/**
 * Updates an existing Trello list.
 * @param {z.infer<typeof updateListSchema>} args - The ID of the list and the fields to update.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated list data.
 */
export async function updateList(args: z.infer<typeof updateListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id }, 'Updating list');
  const { id, ...updateData } = args;
  const list = await trelloClient.updateList(id, updateData);
  return {
    success: true,
    data: list,
    summary: `Updated list "${list.name}".`,
  };
}

/**
 * Archives a Trello list.
 * @param {z.infer<typeof archiveListSchema>} args - The ID of the list to archive.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated list data.
 */
export async function archiveList(args: z.infer<typeof archiveListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id }, 'Archiving list');
  const list = await trelloClient.archiveList(args.id);
  return {
    success: true,
    data: list,
    summary: `Archived list "${list.name}".`,
  };
}

/**
 * Unarchives a Trello list.
 * @param {z.infer<typeof unarchiveListSchema>} args - The ID of the list to unarchive.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated list data.
 */
export async function unarchiveList(args: z.infer<typeof unarchiveListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id }, 'Unarchiving list');
  const list = await trelloClient.unarchiveList(args.id);
  return {
    success: true,
    data: list,
    summary: `Unarchived list "${list.name}".`,
  };
}

/**
 * Moves the position of a list on its board.
 * @param {z.infer<typeof moveListSchema>} args - The ID of the list and its new position.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated list data.
 */
export async function moveList(args: z.infer<typeof moveListSchema>, context: McpContext) {
  context.logger.info({ listId: args.id, pos: args.pos }, 'Moving list');
  const list = await trelloClient.updateList(args.id, { pos: args.pos });
  return {
    success: true,
    data: list,
    summary: `Moved list "${list.name}" to position ${args.pos}.`,
  };
}

/**
 * Retrieves all cards within a specific list.
 * @param {z.infer<typeof getListCardsSchema>} args - The ID of the list and filtering options.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a list of cards.
 */
export async function getListCards(args: z.infer<typeof getListCardsSchema>, context: McpContext) {
  context.logger.info({ listId: args.id, filter: args.filter }, 'Getting list cards');
  const list = await trelloClient.getList(args.id);
  const boardLists = await trelloClient.listLists(list.idBoard, 'all');
  const targetList = boardLists.find(l => l.id === args.id);
  
  if (!targetList?.cards) {
    return { success: true, data: [], summary: `List "${list.name}" has no cards.` };
  }
  
  let cards = targetList.cards;
  if (args.filter === 'closed') {
    cards = cards.filter(card => card.closed);
  } else if (args.filter === 'open') {
    cards = cards.filter(card => !card.closed);
  }
  
  if (args.limit) {
    cards = cards.slice(0, args.limit);
  }
  
  return {
    success: true,
    data: cards,
    summary: `Found ${cards.length} ${args.filter} cards in list "${list.name}".`,
  };
}