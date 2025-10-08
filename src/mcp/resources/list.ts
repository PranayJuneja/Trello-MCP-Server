/**
 * @fileoverview Defines the handler for the `trello:list` MCP resource.
 * This module is responsible for fetching a Trello list, its associated cards,
 * and its parent board context. It then formats this data into a structured object
 * and a detailed, human-readable summary for use in an MCP client.
 */
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloList, TrelloBoard, TrelloCard } from '../../trello/types.js';

/**
 * Reads and processes a Trello list resource from its URI.
 * It fetches the list's details, all cards within that list, and information
 * about the board it belongs to. This data is then used to generate a structured
 * object and a comprehensive summary.
 * @param {string} uri - The MCP resource URI for the list (e.g., `trello:list/{id}`).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves to an object containing the summary and the enriched list data.
 * @throws {Error} If the URI format is invalid or the list ID is missing.
 */
export async function readListResource(uri: string, context: McpContext) {
  // Extract list ID from URI: trello:list/{id}
  const match = uri.match(/^trello:list\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid list URI format: ${uri}`);
  }
  
  const listId = match[1];
  if (!listId) {
    throw new Error('List ID is required');
  }
  context.logger.info({ listId }, 'Reading list resource');
  
  // Get the core list details.
  const list = await trelloClient.getList(listId);
  
  // Fetch all lists on the board to get the cards for our target list.
  // This is more efficient than fetching cards for a list directly in some Trello API versions.
  const boardLists = await trelloClient.listLists(list.idBoard, 'all');
  const listWithCards = boardLists.find(l => l.id === listId);
  
  // Get board info for context.
  const board = await trelloClient.getBoard(list.idBoard, { fields: 'name,url' });
  
  // Create a human-readable summary.
  const summary = createListSummary(list, listWithCards, board);
  
  return {
    summary,
    list: {
      ...list,
      cards: listWithCards?.cards || [],
      board: {
        id: board.id,
        name: board.name,
        url: board.url,
      },
    },
  };
}

/**
 * Creates a detailed, human-readable summary of a Trello list in Markdown format.
 * The summary includes the list's context, a summary of its cards (open vs. archived),
 * and a detailed view of the open and recently archived cards.
 * @param {TrelloList} list - The core Trello list object.
 * @param {TrelloList | undefined} listWithCards - The list object, hopefully populated with its cards.
 * @param {Pick<TrelloBoard, 'name' | 'url'>} board - The parent board object, for context.
 * @returns {string} A string containing the Markdown-formatted summary.
 */
function createListSummary(list: TrelloList, listWithCards: TrelloList | undefined, board: Pick<TrelloBoard, 'name' | 'url'>): string {
  const lines: string[] = [];
  
  lines.push(`# List: ${list.name}`);
  lines.push(`Board: ${board.name}`);
  lines.push(`URL: ${board.url}`);
  lines.push(`Status: ${list.closed ? 'Archived' : 'Active'}`);
  lines.push(`Position: ${list.pos}`);
  lines.push('');
  
  // Cards information
  const cards = listWithCards?.cards || [];
  const openCards = cards.filter(card => !card.closed);
  const closedCards = cards.filter(card => card.closed);
  
  lines.push(`## Cards Summary`);
  lines.push(`- Total Cards: ${cards.length}`);
  lines.push(`- Open Cards: ${openCards.length}`);
  lines.push(`- Archived Cards: ${closedCards.length}`);
  lines.push('');
  
  if (openCards.length > 0) {
    lines.push(`## Open Cards (${openCards.length})`);
    
    // Sort cards by their position in the list.
    const sortedCards = openCards.sort((a, b) => a.pos - b.pos);
    
    // Show up to 20 cards for a concise yet informative view.
    const cardsToShow = sortedCards.slice(0, 20);
    cardsToShow.forEach((card: TrelloCard, index: number) => {
      const dueInfo = card.due ? ` [Due: ${new Date(card.due).toLocaleDateString()}]` : '';
      const memberInfo = card.idMembers.length > 0 ? ` [${card.idMembers.length} members]` : '';
      const labelInfo = card.labels.length > 0 ? ` [${card.labels.length} labels]` : '';
      const attachmentInfo = card.badges.attachments > 0 ? ` [📎${card.badges.attachments}]` : '';
      const commentInfo = card.badges.comments > 0 ? ` [💬${card.badges.comments}]` : '';
      const checklistInfo = card.badges.checkItems > 0 ? 
        ` [✅${card.badges.checkItemsChecked}/${card.badges.checkItems}]` : '';
      
      lines.push(`${index + 1}. ${card.name}${dueInfo}${memberInfo}${labelInfo}${attachmentInfo}${commentInfo}${checklistInfo}`);
      
      if (card.desc) {
        const shortDesc = card.desc.length > 100 ? card.desc.substring(0, 100) + '...' : card.desc;
        lines.push(`   > ${shortDesc.replace(/\n/g, ' ')}`);
      }
    });
    
    if (openCards.length > 20) {
      lines.push(`... and ${openCards.length - 20} more cards`);
    }
    lines.push('');
  }
  
  if (closedCards.length > 0) {
    lines.push(`## Archived Cards (${closedCards.length})`);
    // Show the 5 most recently archived cards.
    const recentlyClosed = closedCards
      .sort((a, b) => new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime())
      .slice(0, 5);
    
    recentlyClosed.forEach(card => {
      const lastActivity = new Date(card.dateLastActivity);
      lines.push(`- ${card.name} (archived on ${lastActivity.toLocaleDateString()})`);
    });
    
    if (closedCards.length > 5) {
      lines.push(`... and ${closedCards.length - 5} more archived cards`);
    }
    lines.push('');
  }
  
  // Determine the last activity date based on the most recently active card.
  if (cards.length > 0) {
    const lastActivity = cards.reduce((latest, card) => {
      const cardActivity = new Date(card.dateLastActivity);
      return cardActivity > latest ? cardActivity : latest;
    }, new Date(0));
    
    if (lastActivity.getTime() > 0) {
      lines.push(`Last Activity in List: ${lastActivity.toLocaleDateString()} ${lastActivity.toLocaleTimeString()}`);
    }
  }
  
  return lines.join('\n');
}
