import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

export const listRecentActivitySchema = z.object({
  scope: z.enum(['member', 'boards']).default('member').describe('Activity scope: current member or specific boards'),
  memberId: z.string().optional().default('me').describe('Member ID when scope is member'),
  boardIds: z.array(z.string()).optional().describe('Board IDs when scope is boards'),
  types: z.array(z.string()).optional().describe('Filter by Trello action types'),
  since: z.string().optional().describe('ISO timestamp to filter since'),
  before: z.string().optional().describe('ISO timestamp to filter before'),
  limit: z.number().min(1).max(1000).optional().default(200).describe('Max number of actions to return'),
});

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
    for (const boardId of args.boardIds.slice(0, 10)) { // avoid overload
      try {
        const actions = await trelloClient.listBoardActions(boardId, params);
        results.push(...actions.map(a => ({ ...a, _boardId: boardId })));
      } catch (e) {
        context.logger.warn({ boardId }, 'Failed to fetch board actions');
      }
    }
  }

  // Sort by action date desc and limit
  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const limited = results.slice(0, args.limit);

  return {
    success: true,
    data: limited,
    summary: `Retrieved ${limited.length} recent action(s)`,
  };
}


