/**
 * @fileoverview This file defines the MCP tools for interacting with Trello webhooks.
 * It includes functions for creating, listing, retrieving, updating, and deleting webhooks.
 * Each tool has a corresponding Zod schema for input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `createWebhook` tool.
 */
export const createWebhookSchema = z.object({
  callbackURL: z.string().url().describe('The URL that the webhook will POST to.'),
  idModel: z.string().describe('The ID of the model (e.g., board, card, list) to watch for changes.'),
  description: z.string().max(16384).optional().describe('A description for the webhook.'),
  active: z.boolean().optional().default(true).describe('Whether the webhook is active.'),
});

/**
 * Schema for the `listWebhooks` tool.
 */
export const listWebhooksSchema = z.object({
  token: z.string().optional().default('current').describe("The token to list webhooks for (defaults to the API key's token)."),
});

/**
 * Schema for the `getWebhook` tool.
 */
export const getWebhookSchema = z.object({
  webhookId: z.string().describe('The ID of the webhook to retrieve.'),
});

/**
 * Schema for the `updateWebhook` tool.
 */
export const updateWebhookSchema = z.object({
  webhookId: z.string().describe('The ID of the webhook to update.'),
  description: z.string().max(16384).optional().describe('A new description for the webhook.'),
  callbackURL: z.string().url().optional().describe('A new callback URL for the webhook.'),
  active: z.boolean().optional().describe('A new active status for the webhook.'),
});

/**
 * Schema for the `deleteWebhook` tool.
 */
export const deleteWebhookSchema = z.object({
  webhookId: z.string().describe('The ID of the webhook to delete.'),
});

// ===== TOOL HANDLERS =====

/**
 * Creates a new Trello webhook.
 * @param {z.infer<typeof createWebhookSchema>} args - The arguments for creating the webhook.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the new webhook data.
 */
export async function createWebhook(args: z.infer<typeof createWebhookSchema>, context: McpContext) {
  context.logger.info({ callbackURL: args.callbackURL, idModel: args.idModel }, 'Creating webhook');
  const webhook = await trelloClient.createWebhook(args);
  return {
    success: true,
    data: webhook,
    summary: `Created webhook ${webhook.id} for model ${args.idModel}.`,
  };
}

/**
 * Lists all webhooks associated with the current API token.
 * @param {z.infer<typeof listWebhooksSchema>} args - The arguments for listing webhooks.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a list of webhooks.
 */
export async function listWebhooks(args: z.infer<typeof listWebhooksSchema>, context: McpContext) {
  context.logger.info({ token: args.token }, 'Listing webhooks');
  const webhooks = await trelloClient.listWebhooks(args.token);
  return {
    success: true,
    data: webhooks,
    summary: `Found ${webhooks.length} webhooks.`,
  };
}

/**
 * Retrieves a single webhook by its ID.
 * @param {z.infer<typeof getWebhookSchema>} args - The arguments for getting a webhook.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the webhook data.
 */
export async function getWebhook(args: z.infer<typeof getWebhookSchema>, context: McpContext) {
  context.logger.info({ webhookId: args.webhookId }, 'Getting webhook details');
  const webhook = await trelloClient.getWebhook(args.webhookId);
  return {
    success: true,
    data: webhook,
    summary: `Retrieved webhook ${args.webhookId}.`,
  };
}

/**
 * Updates an existing webhook.
 * @param {z.infer<typeof updateWebhookSchema>} args - The ID of the webhook and fields to update.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated webhook data.
 */
export async function updateWebhook(args: z.infer<typeof updateWebhookSchema>, context: McpContext) {
  context.logger.info({ webhookId: args.webhookId }, 'Updating webhook');
  const { webhookId, ...updateData } = args;
  const webhook = await trelloClient.updateWebhook(webhookId, updateData);
  return {
    success: true,
    data: webhook,
    summary: `Updated webhook ${args.webhookId}.`,
  };
}

/**
 * Deletes a webhook.
 * @param {z.infer<typeof deleteWebhookSchema>} args - The ID of the webhook to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of deletion.
 */
export async function deleteWebhook(args: z.infer<typeof deleteWebhookSchema>, context: McpContext) {
  context.logger.info({ webhookId: args.webhookId }, 'Deleting webhook');
  await trelloClient.deleteWebhook(args.webhookId);
  return {
    success: true,
    data: { deleted: true, id: args.webhookId },
    summary: `Deleted webhook ${args.webhookId}.`,
  };
}