import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloWebhook } from '../../trello/types.js';

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
    // Get webhook details
    const webhook = await trelloClient.getWebhook(webhookId);
    
    // Get model details based on idModel
    let modelInfo = null;
    try {
      // Try to get model information (could be board, card, list, etc.)
      if (webhook.idModel) {
        // First try as board
        try {
          const board = await trelloClient.getBoard(webhook.idModel, { 
            lists: 'open',
            cards: 'open'
          });
          modelInfo = {
            type: 'board',
            data: board,
            name: board.name,
            url: board.url,
          };
        } catch {
          // Try as card
          try {
            const card = await trelloClient.getCard(webhook.idModel);
            modelInfo = {
              type: 'card',
              data: card,
              name: card.name,
              url: card.url,
            };
          } catch {
            // Try as list
            try {
              const list = await trelloClient.getList(webhook.idModel);
              modelInfo = {
                type: 'list',
                data: list,
                name: list.name,
              };
            } catch {
              // Unknown model type
              modelInfo = {
                type: 'unknown',
                id: webhook.idModel,
              };
            }
          }
        }
      }
    } catch (error: any) {
      context.logger.warn({ error, modelId: webhook.idModel }, 'Failed to get model details');
    }

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
    context.logger.error({ error, webhookId }, 'Failed to read webhook resource');
    throw error;
  }
}

