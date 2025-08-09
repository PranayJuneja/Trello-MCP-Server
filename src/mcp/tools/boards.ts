import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const listBoardsSchema = z.object({
  memberId: z.string().optional().describe('Member ID to list boards for (defaults to "me")'),
});

export const getBoardSchema = z.object({
  id: z.string().describe('Board ID to retrieve'),
  includeCards: z.boolean().optional().describe('Whether to include cards in the response'),
  includeLists: z.boolean().optional().describe('Whether to include lists in the response'),
  includeLabels: z.boolean().optional().describe('Whether to include labels in the response'),
  includeMembers: z.boolean().optional().describe('Whether to include members in the response'),
});

export const createBoardSchema = z.object({
  name: z.string().min(1).max(16384).describe('Name of the board'),
  desc: z.string().max(16384).optional().describe('Description of the board'),
  idOrganization: z.string().optional().describe('Organization/Workspace ID to create board in'),
  prefs_permissionLevel: z.enum(['org', 'private', 'public']).optional().describe('Permission level for the board'),
  prefs_voting: z.enum(['disabled', 'members', 'observers', 'org', 'public']).optional().describe('Who can vote on cards'),
  prefs_comments: z.enum(['disabled', 'members', 'observers', 'org', 'public']).optional().describe('Who can comment on cards'),
  prefs_invitations: z.enum(['admins', 'members']).optional().describe('Who can invite people to the board'),
  prefs_selfJoin: z.boolean().optional().describe('Whether workspace members can join themselves'),
  prefs_cardCovers: z.boolean().optional().describe('Whether to show card covers'),
  prefs_background: z.string().optional().describe('Background color or ID'),
});

export const updateBoardSchema = z.object({
  id: z.string().describe('Board ID to update'),
  name: z.string().min(1).max(16384).optional().describe('New name for the board'),
  desc: z.string().max(16384).optional().describe('New description for the board'),
  closed: z.boolean().optional().describe('Whether the board is closed'),
  subscribed: z.boolean().optional().describe('Whether the user is subscribed to the board'),
  idOrganization: z.string().optional().describe('Move board to this organization/workspace'),
  'prefs/permissionLevel': z.enum(['org', 'private', 'public']).optional().describe('Permission level'),
  'prefs/selfJoin': z.boolean().optional().describe('Whether workspace members can join themselves'),
  'prefs/cardCovers': z.boolean().optional().describe('Whether to show card covers'),
  'prefs/invitations': z.enum(['admins', 'members']).optional().describe('Who can invite people'),
  'prefs/voting': z.enum(['disabled', 'members', 'observers', 'org', 'public']).optional().describe('Who can vote'),
  'prefs/comments': z.enum(['disabled', 'members', 'observers', 'org', 'public']).optional().describe('Who can comment'),
  'prefs/background': z.string().optional().describe('Background color or ID'),
  'prefs/cardAging': z.enum(['pirate', 'regular']).optional().describe('Card aging style'),
  'prefs/calendarFeedEnabled': z.boolean().optional().describe('Whether calendar feed is enabled'),
});

export const closeBoardSchema = z.object({
  id: z.string().describe('Board ID to close'),
});

export const reopenBoardSchema = z.object({
  id: z.string().describe('Board ID to reopen'),
});

export const deleteBoardSchema = z.object({
  id: z.string().describe('Board ID to delete permanently'),
});

// ===== TOOL HANDLERS =====

export async function listBoards(args: z.infer<typeof listBoardsSchema>, context: McpContext) {
  context.logger.info({ memberId: args.memberId }, 'Listing boards');
  
  const boards = await trelloClient.listBoards(args.memberId || 'me');
  
  return {
    success: true,
    data: boards,
    summary: `Found ${boards.length} boards`,
  };
}

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
    summary: `Retrieved board "${board.name}" with ${board.lists?.length || 0} lists and ${board.cards?.length || 0} cards`,
  };
}

export async function createBoard(args: z.infer<typeof createBoardSchema>, context: McpContext) {
  context.logger.info({ name: args.name }, 'Creating new board');
  
  const board = await trelloClient.createBoard(args);
  
  return {
    success: true,
    data: board,
    summary: `Created board "${board.name}" with ID ${board.id}`,
  };
}

export async function updateBoard(args: z.infer<typeof updateBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Updating board');
  
  const { id, ...updateData } = args;
  const board = await trelloClient.updateBoard(id, updateData);
  
  return {
    success: true,
    data: board,
    summary: `Updated board "${board.name}"`,
  };
}

export async function closeBoard(args: z.infer<typeof closeBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Closing board');
  
  const board = await trelloClient.closeBoard(args.id);
  
  return {
    success: true,
    data: board,
    summary: `Closed board "${board.name}"`,
  };
}

export async function reopenBoard(args: z.infer<typeof reopenBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Reopening board');
  
  const board = await trelloClient.reopenBoard(args.id);
  
  return {
    success: true,
    data: board,
    summary: `Reopened board "${board.name}"`,
  };
}

export async function deleteBoard(args: z.infer<typeof deleteBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.id }, 'Deleting board permanently');
  
  // Get board name first for summary
  const board = await trelloClient.getBoard(args.id, { fields: 'name' });
  await trelloClient.deleteBoard(args.id);
  
  return {
    success: true,
    data: { id: args.id, deleted: true },
    summary: `Permanently deleted board "${board.name}"`,
  };
}
