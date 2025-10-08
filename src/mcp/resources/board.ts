/**
 * @fileoverview Defines the handler for the `trello:board` MCP resource.
 * This module is responsible for fetching detailed information about a specific Trello board,
 * including its lists, cards, members, and labels, and then formatting this data into
 * a human-readable summary and a structured object for consumption by an MCP client.
 */
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloBoard } from '../../trello/types.js';

/**
 * Reads and processes a Trello board resource based on its URI.
 * It fetches comprehensive details for the specified board and generates both
 * a structured data object and a human-readable summary.
 * @param {string} uri - The MCP resource URI for the board (e.g., `trello:board/{id}`).
 * @param {McpContext} context - The MCP context, containing the logger.
 * @returns {Promise<{summary: string, board: TrelloBoard}>} A promise that resolves to an object
 * containing the human-readable summary and the full Trello board object.
 * @throws {Error} If the URI format is invalid or the board ID is missing.
 */
export async function readBoardResource(uri: string, context: McpContext): Promise<{summary: string, board: TrelloBoard}> {
  // Extract board ID from URI: trello:board/{id}
  const match = uri.match(/^trello:board\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid board URI format: ${uri}`);
  }
  
  const boardId = match[1];
  if (!boardId) {
    throw new Error('Board ID is required');
  }
  context.logger.info({ boardId }, 'Reading board resource');
  
  // Get board with lists, cards (limited), labels, and members for a comprehensive view.
  const board = await trelloClient.getBoard(boardId, {
    lists: 'open',
    cards: 'open',
    labels: 'all',
    members: 'all',
    fields: 'all',
  });
  
  // Create a human-readable summary of the board.
  const summary = createBoardSummary(board);
  
  return {
    summary,
    board,
  };
}

/**
 * Creates a detailed, human-readable summary of a Trello board in Markdown format.
 * @param {TrelloBoard} board - The Trello board object to summarize.
 * @returns {string} A string containing the Markdown-formatted summary.
 */
function createBoardSummary(board: TrelloBoard): string {
  const lines: string[] = [];
  
  lines.push(`# Board: ${board.name}`);
  if (board.desc) {
    lines.push(`Description: ${board.desc}`);
  }
  lines.push(`URL: ${board.url}`);
  lines.push(`Status: ${board.closed ? 'Closed' : 'Open'}`);
  lines.push('');
  
  // Organization info
  if (board.idOrganization) {
    lines.push(`Organization: ${board.idOrganization}`);
  }
  
  // Members
  if (board.members && board.members.length > 0) {
    lines.push(`## Members (${board.members.length})`);
    board.members.forEach(member => {
      lines.push(`- ${member.fullName || member.username} (@${member.username})`);
    });
    lines.push('');
  }
  
  // Labels
  if (board.labels && board.labels.length > 0) {
    lines.push(`## Labels (${board.labels.length})`);
    board.labels.forEach(label => {
      const color = label.color ? ` (${label.color})` : '';
      lines.push(`- ${label.name || 'Unnamed'}${color}`);
    });
    lines.push('');
  }
  
  // Lists and cards
  if (board.lists && board.lists.length > 0) {
    lines.push(`## Lists and Cards (${board.lists.length} lists)`);
    
    board.lists.forEach(list => {
      const listCards = board.cards?.filter(card => card.idList === list.id) || [];
      lines.push(`### ${list.name} (${listCards.length} cards)`);
      
      if (listCards.length > 0) {
        // Show up to 10 cards per list for a concise summary.
        const cardsToShow = listCards.slice(0, 10);
        cardsToShow.forEach(card => {
          const dueInfo = card.due ? ` [Due: ${new Date(card.due).toLocaleDateString()}]` : '';
          const memberInfo = card.idMembers.length > 0 ? ` [${card.idMembers.length} members]` : '';
          const labelInfo = card.labels.length > 0 ? ` [${card.labels.length} labels]` : '';
          lines.push(`- ${card.name}${dueInfo}${memberInfo}${labelInfo}`);
        });
        
        if (listCards.length > 10) {
          lines.push(`- ... and ${listCards.length - 10} more cards`);
        }
      }
      lines.push('');
    });
  }
  
  // Preferences summary
  if (board.prefs) {
    lines.push('## Board Settings');
    lines.push(`- Permission Level: ${board.prefs.permissionLevel}`);
    lines.push(`- Comments: ${board.prefs.comments}`);
    lines.push(`- Voting: ${board.prefs.voting}`);
    lines.push(`- Self Join: ${board.prefs.selfJoin ? 'Enabled' : 'Disabled'}`);
    lines.push(`- Card Covers: ${board.prefs.cardCovers ? 'Enabled' : 'Disabled'}`);
    lines.push('');
  }
  
  // Activity info
  if (board.dateLastActivity) {
    const lastActivity = new Date(board.dateLastActivity);
    lines.push(`Last Activity: ${lastActivity.toLocaleDateString()} ${lastActivity.toLocaleTimeString()}`);
  }
  
  return lines.join('\n');
}
