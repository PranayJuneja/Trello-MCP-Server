/**
 * @fileoverview This file defines health-check and identity-related tools for the MCP server.
 * These tools are used to verify the server's operational status and to identify the
 * currently authenticated Trello user.
 */
import { z } from 'zod';
import { config } from '../../config/env.js';
import { TrelloClient } from '../../trello/client.js';
import type { McpContext } from '../server.js';

/**
 * Zod schema for the `healthCheck` tool. It takes no arguments.
 */
export const healthCheckSchema = z.object({});

/**
 * Performs a basic health check of the server.
 * It verifies that the server is running and checks if Trello API credentials are configured.
 * @param {z.infer<typeof healthCheckSchema>} _args - The arguments for the health check (currently none).
 * @param {McpContext} _context - The MCP context.
 * @returns {Promise<object>} A promise that resolves to an object containing the health status.
 */
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
      ? 'Server is healthy and Trello credentials are configured.'
      : 'Server is healthy but Trello credentials are not configured.',
  };
}

/**
 * Zod schema for the `whoAmI` tool. It takes no arguments.
 */
export const whoAmISchema = z.object({});

/**
 * Identifies the currently authenticated Trello user by fetching the user's profile.
 * This tool is useful for verifying that the provided API key and token are valid.
 * @param {z.infer<typeof whoAmISchema>} _args - The arguments for the whoAmI tool (currently none).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves to an object containing the user's details or an error message.
 */
export async function whoAmI(_args: z.infer<typeof whoAmISchema>, context: McpContext) {
  const trelloConfigured = Boolean(config.TRELLO_KEY && config.TRELLO_TOKEN);
  if (!trelloConfigured) {
    return {
      success: false,
      data: null,
      summary: 'Trello credentials (TRELLO_KEY/TRELLO_TOKEN) are not configured.',
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
      summary: `Authenticated as @${(me as any).username}.`,
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


