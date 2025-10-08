/**
 * @fileoverview This tool provides functions to fetch recent activity from Trello,
 * either for a specific member or across multiple boards. It allows for filtering
 * by action type and time range.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

/**
 * Zod schema for validating the arguments of the `listRecentActivity` function.
 * Defines the expected input structure, types, and descriptions for fetching activity.
 */
export const listRecentActivitySchema = z.object({
  scope: z.enum(['member', 'boards']).default('member').describe("The scope of the activity feed. Use 'member' for a user's activity or 'boards' for activity on specific boards."),
  memberId: z.string().optional().default('me').describe("The ID of the member to fetch activity for. Defaults to 'me' for the current authenticated user."),
  boardIds: z.array(z.string()).optional().describe("An array of board IDs to fetch activity from when scope is 'boards'."),
  types: z.array(z.string()).optional().describe('An array of Trello action types to filter by (e.g., "createCard", "updateList").'),
  since: z.string().optional().describe('An ISO 8601 timestamp to filter activity since this date.'),
  before: z.string().optional().describe('An ISO 8601 timestamp to filter activity before this date.'),
  limit: z.number().min(1).max(1000).optional().default(200).describe('The maximum number of actions to return (1-1000).'),
});

/**
 * Lists recent activity actions from Trello based on the specified scope and filters.
 * It can fetch actions for a member or for a list of boards, and then sorts and limits the results.
 * @param {z.infer<typeof listRecentActivitySchema>} args - The arguments for listing activity, validated against the schema.
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<{success: boolean, data: any[], summary: string}>} A promise that resolves to an object containing the success status, the fetched activity data, and a summary message.
 */
export async function listRecentActivity(args: z.infer<typeof listRecentActivitySchema>, context: McpContext) {
  context.logger.info({ scope: args.scope }, 'Listing recent activity');

  const results: any[] = [];
  const params: any = { limit: args.limit };
  if (args.types && args.types.length > 0) params.filter = args.types.join(',');
  if (args.since) params.since = args.since;
  if (args.before) params.before = args.before;

  if (args.scope === 'member') {
    const actions = await trelloClient.listMemberActions(args.memberId || 'me', params);
    results.push(...actions);
  } else if (args.scope === 'boards' && args.boardIds && args.boardIds.length > 0) {
    // Limit to fetching actions for the first 10 boards to avoid overloading the API.
    for (const boardId of args.boardIds.slice(0, 10)) {
      try {
        const actions = await trelloClient.listBoardActions(boardId, params);
        // Add boardId to each action for context.
        results.push(...actions.map(a => ({ ...a, _boardId: boardId })));
      } catch (e) {
        context.logger.warn({ boardId, error: (e as Error).message }, 'Failed to fetch board actions');
      }
    }
  }

  // Sort all collected results by date in descending order and apply the final limit.
  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const limited = results.slice(0, args.limit);

  return {
    success: true,
    data: limited,
    summary: `Retrieved ${limited.length} recent action(s).`,
  };
}