function createWebhookSummary(webhook: TrelloWebhook, modelInfo: any): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Webhook: ${webhook.id}`);
  lines.push('');

  // Basic Information
  lines.push('## Basic Information');
  lines.push(`- **Webhook ID**: ${webhook.id}`);
  lines.push(`- **Status**: ${webhook.active ? '🟢 Active' : '🔴 Inactive'}`);
  lines.push(`- **Callback URL**: ${webhook.callbackURL}`);
  
  if (webhook.description) {
    lines.push(`- **Description**: ${webhook.description}`);
  }
  
  // Note: dateCreated is not available in the TrelloWebhook interface from Trello API
  // lines.push(`- **Created**: ${new Date(webhook.dateCreated).toLocaleString()}`);
  
  lines.push('');

  // Model Information
  lines.push('## Monitored Model');
  lines.push(`- **Model ID**: ${webhook.idModel}`);
  
  if (modelInfo) {
    lines.push(`- **Model Type**: ${modelInfo.type.toUpperCase()}`);
    
    if (modelInfo.name) {
      lines.push(`- **Model Name**: ${modelInfo.name}`);
    }
    
    if (modelInfo.url) {
      lines.push(`- **Model URL**: ${modelInfo.url}`);
    }

    // Additional model-specific information
    if (modelInfo.type === 'board' && modelInfo.data) {
      const board = modelInfo.data;
      lines.push(`- **Lists**: ${board.lists?.length || 0}`);
      lines.push(`- **Cards**: ${board.cards?.length || 0}`);
      lines.push(`- **Organization**: ${board.idOrganization || 'Personal'}`);
      lines.push(`- **Closed**: ${board.closed ? 'Yes' : 'No'}`);
    } else if (modelInfo.type === 'card' && modelInfo.data) {
      const card = modelInfo.data;
      lines.push(`- **List**: ${card.idList}`);
      lines.push(`- **Board**: ${card.idBoard}`);
      lines.push(`- **Members**: ${card.idMembers?.length || 0}`);
      lines.push(`- **Labels**: ${card.labels?.length || 0}`);
      lines.push(`- **Due Date**: ${card.due ? new Date(card.due).toLocaleDateString() : 'None'}`);
      lines.push(`- **Closed**: ${card.closed ? 'Yes' : 'No'}`);
    } else if (modelInfo.type === 'list' && modelInfo.data) {
      const list = modelInfo.data;
      lines.push(`- **Board**: ${list.idBoard}`);
      lines.push(`- **Position**: ${list.pos}`);
      lines.push(`- **Closed**: ${list.closed ? 'Yes' : 'No'}`);
    }
  } else {
    lines.push(`- **Model Type**: Unknown`);
    lines.push(`- **Note**: Could not retrieve model details`);
  }
  
  lines.push('');

  // Webhook Events
  lines.push('## Webhook Events');
  lines.push('This webhook will receive events for the following actions on the monitored model:');
  lines.push('');
  
  if (modelInfo?.type === 'board') {
    lines.push('### Board Events:');
    lines.push('- Board updates (name, description, settings changes)');
    lines.push('- Board member additions/removals');
    lines.push('- List creation, updates, archival, and movement');
    lines.push('- Card creation, updates, movements between lists');
    lines.push('- Card member assignments and removals');
    lines.push('- Card label additions and removals');
    lines.push('- Card due date changes');
    lines.push('- Comment additions');
    lines.push('- Checklist and checklist item changes');
    lines.push('- Attachment additions and removals');
  } else if (modelInfo?.type === 'card') {
    lines.push('### Card Events:');
    lines.push('- Card updates (name, description changes)');
    lines.push('- Card movements between lists');
    lines.push('- Member assignments and removals');
    lines.push('- Label additions and removals');
    lines.push('- Due date changes');
    lines.push('- Comment additions');
    lines.push('- Checklist and checklist item changes');
    lines.push('- Attachment additions and removals');
    lines.push('- Card archival and restoration');
  } else if (modelInfo?.type === 'list') {
    lines.push('### List Events:');
    lines.push('- List updates (name changes)');
    lines.push('- List position changes');
    lines.push('- List archival and restoration');
    lines.push('- Card additions to the list');
    lines.push('- Card movements within the list');
  } else {
    lines.push('- All events related to the monitored model');
    lines.push('- Event types depend on the model type (board, card, list, etc.)');
  }
  
  lines.push('');

  // Webhook Format
  lines.push('## Webhook Payload Format');
  lines.push('Webhooks are sent as HTTP POST requests with the following structure:');
  lines.push('');
  lines.push('```json');
  lines.push('{');
  lines.push('  "action": {');
  lines.push('    "id": "action_id",');
  lines.push('    "type": "updateCard",');
  lines.push('    "date": "2024-01-01T12:00:00.000Z",');
  lines.push('    "memberCreator": {');
  lines.push('      "id": "member_id",');
  lines.push('      "username": "username",');
  lines.push('      "fullName": "Full Name"');
  lines.push('    },');
  lines.push('    "data": {');
  lines.push('      "card": { /* card object */ },');
  lines.push('      "board": { /* board object */ },');
  lines.push('      "list": { /* list object */ },');
  lines.push('      "old": { /* previous values */ }');
  lines.push('    }');
  lines.push('  },');
  lines.push('  "model": {');
  lines.push('    "id": "model_id",');
  lines.push('    "name": "Model Name",');
  lines.push('    /* model-specific properties */');
  lines.push('  }');
  lines.push('}');
  lines.push('```');
  lines.push('');

  // Management Information
  lines.push('## Management');
  lines.push('### Available Operations:');
  lines.push('- **Update**: Modify callback URL, description, or active status');
  lines.push('- **Delete**: Remove the webhook (stops all event delivery)');
  lines.push('- **Test**: Send test events to verify webhook functionality');
  lines.push('- **Monitor**: Track webhook delivery success and failures');
  lines.push('');

  // Security Considerations
  lines.push('## Security Considerations');
  lines.push('- Ensure your callback URL is secure (HTTPS recommended)');
  lines.push('- Validate webhook signatures if implemented');
  lines.push('- Handle webhook failures gracefully (Trello may retry)');
  lines.push('- Implement proper error handling for malformed payloads');
  lines.push('- Consider rate limiting on your webhook endpoint');
  lines.push('');

  // Troubleshooting
  lines.push('## Troubleshooting');
  lines.push('### Common Issues:');
  lines.push('- **Webhook not receiving events**: Check if webhook is active and URL is reachable');
  lines.push('- **Events missing**: Verify the monitored model ID is correct');
  lines.push('- **Delivery failures**: Ensure your endpoint responds with 2xx status codes');
  lines.push('- **Duplicate events**: Implement idempotency using the action ID');
  lines.push('');
  lines.push('### Testing:');
  lines.push('- Use the `test_webhook` tool to send test events');
  lines.push('- Monitor webhook logs for delivery status');
  lines.push('- Verify your endpoint is accessible from Trello\'s servers');

  return lines.join('\n');
}
