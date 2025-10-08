/**
 * @fileoverview This file defines the MCP tools for interacting with Trello labels.
 * It includes functions for creating, reading, updating, and deleting labels, as well as
 * tools for analyzing label usage. Each tool has a corresponding Zod schema for input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `getLabel` tool.
 */
export const getLabelSchema = z.object({
  id: z.string().describe('The ID of the label to retrieve.'),
});

/**
 * Schema for the `getLabelsOnBoard` tool.
 */
export const getLabelsOnBoardSchema = z.object({
  boardId: z.string().describe('The ID of the board to get labels from.'),
  limit: z.number().min(1).max(1000).optional().describe('The maximum number of labels to return.'),
});

/**
 * Schema for the `createLabel` tool.
 */
export const createLabelSchema = z.object({
  boardId: z.string().describe('The ID of the board to create the label on.'),
  name: z.string().min(1).max(16384).describe('The name for the new label.'),
  color: z.enum(['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black']).describe('The color for the new label.'),
});

/**
 * Schema for the `updateLabel` tool.
 */
export const updateLabelSchema = z.object({
  id: z.string().describe('The ID of the label to update.'),
  name: z.string().min(1).max(16384).optional().describe('A new name for the label.'),
  color: z.enum(['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black']).optional().describe('A new color for the label.'),
});

/**
 * Schema for the `deleteLabel` tool.
 */
export const deleteLabelSchema = z.object({
  id: z.string().describe('The ID of the label to delete.'),
});

/**
 * Schema for the `getCardsWithLabel` tool.
 */
export const getCardsWithLabelSchema = z.object({
  labelId: z.string().describe('The ID of the label to find cards for.'),
  boardId: z.string().describe('The ID of the board to search within.'),
  includeArchived: z.boolean().optional().default(false).describe('Whether to include archived cards in the search.'),
});

// ===== TOOL HANDLERS =====

/**
 * Retrieves a single Trello label by its ID.
 * @param {z.infer<typeof getLabelSchema>} args - The arguments for getting a label.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the label data and a summary.
 */
export async function getLabel(args: z.infer<typeof getLabelSchema>, context: McpContext) {
  context.logger.info({ labelId: args.id }, 'Getting label details');
  const label = await trelloClient.getLabel(args.id);
  return {
    success: true,
    data: label,
    summary: `Retrieved label "${label.name}" (${label.color || 'no color'}) with ${label.uses} uses.`,
  };
}

/**
 * Retrieves all labels for a given Trello board.
 * @param {z.infer<typeof getLabelsOnBoardSchema>} args - The arguments for getting labels from a board.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a list of labels and a summary.
 */
export async function getLabelsOnBoard(args: z.infer<typeof getLabelsOnBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId }, 'Getting labels on board');
  const labels = await trelloClient.listLabels(args.boardId);
  const limitedLabels = args.limit ? labels.slice(0, args.limit) : labels;
  return {
    success: true,
    data: limitedLabels,
    summary: `Found ${limitedLabels.length} labels on the board.`,
  };
}

/**
 * Creates a new label on a Trello board.
 * @param {z.infer<typeof createLabelSchema>} args - The details of the label to create.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the new label data.
 */
export async function createLabel(args: z.infer<typeof createLabelSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, name: args.name }, 'Creating new label');
  const label = await trelloClient.createLabel({ idBoard: args.boardId, ...args });
  return {
    success: true,
    data: label,
    summary: `Created label "${label.name}" with ID ${label.id}.`,
  };
}

/**
 * Updates an existing Trello label's name or color.
 * @param {z.infer<typeof updateLabelSchema>} args - The ID of the label and the fields to update.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated label data.
 */
export async function updateLabel(args: z.infer<typeof updateLabelSchema>, context: McpContext) {
  context.logger.info({ labelId: args.id }, 'Updating label');
  const { id, ...updateData } = args;
  const label = await trelloClient.updateLabel(id, updateData);
  return {
    success: true,
    data: label,
    summary: `Updated label to "${label.name}" (${label.color}).`,
  };
}

/**
 * Deletes a Trello label.
 * @param {z.infer<typeof deleteLabelSchema>} args - The ID of the label to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the deletion.
 */
export async function deleteLabel(args: z.infer<typeof deleteLabelSchema>, context: McpContext) {
  context.logger.info({ labelId: args.id }, 'Deleting label');
  const label = await trelloClient.getLabel(args.id); // Get name for summary
  await trelloClient.deleteLabel(args.id);
  return {
    success: true,
    data: { id: args.id, deleted: true },
    summary: `Deleted label "${label.name}".`,
  };
}

/**
 * Retrieves all cards that have a specific label applied within a given board.
 * @param {z.infer<typeof getCardsWithLabelSchema>} args - The label ID and board ID to search within.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the list of cards found.
 */
export async function getCardsWithLabel(args: z.infer<typeof getCardsWithLabelSchema>, context: McpContext) {
  context.logger.info({ labelId: args.labelId, boardId: args.boardId }, 'Getting cards with label');
  const label = await trelloClient.getLabel(args.labelId);
  const board = await trelloClient.getBoard(args.boardId, { cards: args.includeArchived ? 'all' : 'open' });
  const cards = board.cards?.filter(card => card.labels.some(l => l.id === args.labelId)) || [];
  return {
    success: true,
    data: { label, cards },
    summary: `Found ${cards.length} cards with the label "${label.name}" on this board.`,
  };
}
