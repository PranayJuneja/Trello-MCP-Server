import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const getChecklistSchema = z.object({
  id: z.string().describe('Checklist ID to retrieve'),
  includeCheckItems: z.boolean().optional().default(true).describe('Whether to include check items'),
});

export const addChecklistSchema = z.object({
  cardId: z.string().describe('Card ID to add the checklist to'),
  name: z.string().min(1).max(16384).describe('Name of the checklist'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position of the checklist (number, "top", or "bottom")'),
  idChecklistSource: z.string().optional().describe('ID of a source checklist to copy from'),
});

export const updateChecklistSchema = z.object({
  id: z.string().describe('Checklist ID to update'),
  name: z.string().min(1).max(16384).optional().describe('New name for the checklist'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('New position of the checklist'),
});

export const deleteChecklistSchema = z.object({
  id: z.string().describe('Checklist ID to delete'),
});

export const getChecklistsOnCardSchema = z.object({
  cardId: z.string().describe('Card ID to get checklists for'),
  filter: z.enum(['all', 'none']).optional().default('all').describe('Filter for checklists to include'),
});

export const addCheckItemSchema = z.object({
  checklistId: z.string().describe('Checklist ID to add the item to'),
  name: z.string().min(1).max(16384).describe('Name of the check item'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position of the check item (number, "top", or "bottom")'),
  checked: z.boolean().optional().default(false).describe('Whether the item is initially checked'),
  due: z.string().optional().describe('Due date for the check item in ISO format'),
  idMember: z.string().optional().describe('Member ID to assign to the check item'),
});

export const updateCheckItemSchema = z.object({
  cardId: z.string().describe('Card ID containing the checklist'),
  checklistId: z.string().describe('Checklist ID containing the check item'),
  checkItemId: z.string().describe('Check item ID to update'),
  name: z.string().min(1).max(16384).optional().describe('New name for the check item'),
  state: z.enum(['incomplete', 'complete']).optional().describe('New state of the check item'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('New position of the check item'),
  due: z.string().optional().describe('Due date for the check item in ISO format'),
  idMember: z.string().optional().describe('Member ID to assign to the check item'),
});

export const deleteCheckItemSchema = z.object({
  checklistId: z.string().describe('Checklist ID containing the check item'),
  checkItemId: z.string().describe('Check item ID to delete'),
});

export const getCheckItemsSchema = z.object({
  checklistId: z.string().describe('Checklist ID to get check items for'),
  filter: z.enum(['all', 'incomplete', 'complete']).optional().default('all').describe('Filter for check items to include'),
});

export const getCheckItemSchema = z.object({
  checklistId: z.string().describe('Checklist ID containing the check item'),
  checkItemId: z.string().describe('Check item ID to retrieve'),
});

export const moveChecklistToCardSchema = z.object({
  checklistId: z.string().describe('Checklist ID to move'),
  cardId: z.string().describe('Destination card ID'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position on the new card'),
});

// ===== TOOL HANDLERS =====

export async function getChecklist(args: z.infer<typeof getChecklistSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.id }, 'Getting checklist details');
  
  const checklist = await trelloClient.getChecklist(args.id);
  
  return {
    success: true,
    data: checklist,
    summary: `Retrieved checklist "${checklist.name}" with ${checklist.checkItems.length} items`,
  };
}

export async function addChecklist(args: z.infer<typeof addChecklistSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, name: args.name }, 'Adding checklist to card');
  
  const request = {
    name: args.name,
    idCard: args.cardId,
    ...(args.pos !== undefined && { pos: args.pos }),
    ...(args.idChecklistSource && { idChecklistSource: args.idChecklistSource }),
  };
  
  const checklist = await trelloClient.createChecklist(request);
  
  return {
    success: true,
    data: checklist,
    summary: `Created checklist "${checklist.name}" with ID ${checklist.id}`,
  };
}

export async function updateChecklist(args: z.infer<typeof updateChecklistSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.id }, 'Updating checklist');
  
  // For updating checklist, we need to use the updateChecklistField method
  const updates: any = {};
  if (args.name) updates.name = args.name;
  if (args.pos !== undefined) updates.pos = args.pos;
  
  // Get current checklist first for summary
  const checklist = await trelloClient.getChecklist(args.id);
  
  // Apply updates one by one using the field update API
  const results: any = {};
  for (const [field, value] of Object.entries(updates)) {
    // Use the Trello client's generic put method for field updates
    await trelloClient.updateChecklistField(args.id, field, value);
    results[field] = value;
  }
  
  // Get updated checklist
  const updatedChecklist = await trelloClient.getChecklist(args.id);
  
  return {
    success: true,
    data: updatedChecklist,
    summary: `Updated checklist "${checklist.name}"`,
  };
}

