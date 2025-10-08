/**
 * @fileoverview Defines the handler for the `trello:webhook` MCP resource.
 * This module is responsible for fetching details about a specific Trello webhook,
 * identifying the model it's attached to (board, card, etc.), and formatting this
 * information into a comprehensive, human-readable summary.
 */
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloWebhook } from '../../trello/types.js';

/**
 * Reads and processes a Trello webhook resource from its URI.
 * It fetches the webhook's details and attempts to fetch the details of the
 * model it monitors to provide richer context.
 * @param {string} uri - The MCP resource URI for the webhook (e.g., `trello:webhook/{id}`).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves to an MCP content object containing the webhook summary.
 * @throws {Error} If the URI format is invalid or the webhook ID is missing.
 */
export async function readWebhookResource(uri: string, context: McpContext) {
  // Extract webhook ID from URI like "trello:webhook/{id}"
  const match = uri.match(/^trello:webhook\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid webhook URI format: ${uri}`);
  }

  const webhookId = match[1];
  if (!webhookId) {
    throw new Error(`Invalid webhook ID in URI: ${uri}`);
  }
  
  context.logger.info({ webhookId }, 'Reading webhook resource');

  try {
    // Get the core webhook details.
    const webhook = await trelloClient.getWebhook(webhookId);
    
    // Attempt to get details about the monitored model for richer context.
    let modelInfo = null;
    if (webhook.idModel) {
      try {
        // This block attempts to identify the model type by trying to fetch it as different resources.
        // It's a best-effort approach since the webhook object itself doesn't include the model type.
        // First try as board
        const board = await trelloClient.getBoard(webhook.idModel).catch(() => null);
        if (board) {
          modelInfo = { type: 'board', data: board, name: board.name, url: board.url };
        } else {
          // Try as card
          const card = await trelloClient.getCard(webhook.idModel).catch(() => null);
          if (card) {
            modelInfo = { type: 'card', data: card, name: card.name, url: card.url };
          } else {
            // Try as list
            const list = await trelloClient.getList(webhook.idModel).catch(() => null);
            if (list) {
              modelInfo = { type: 'list', data: list, name: list.name };
            } else {
              modelInfo = { type: 'unknown', id: webhook.idModel };
            }
          }
        }
      } catch (error: any) {
        context.logger.warn({ error: error.message, modelId: webhook.idModel }, 'Failed to get model details for webhook');
      }
    }

    // Create a human-readable summary.
    const summary = createWebhookSummary(webhook, modelInfo);

    return {
      contents: [
        {
          type: 'text',
          text: summary,
        },
      ],
    };
  } catch (error: any) {
    context.logger.error({ error: error.message, webhookId }, 'Failed to read webhook resource');
    throw error;
  }
}

/**
 * Creates a detailed, human-readable summary of a Trello webhook in Markdown format.
 * The summary includes the webhook's configuration, details about the model it
 * monitors, expected event types, and a sample payload structure.
 * @param {TrelloWebhook} webhook - The Trello webhook object.
 * @param {any} modelInfo - An object containing details about the monitored model, or null if not found.
 * @returns {string} A string containing the Markdown-formatted summary.
 */
function createWebhookSummary(webhook: TrelloWebhook, modelInfo: any): string {
  const lines: string[] = [];

  lines.push(`# Webhook: ${webhook.id}`);
  lines.push('');
  lines.push('## Webhook Configuration');
  lines.push(`- **ID**: ${webhook.id}`);
  lines.push(`- **Status**: ${webhook.active ? '🟢 Active' : '🔴 Inactive'}`);
  lines.push(`- **Callback URL**: \`${webhook.callbackURL}\``);
  if (webhook.description) {
    lines.push(`- **Description**: ${webhook.description}`);
  }
  lines.push('');

  lines.push('## Monitored Resource');
  lines.push(`- **Model ID**: \`${webhook.idModel}\``);
  if (modelInfo) {
    lines.push(`- **Model Type**: ${modelInfo.type.toUpperCase()}`);
    if (modelInfo.name) lines.push(`- **Name**: ${modelInfo.name}`);
    if (modelInfo.url) lines.push(`- **URL**: [View Resource](${modelInfo.url})`);
  } else {
    lines.push(`- **Note**: Could not retrieve model details.`);
  }
  lines.push('');

  lines.push('## Expected Events');
  lines.push('This webhook receives notifications for actions on the monitored resource.');
  if (modelInfo?.type === 'board') {
    lines.push('Example events include: card creation, list updates, member changes, etc.');
  } else if (modelInfo?.type === 'card') {
    lines.push('Example events include: description changes, comments, attachment additions, etc.');
  }
  lines.push('');

  lines.push('## Sample Payload');
  lines.push('Payloads are sent via HTTP POST with a structure similar to this:');
  lines.push('```json');
  lines.push('{');
  lines.push('  "action": { "id": "...", "type": "updateCard", ... },');
  lines.push('  "model": { "id": "...", "name": "...", ... }');
  lines.push('}');
  lines.push('```');
  lines.push('');

  lines.push('## Management & Troubleshooting');
  lines.push('- To modify this webhook, use the Trello API or developer tools.');
  lines.push('- Ensure the callback URL is publicly accessible and responds with a `200 OK` status.');
  lines.push(`- Trello will retry delivery on failure. This webhook has **${webhook.consecutiveFailures}** consecutive failures.`);
  if(webhook.firstConsecutiveFailDate) {
    lines.push(`- Failures started on: ${new Date(webhook.firstConsecutiveFailDate).toLocaleString()}`);
  }
  lines.push('');

  return lines.join('\n');
}
