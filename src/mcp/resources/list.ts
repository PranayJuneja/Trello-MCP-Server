import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloList } from '../../trello/types.js';

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
  
  // Get list details
  const list = await trelloClient.getList(listId);
  
  // Get board lists with cards to find this list's cards
  const boardLists = await trelloClient.listLists(list.idBoard, 'all');
  const listWithCards = boardLists.find(l => l.id === listId);
  
  // Get board info for context
  const board = await trelloClient.getBoard(list.idBoard, { fields: 'name,url' });
  
  // Create a human-readable summary
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

function createListSummary(list: TrelloList, listWithCards: TrelloList | undefined, board: any): string {
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
    
    // Sort cards by position
    const sortedCards = openCards.sort((a, b) => a.pos - b.pos);
    
    // Show up to 20 cards
    const cardsToShow = sortedCards.slice(0, 20);
    cardsToShow.forEach((card, index) => {
      const dueInfo = card.due ? ` [Due: ${new Date(card.due).toLocaleDateString()}]` : '';
      const memberInfo = card.idMembers.length > 0 ? ` [${card.idMembers.length} members]` : '';
      const labelInfo = card.labels.length > 0 ? ` [${card.labels.length} labels]` : '';
      const attachmentInfo = card.badges.attachments > 0 ? ` [${card.badges.attachments} attachments]` : '';
      const commentInfo = card.badges.comments > 0 ? ` [${card.badges.comments} comments]` : '';
      const checklistInfo = card.badges.checkItems > 0 ? 
        ` [${card.badges.checkItemsChecked}/${card.badges.checkItems} checklist items]` : '';
      
      lines.push(`${index + 1}. ${card.name}${dueInfo}${memberInfo}${labelInfo}${attachmentInfo}${commentInfo}${checklistInfo}`);
      
      if (card.desc) {
        const shortDesc = card.desc.length > 100 ? card.desc.substring(0, 100) + '...' : card.desc;
        lines.push(`   Description: ${shortDesc}`);
      }
    });
    
    if (openCards.length > 20) {
      lines.push(`... and ${openCards.length - 20} more cards`);
    }
    lines.push('');
  }
  
  if (closedCards.length > 0) {
    lines.push(`## Archived Cards (${closedCards.length})`);
    const recentlyClosed = closedCards
      .sort((a, b) => new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime())
      .slice(0, 5);
    
    recentlyClosed.forEach(card => {
      const lastActivity = new Date(card.dateLastActivity);
      lines.push(`- ${card.name} (archived ${lastActivity.toLocaleDateString()})`);
    });
    
    if (closedCards.length > 5) {
      lines.push(`... and ${closedCards.length - 5} more archived cards`);
    }
    lines.push('');
  }
  
  // Activity information
  if (cards.length > 0) {
    const lastActivity = cards.reduce((latest, card) => {
      const cardActivity = new Date(card.dateLastActivity);
      return cardActivity > latest ? cardActivity : latest;
    }, new Date(0));
    
    lines.push(`Last Activity: ${lastActivity.toLocaleDateString()} ${lastActivity.toLocaleTimeString()}`);
  }
  
  return lines.join('\n');
}
