/**
 * @fileoverview Defines the handler for the `trello:card` MCP resource.
 * This module is responsible for fetching detailed information about a specific Trello card,
 * including its context (board, list), members, labels, checklists, attachments, and comments.
 * It formats this data into a human-readable summary and a structured object.
 */
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloCard } from '../../trello/types.js';

/**
 * Reads and processes a Trello card resource from its URI.
 * It fetches a comprehensive view of the card and generates a structured object
 * and a detailed, human-readable summary in Markdown.
 * @param {string} uri - The MCP resource URI for the card (e.g., `trello:card/{id}`).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<{summary: string, card: TrelloCard}>} A promise that resolves to an object
 * containing the summary and the full Trello card data.
 * @throws {Error} If the URI format is invalid or the card ID is missing.
 */
export async function readCardResource(uri: string, context: McpContext): Promise<{summary: string, card: TrelloCard}> {
  // Extract card ID from URI: trello:card/{id}
  const match = uri.match(/^trello:card\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid card URI format: ${uri}`);
  }
  
  const cardId = match[1];
  if (!cardId) {
    throw new Error('Card ID is required');
  }
  context.logger.info({ cardId }, 'Reading card resource');
  
  // Get card with comprehensive details for a full picture.
  const card = await trelloClient.getCard(cardId, {
    actions: 'commentCard', // Fetch comments specifically.
    attachments: true,
    members: true,
    checklists: 'all',
    board: true, // Include board context.
    board_fields: 'name,url',
    list: true, // Include list context.
    list_fields: 'name',
  });
  
  // Create a human-readable summary of the card.
  const summary = createCardSummary(card);
  
  return {
    summary,
    card,
  };
}

/**
 * Creates a detailed, human-readable summary of a Trello card in Markdown format.
 * The summary includes the card's description, context, dates, members, labels,
 * checklists, attachments, recent comments, and an activity summary.
 * @param {TrelloCard} card - The Trello card object to summarize.
 * @returns {string} A string containing the Markdown-formatted summary.
 */
function createCardSummary(card: TrelloCard): string {
  const lines: string[] = [];
  
  lines.push(`# Card: ${card.name}`);
  
  // Basic information
  if (card.desc) {
    lines.push(`Description: ${card.desc}`);
  }
  lines.push(`URL: ${card.url}`);
  lines.push(`Status: ${card.closed ? 'Archived' : 'Active'}`);
  lines.push(`Position: ${card.pos}`);
  lines.push('');
  
  // Context information
  lines.push(`## Context`);
  if ((card as any).board) {
    lines.push(`Board: ${(card as any).board.name}`);
    lines.push(`Board URL: ${(card as any).board.url}`);
  }
  if ((card as any).list) {
    lines.push(`List: ${(card as any).list.name}`);
  }
  lines.push('');
  
  // Due dates and completion
  if (card.due || card.start) {
    lines.push(`## Dates`);
    if (card.start) {
      const startDate = new Date(card.start);
      lines.push(`Start Date: ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}`);
    }
    if (card.due) {
      const dueDate = new Date(card.due);
      const status = card.dueComplete ? ' ✅ Completed' : ' ⏰ Pending';
      lines.push(`Due Date: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}${status}`);
    }
    lines.push('');
  }
  
  // Members
  if (card.members && card.members.length > 0) {
    lines.push(`## Assigned Members (${card.members.length})`);
    card.members.forEach(member => {
      lines.push(`- ${member.fullName || member.username} (@${member.username})`);
    });
    lines.push('');
  } else if (card.idMembers.length > 0) {
    lines.push(`## Assigned Members (${card.idMembers.length})`);
    card.idMembers.forEach(memberId => {
      lines.push(`- Member ID: ${memberId}`);
    });
    lines.push('');
  }
  
  // Labels
  if (card.labels && card.labels.length > 0) {
    lines.push(`## Labels (${card.labels.length})`);
    card.labels.forEach(label => {
      const color = label.color ? ` (${label.color})` : '';
      lines.push(`- ${label.name || 'Unnamed'}${color}`);
    });
    lines.push('');
  }
  
  // Checklists
  if (card.checklists && card.checklists.length > 0) {
    lines.push(`## Checklists (${card.checklists.length})`);
    card.checklists.forEach(checklist => {
      const completed = checklist.checkItems.filter(item => item.state === 'complete').length;
      const total = checklist.checkItems.length;
      lines.push(`### ${checklist.name} (${completed}/${total} completed)`);
      
      if (checklist.checkItems.length > 0) {
        checklist.checkItems.forEach(item => {
          const status = item.state === 'complete' ? '✅' : '☐';
          lines.push(`  ${status} ${item.name}`);
        });
      }
      lines.push('');
    });
  }
  
  // Attachments
  if (card.attachments && card.attachments.length > 0) {
    lines.push(`## Attachments (${card.attachments.length})`);
    card.attachments.forEach(attachment => {
      const size = attachment.bytes ? ` (${Math.round(attachment.bytes / 1024)}KB)` : '';
      const type = attachment.mimeType ? ` [${attachment.mimeType}]` : '';
      lines.push(`- [${attachment.name}](${attachment.url})${size}${type}`);
    });
    lines.push('');
  }
  
  // Comments and activity
  if (card.actions && card.actions.length > 0) {
    const comments = card.actions.filter(action => action.type === 'commentCard');
    if (comments.length > 0) {
      lines.push(`## Recent Comments (${comments.length})`);
      // Show most recent 5 comments for brevity.
      const recentComments = comments.slice(0, 5);
      recentComments.forEach(comment => {
        const date = new Date(comment.date);
        const author = comment.memberCreator?.fullName || comment.memberCreator?.username || 'Unknown';
        lines.push(`### ${author} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
        if (comment.data && comment.data.text) {
          lines.push(comment.data.text);
        }
        lines.push('');
      });
      
      if (comments.length > 5) {
        lines.push(`... and ${comments.length - 5} more comments`);
        lines.push('');
      }
    }
  }
  
  // Statistics from badges
  if (card.badges) {
    lines.push(`## Activity Summary`);
    if (card.badges.votes > 0) {
      lines.push(`- Votes: ${card.badges.votes}`);
    }
    if (card.badges.comments > 0) {
      lines.push(`- Comments: ${card.badges.comments}`);
    }
    if (card.badges.attachments > 0) {
      lines.push(`- Attachments: ${card.badges.attachments}`);
    }
    if (card.badges.checkItems > 0) {
      lines.push(`- Checklist Items: ${card.badges.checkItemsChecked}/${card.badges.checkItems} completed`);
    }
    if (card.badges.description) {
      lines.push(`- Has Description: Yes`);
    }
    if (card.badges.subscribed) {
      lines.push(`- Subscribed: Yes`);
    }
    lines.push('');
  }
  
  // Last activity
  if (card.dateLastActivity) {
    const lastActivity = new Date(card.dateLastActivity);
    lines.push(`Last Activity: ${lastActivity.toLocaleDateString()} ${lastActivity.toLocaleTimeString()}`);
  }
  
  return lines.join('\n');
}