export async function deleteChecklist(args: z.infer<typeof deleteChecklistSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.id }, 'Deleting checklist');
  
  // Get checklist name first for summary
  const checklist = await trelloClient.getChecklist(args.id);
  await trelloClient.deleteChecklist(args.id);
  
  return {
    success: true,
    data: { id: args.id, deleted: true },
    summary: `Deleted checklist "${checklist.name}"`,
  };
}

export async function getChecklistsOnCard(args: z.infer<typeof getChecklistsOnCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId }, 'Getting checklists on card');
  
  // Get card with checklists
  const card = await trelloClient.getCard(args.cardId, {
    checklists: args.filter,
  });
  
  const checklists = card.checklists || [];
  
  return {
    success: true,
    data: checklists,
    summary: `Found ${checklists.length} checklists on card "${card.name}"`,
  };
}

export async function addCheckItem(args: z.infer<typeof addCheckItemSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.checklistId, name: args.name }, 'Adding check item to checklist');
  
  const request = {
    name: args.name,
    ...(args.pos !== undefined && { pos: args.pos }),
    ...(args.checked !== undefined && { checked: args.checked }),
    ...(args.due && { due: args.due }),
    ...(args.idMember && { idMember: args.idMember }),
  };
  
  const checkItem = await trelloClient.addCheckItem(args.checklistId, request);
  
  return {
    success: true,
    data: checkItem,
    summary: `Added check item "${checkItem.name}" with ID ${checkItem.id}`,
  };
}

export async function updateCheckItem(args: z.infer<typeof updateCheckItemSchema>, context: McpContext) {
  context.logger.info({ 
    cardId: args.cardId, 
    checklistId: args.checklistId, 
    checkItemId: args.checkItemId 
  }, 'Updating check item');
  
  const { cardId, checklistId, checkItemId, ...updateData } = args;
  
  const checkItem = await trelloClient.updateCheckItem(cardId, checklistId, checkItemId, updateData);
  
  return {
    success: true,
    data: checkItem,
    summary: `Updated check item "${checkItem.name}"`,
  };
}

export async function deleteCheckItem(args: z.infer<typeof deleteCheckItemSchema>, context: McpContext) {
  context.logger.info({ 
    checklistId: args.checklistId, 
    checkItemId: args.checkItemId 
  }, 'Deleting check item');
  
  // Get checklist to find item name for summary
  const checklist = await trelloClient.getChecklist(args.checklistId);
  const checkItem = checklist.checkItems.find(item => item.id === args.checkItemId);
  const itemName = checkItem?.name || 'Unknown item';
  
  await trelloClient.deleteCheckItem(args.checklistId, args.checkItemId);
  
  return {
    success: true,
    data: { checklistId: args.checklistId, checkItemId: args.checkItemId, deleted: true },
    summary: `Deleted check item "${itemName}"`,
  };
}

export async function getCheckItems(args: z.infer<typeof getCheckItemsSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.checklistId, filter: args.filter }, 'Getting check items');
  
  const checklist = await trelloClient.getChecklist(args.checklistId);
  let checkItems = checklist.checkItems || [];
  
  // Apply filter
  if (args.filter === 'incomplete') {
    checkItems = checkItems.filter(item => item.state === 'incomplete');
  } else if (args.filter === 'complete') {
    checkItems = checkItems.filter(item => item.state === 'complete');
  }
  
  return {
    success: true,
    data: checkItems,
    summary: `Found ${checkItems.length} ${args.filter} check items in checklist "${checklist.name}"`,
  };
}

export async function getCheckItem(args: z.infer<typeof getCheckItemSchema>, context: McpContext) {
  context.logger.info({ 
    checklistId: args.checklistId, 
    checkItemId: args.checkItemId 
  }, 'Getting check item details');
  
  const checklist = await trelloClient.getChecklist(args.checklistId);
  const checkItem = checklist.checkItems.find(item => item.id === args.checkItemId);
  
  if (!checkItem) {
    throw new Error(`Check item ${args.checkItemId} not found in checklist ${args.checklistId}`);
  }
  
  return {
    success: true,
    data: checkItem,
    summary: `Retrieved check item "${checkItem.name}" (${checkItem.state})`,
  };
}
