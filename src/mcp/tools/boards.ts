/**
 * @fileoverview This file defines the MCP tools for interacting with Trello boards.
 * It includes functions for listing, retrieving, creating, updating, and deleting boards,
 * with corresponding Zod schemas for input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `listBoards` tool.
 */
export const listBoardsSchema = z.object({
  memberId: z.string().optional().describe('Member ID to list boards for (defaults to "me").'),
});

/**
 * Schema for the `getBoard` tool.
 */
export const getBoardSchema = z.object({
  id: z.string().describe('The ID of the board to retrieve.'),
  includeCards: z.boolean().optional().describe('Set to true to include open cards in the response.'),
  includeLists: z.boolean().optional().describe('Set to true to include open lists in the response.'),
  includeLabels: z.boolean().optional().describe('Set to true to include all labels in the response.'),
  includeMembers: z.boolean().optional().describe('Set to true to include all members in the response.'),
});

/**
 * Schema for the `createBoard` tool.
 */
export const createBoardSchema = z.object({
  name: z.string().min(1).max(16384).describe('The name of the board.'),
  desc: z.string().max(16384).optional().describe('A description for the board.'),
  idOrganization: z.string().optional().describe('The ID of the Workspace to create the board in.'),
  prefs_permissionLevel: z.enum(['org', 'private', 'public']).optional().describe('The permission level for the board.'),
  prefs_voting: z.enum(['disabled', 'members', 'observers', 'org', 'public']).optional().describe('Who can vote on cards.'),
  prefs_comments: z.enum(['disabled', 'members', 'observers', 'org', 'public']).optional().describe('Who can comment on cards.'),
  prefs_invitations: z.enum(['admins', 'members']).optional().describe('Who can invite people to the board.'),
  prefs_selfJoin: z.boolean().optional().describe('Whether Workspace members can join the board themselves.'),
  prefs_cardCovers: z.boolean().optional().describe('Whether to display card covers.'),
  prefs_background: z.string().optional().describe('The background color or image ID.'),
});

/**
 * Schema for the `updateBoard` tool.
 */
export const updateBoardSchema = z.object({
  id: z.string().describe('The ID of the board to update.'),
  name: z.string().min(1).max(16384).optional().describe('A new name for the board.'),
  desc: z.string().max(16384).optional().describe('A new description for the board.'),
  closed: z.boolean().optional().describe('Set to true to close (archive) the board.'),
  subscribed: z.boolean().optional().describe('Set to true to subscribe to the board.'),
  idOrganization: z.string().optional().describe('The ID of a new Workspace to move the board to.'),
  'prefs/permissionLevel': z.enum(['org', 'private', 'public']).optional().describe('A new permission level.'),
  'prefs/selfJoin': z.boolean().optional().describe('A new setting for self-joining.'),
  'prefs/cardCovers': z.boolean().optional().describe('A new setting for card covers.'),
  'prefs/invitations': z.enum(['admins', 'members']).optional().describe('A new setting for invitations.'),
  'prefs/voting': z.enum(['disabled', 'members', 'observers', 'org', 'public']).optional().describe('A new setting for voting.'),
  'prefs/comments': z.enum(['disabled', 'members', 'observers', 'org', 'public']).optional().describe('A new setting for comments.'),
  'prefs/background': z.string().optional().describe('A new background color or ID.'),
});

/**
 * Schema for the `closeBoard` tool.
 */
export const closeBoardSchema = z.object({
  id: z.string().describe('The ID of the board to close (archive).'),
});

/**
 * Schema for the `reopenBoard` tool.
 */
export const reopenBoardSchema = z.object({
  id: z.string().describe('The ID of the board to reopen.'),
});

/**
 * Schema for the `deleteBoard` tool.
 */
export const deleteBoardSchema = z.object({
  id: z.string().describe('The ID of the board to delete permanently.'),
});

// ===== TOOL HANDLERS =====

/**
 * Lists all boards for a given member.
 * @param {z.infer<typeof listBoardsSchema>} args - The arguments for listing boards.
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves with the list of boards and a summary.
 */
export async function listBoards(args: z.infer<typeof listBoardsSchema>, context: McpContext) {
  context.logger.info({ memberId: args.memberId }, 'Listing boards');
  const boards = await trelloClient.listBoards(args.memberId || 'me');
  return {
    success: true,
    data: boards,
    summary: `Found ${boards.length} boards.`,
  };
}

/**
 * Retrieves a single Trello board by its ID, with options to include related data.
 * @param {z.infer<typeof getBoardSchema>} args - The arguments for getting a board.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the board data and a summary.
 */
export async function getBoard(args: z.infer<typeof getBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Getting board details');
  const options: any = {};
  if (args.includeCards) options.cards = 'open';
  if (args.includeLists) options.lists = 'open';
  if (args.includeLabels) options.labels = 'all';
  if (args.includeMembers) options.members = 'all';
  
  const board = await trelloClient.getBoard(args.id, options);
  return {
    success: true,
    data: board,
    summary: `Retrieved board "${board.name}" with ${board.lists?.length || 0} lists and ${board.cards?.length || 0} cards.`,
  };
}

/**
 * Creates a new Trello board.
 * @param {z.infer<typeof createBoardSchema>} args - The details for the new board.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the newly created board data.
 */
export async function createBoard(args: z.infer<typeof createBoardSchema>, context: McpContext) {
  context.logger.info({ name: args.name }, 'Creating new board');
  const board = await trelloClient.createBoard(args);
  return {
    success: true,
    data: board,
    summary: `Created board "${board.name}" with ID ${board.id}.`,
  };
}

/**
 * Updates an existing Trello board.
 * @param {z.infer<typeof updateBoardSchema>} args - The ID of the board and the fields to update.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated board data.
 */
export async function updateBoard(args: z.infer<typeof updateBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Updating board');
  const { id, ...updateData } = args;
  const board = await trelloClient.updateBoard(id, updateData);
  return {
    success: true,
    data: board,
    summary: `Updated board "${board.name}".`,
  };
}

/**
 * Closes (archives) a Trello board.
 * @param {z.infer<typeof closeBoardSchema>} args - The ID of the board to close.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated board data.
 */
export async function closeBoard(args: z.infer<typeof closeBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Closing board');
  const board = await trelloClient.closeBoard(args.id);
  return {
    success: true,
    data: board,
    summary: `Closed board "${board.name}".`,
  };
}

/**
 * Reopens a closed (archived) Trello board.
 * @param {z.infer<typeof reopenBoardSchema>} args - The ID of the board to reopen.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated board data.
 */
export async function reopenBoard(args: z.infer<typeof reopenBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Reopening board');
  const board = await trelloClient.reopenBoard(args.id);
  return {
    success: true,
    data: board,
    summary: `Reopened board "${board.name}".`,
  };
}

/**
 * Permanently deletes a Trello board. This action is irreversible.
 * @param {z.infer<typeof deleteBoardSchema>} args - The ID of the board to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the deletion.
 */
export async function deleteBoard(args: z.infer<typeof deleteBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Deleting board permanently');
  // Get board name first for a more informative summary message.
  const board = await trelloClient.getBoard(args.id, { fields: 'name' });
  await trelloClient.deleteBoard(args.id);
  return {
    success: true,
    data: { id: args.id, deleted: true },
    summary: `Permanently deleted board "${board.name}".`,
  };
}
