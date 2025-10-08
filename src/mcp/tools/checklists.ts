/**
 * @fileoverview This file defines the MCP tools for interacting with Trello checklists and their items.
 * It includes functions for creating, reading, updating, and deleting checklists and check items,
 * with corresponding Zod schemas for input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `getChecklist` tool.
 */
export const getChecklistSchema = z.object({
  id: z.string().describe('The ID of the checklist to retrieve.'),
});

/**
 * Schema for the `addChecklist` tool.
 */
export const addChecklistSchema = z.object({
  cardId: z.string().describe('The ID of the card to add the checklist to.'),
  name: z.string().min(1).max(16384).describe('The name of the new checklist.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('The position of the checklist on the card.'),
  idChecklistSource: z.string().optional().describe('The ID of an existing checklist to copy items from.'),
});

/**
 * Schema for the `updateChecklist` tool.
 */
export const updateChecklistSchema = z.object({
  id: z.string().describe('The ID of the checklist to update.'),
  name: z.string().min(1).max(16384).optional().describe('A new name for the checklist.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('A new position for the checklist on the card.'),
});

/**
 * Schema for the `deleteChecklist` tool.
 */
export const deleteChecklistSchema = z.object({
  id: z.string().describe('The ID of the checklist to delete.'),
});

/**
 * Schema for the `getChecklistsOnCard` tool.
 */
export const getChecklistsOnCardSchema = z.object({
  cardId: z.string().describe('The ID of the card to get checklists from.'),
});

/**
 * Schema for the `addCheckItem` tool.
 */
export const addCheckItemSchema = z.object({
  checklistId: z.string().describe('The ID of the checklist to add the item to.'),
  name: z.string().min(1).max(16384).describe('The name of the check item.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('The position of the item in the checklist.'),
  checked: z.boolean().optional().default(false).describe('The initial checked state of the item.'),
});

/**
 * Schema for the `updateCheckItem` tool.
 */
export const updateCheckItemSchema = z.object({
  cardId: z.string().describe('The ID of the card containing the checklist.'),
  checklistId: z.string().describe('The ID of the checklist containing the item.'),
  checkItemId: z.string().describe('The ID of the check item to update.'),
  name: z.string().min(1).max(16384).optional().describe('A new name for the check item.'),
  state: z.enum(['incomplete', 'complete']).optional().describe('The new state of the check item.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('A new position for the check item.'),
});

/**
 * Schema for the `deleteCheckItem` tool.
 */
export const deleteCheckItemSchema = z.object({
  checklistId: z.string().describe('The ID of the checklist containing the item.'),
  checkItemId: z.string().describe('The ID of the check item to delete.'),
});

// ===== TOOL HANDLERS =====

/**
 * Retrieves a single Trello checklist by its ID.
 * @param {z.infer<typeof getChecklistSchema>} args - The arguments for getting a checklist.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the checklist data and a summary.
 */
export async function getChecklist(args: z.infer<typeof getChecklistSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.id }, 'Getting checklist details');
  const checklist = await trelloClient.getChecklist(args.id);
  return {
    success: true,
    data: checklist,
    summary: `Retrieved checklist "${checklist.name}" with ${checklist.checkItems.length} items.`,
  };
}

/**
 * Adds a new checklist to a Trello card.
 * @param {z.infer<typeof addChecklistSchema>} args - The details of the checklist to create.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the new checklist data.
 */
export async function addChecklist(args: z.infer<typeof addChecklistSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, name: args.name }, 'Adding checklist to card');
  const checklist = await trelloClient.createChecklist({ idCard: args.cardId, ...args });
  return {
    success: true,
    data: checklist,
    summary: `Created checklist "${checklist.name}" with ID ${checklist.id}.`,
  };
}

/**
 * Updates an existing Trello checklist.
 * @param {z.infer<typeof updateChecklistSchema>} args - The ID of the checklist and fields to update.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated checklist data.
 */
export async function updateChecklist(args: z.infer<typeof updateChecklistSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.id }, 'Updating checklist');
  const { id, ...updateData } = args;
  for (const [field, value] of Object.entries(updateData)) {
    await trelloClient.updateChecklistField(id, field, value);
  }
  const updatedChecklist = await trelloClient.getChecklist(id);
  return {
    success: true,
    data: updatedChecklist,
    summary: `Updated checklist "${updatedChecklist.name}".`,
  };
}

/**
 * Deletes a checklist from a Trello card.
 * @param {z.infer<typeof deleteChecklistSchema>} args - The ID of the checklist to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the deletion.
 */
export async function deleteChecklist(args: z.infer<typeof deleteChecklistSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.id }, 'Deleting checklist');
  const checklist = await trelloClient.getChecklist(args.id); // Get name for summary
  await trelloClient.deleteChecklist(args.id);
  return {
    success: true,
    data: { id: args.id, deleted: true },
    summary: `Deleted checklist "${checklist.name}".`,
  };
}

/**
 * Retrieves all checklists on a specific card.
 * @param {z.infer<typeof getChecklistsOnCardSchema>} args - The card ID.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a list of checklists.
 */
export async function getChecklistsOnCard(args: z.infer<typeof getChecklistsOnCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId }, 'Getting checklists on card');
  const card = await trelloClient.getCard(args.cardId, { checklists: 'all' });
  const checklists = card.checklists || [];
  return {
    success: true,
    data: checklists,
    summary: `Found ${checklists.length} checklists on card "${card.name}".`,
  };
}

/**
 * Adds a new item to a checklist.
 * @param {z.infer<typeof addCheckItemSchema>} args - The details of the check item to create.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the new check item data.
 */
export async function addCheckItem(args: z.infer<typeof addCheckItemSchema>, context: McpContext) {
  context.logger.info({ checklistId: args.checklistId, name: args.name }, 'Adding check item');
  const checkItem = await trelloClient.addCheckItem(args.checklistId, args);
  return {
    success: true,
    data: checkItem,
    summary: `Added check item "${checkItem.name}" with ID ${checkItem.id}.`,
  };
}

/**
 * Updates an existing item on a checklist.
 * @param {z.infer<typeof updateCheckItemSchema>} args - The IDs and fields to update for the check item.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated check item data.
 */
export async function updateCheckItem(args: z.infer<typeof updateCheckItemSchema>, context: McpContext) {
  context.logger.info({ checkItemId: args.checkItemId }, 'Updating check item');
  const { cardId, checklistId, checkItemId, ...updateData } = args;
  const checkItem = await trelloClient.updateCheckItem(cardId, checklistId, checkItemId, updateData);
  return {
    success: true,
    data: checkItem,
    summary: `Updated check item "${checkItem.name}".`,
  };
}

/**
 * Deletes an item from a checklist.
 * @param {z.infer<typeof deleteCheckItemSchema>} args - The IDs for the checklist and the item to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the deletion.
 */
export async function deleteCheckItem(args: z.infer<typeof deleteCheckItemSchema>, context: McpContext) {
  context.logger.info({ checkItemId: args.checkItemId }, 'Deleting check item');
  await trelloClient.deleteCheckItem(args.checklistId, args.checkItemId);
  return {
    success: true,
    data: { ...args, deleted: true },
    summary: `Deleted check item ${args.checkItemId}.`,
  };
}