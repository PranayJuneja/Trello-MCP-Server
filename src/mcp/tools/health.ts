import { z } from 'zod';
import { config } from '../../config/env.js';
import { TrelloClient } from '../../trello/client.js';
import type { McpContext } from '../server.js';

export const healthCheckSchema = z.object({});

export async function healthCheck(_args: z.infer<typeof healthCheckSchema>, _context: McpContext) {
  const trelloConfigured = Boolean(config.TRELLO_KEY && config.TRELLO_TOKEN);
  return {
    success: true,
    data: {
      trelloConfigured,
      timestamp: new Date().toISOString(),
      node: process.version,
      trelloApiBase: config.TRELLO_API_BASE,
    },
    summary: trelloConfigured
      ? 'Server is healthy and Trello credentials are configured'
      : 'Server is healthy but Trello credentials are not configured',
  };
}

export const whoAmISchema = z.object({});

export async function whoAmI(_args: z.infer<typeof whoAmISchema>, context: McpContext) {
  const trelloConfigured = Boolean(config.TRELLO_KEY && config.TRELLO_TOKEN);
  if (!trelloConfigured) {
    return {
      success: false,
      data: null,
      summary: 'Trello credentials (TRELLO_KEY/TRELLO_TOKEN) are not configured',
    };
  }

  const client = new TrelloClient();
  try {
    const me = await client.getMember('me');
    return {
      success: true,
      data: {
        id: (me as any).id,
        username: (me as any).username,
        fullName: (me as any).fullName,
      },
      summary: `Authenticated as @${(me as any).username}`,
    };
  } catch (error) {
    context.logger.error({ error: (error as Error).message }, 'whoAmI failed');
    return {
      success: false,
      data: null,
      summary: `Failed to fetch current member: ${(error as Error).message}`,
    };
  }
}


