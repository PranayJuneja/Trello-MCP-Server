import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloLabel } from '../../trello/types.js';

export async function readLabelResource(uri: string, context: McpContext) {
  // Extract label ID from URI: trello:label/{id}
  const match = uri.match(/^trello:label\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid label URI format: ${uri}`);
  }
  
  const labelId = match[1];
  if (!labelId) {
    throw new Error('Label ID is required');
  }
  context.logger.info({ labelId }, 'Reading label resource');
  
  // Get label details
  const label = await trelloClient.getLabel(labelId);
  
  // Get board context for additional information
  let board = null;
  let labelUsage = {
    cardsUsingLabel: [] as any[],
    boardsWithLabel: [] as any[],
    totalBoardUses: 0,
  };
  
  try {
    // Try to get board information if we can find it
    // Since we only have the label ID, we'll need to search for boards using this label
    // For now, we'll just use the label's basic information
    
    // Get the board this label belongs to (if we can determine it)
    if (label.idBoard) {
      try {
        board = await trelloClient.getBoard(label.idBoard, { 
          fields: 'name,url,desc',
          cards: 'open',
          labels: 'all'
        });
        
        // Find cards using this label on the board
        if (board.cards) {
          labelUsage.cardsUsingLabel = board.cards.filter(card => 
            card.labels.some(cardLabel => cardLabel.id === labelId)
          );
        }
        
        labelUsage.boardsWithLabel = [board];
        labelUsage.totalBoardUses = 1;
      } catch (error) {
        context.logger.warn({ error: (error as Error).message }, 'Could not get board context for label');
      }
    }
  } catch (error) {
    context.logger.warn({ error: (error as Error).message }, 'Could not get usage information for label');
  }
  
  // Create a human-readable summary
  const summary = createLabelSummary(label, board, labelUsage);
  
  return {
    summary,
    label: {
      ...label,
      board,
      usage: labelUsage,
    },
  };
}

function createLabelSummary(
  label: TrelloLabel, 
  board: any, 
  usage: { cardsUsingLabel: any[]; boardsWithLabel: any[]; totalBoardUses: number; }
): string {
  const lines: string[] = [];
  
  lines.push(`# Label: ${label.name || 'Unnamed Label'}`);
  lines.push('');
  
  // Basic information
  lines.push(`## Label Details`);
  lines.push(`ID: ${label.id}`);
  lines.push(`Color: ${label.color ? getColorDisplay(label.color) : 'No color'}`);
  lines.push(`Uses: ${label.uses}`);
  
  if (board) {
    lines.push(`Board: ${board.name}`);
    if (board.url) {
      lines.push(`Board URL: ${board.url}`);
    }
  }
  lines.push('');
  
  // Color visualization
  if (label.color) {
    lines.push(`## Color Preview`);
    lines.push(`${getColorEmoji(label.color)} ${label.color.toUpperCase()}`);
    lines.push(`${getColorBar(label.color)}`);
    lines.push('');
  }
  
  // Usage statistics
  lines.push(`## Usage Statistics`);
  lines.push(`Total Uses: ${label.uses}`);
  lines.push(`Cards Using Label: ${usage.cardsUsingLabel.length}`);
  
  if (usage.cardsUsingLabel.length > 0) {
    const completedCards = usage.cardsUsingLabel.filter(card => card.closed).length;
    const activeCards = usage.cardsUsingLabel.length - completedCards;
    lines.push(`- Active Cards: ${activeCards}`);
    lines.push(`- Completed Cards: ${completedCards}`);
    
    // Calculate usage percentage if we have board context
    if (board && board.cards) {
      const usagePercentage = Math.round((usage.cardsUsingLabel.length / board.cards.length) * 100);
      lines.push(`- Usage on Board: ${usagePercentage}% of cards`);
    }
  }
  lines.push('');
  
  // Cards using this label
  if (usage.cardsUsingLabel.length > 0) {
    lines.push(`## Cards Using This Label`);
    
    // Group by list if we have that information
    const cardsByList = new Map<string, any[]>();
    const cardsWithoutList: any[] = [];
    
    usage.cardsUsingLabel.forEach(card => {
      if (card.idList) {
        if (!cardsByList.has(card.idList)) {
          cardsByList.set(card.idList, []);
        }
        cardsByList.get(card.idList)!.push(card);
      } else {
        cardsWithoutList.push(card);
      }
    });
    
    // Show cards grouped by list
    if (cardsByList.size > 0) {
      for (const [listId, cards] of cardsByList) {
        // Try to find list name from board data
        let listName = listId;
        if (board && board.lists) {
          const list = board.lists.find((l: any) => l.id === listId);
          if (list) {
            listName = list.name;
          }
        }
        
        lines.push(`### ${listName} (${cards.length} cards)`);
        cards.slice(0, 10).forEach((card, index) => {
          const status = card.closed ? '✅' : '📝';
          const dueInfo = card.due ? ` [Due: ${new Date(card.due).toLocaleDateString()}]` : '';
          const memberInfo = card.idMembers.length > 0 ? ` [${card.idMembers.length} members]` : '';
          lines.push(`${index + 1}. ${status} ${card.name}${dueInfo}${memberInfo}`);
        });
        
        if (cards.length > 10) {
          lines.push(`... and ${cards.length - 10} more cards`);
        }
        lines.push('');
      }
    }
    
    // Show ungrouped cards
    if (cardsWithoutList.length > 0) {
      lines.push(`### Other Cards (${cardsWithoutList.length})`);
      cardsWithoutList.slice(0, 10).forEach((card, index) => {
        const status = card.closed ? '✅' : '📝';
        const dueInfo = card.due ? ` [Due: ${new Date(card.due).toLocaleDateString()}]` : '';
        lines.push(`${index + 1}. ${status} ${card.name}${dueInfo}`);
      });
      
      if (cardsWithoutList.length > 10) {
        lines.push(`... and ${cardsWithoutList.length - 10} more cards`);
      }
      lines.push('');
    }
  } else {
    lines.push(`## Cards Using This Label`);
    lines.push(`No cards are currently using this label.`);
    lines.push('');
  }
  
  // Label management suggestions
  if (usage.cardsUsingLabel.length === 0 && label.uses === 0) {
    lines.push(`## Management Suggestions`);
    lines.push(`⚠️ This label is not being used. Consider:`);
    lines.push(`- Applying it to relevant cards`);
    lines.push(`- Renaming it to be more descriptive`);
    lines.push(`- Deleting it if no longer needed`);
    lines.push('');
  } else if (usage.cardsUsingLabel.length > 20) {
    lines.push(`## Management Suggestions`);
    lines.push(`📊 This label is heavily used (${usage.cardsUsingLabel.length} cards). Consider:`);
    lines.push(`- Breaking it down into more specific sub-labels`);
    lines.push(`- Using it as a primary category label`);
    lines.push(`- Ensuring consistent usage across the team`);
    lines.push('');
  }
  
  // Color coordination info
  if (label.color && board) {
    lines.push(`## Color Coordination`);
    lines.push(`This label uses **${label.color}** color.`);
    
    // If we have board context, suggest color coordination
    if (board.labels) {
      const sameColorLabels = board.labels.filter((l: any) => l.color === label.color && l.id !== label.id);
      if (sameColorLabels.length > 0) {
        lines.push(`Other labels with ${label.color} color on this board:`);
        sameColorLabels.forEach((otherLabel: any) => {
          lines.push(`- ${otherLabel.name || 'Unnamed'}`);
        });
        lines.push(`Consider using different colors for better visual distinction.`);
      } else {
        lines.push(`This is the only ${label.color} label on the board - good for unique identification!`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

function getColorDisplay(color: string): string {
  const colorMap: Record<string, string> = {
    green: '🟢 Green',
    yellow: '🟡 Yellow',
    orange: '🟠 Orange',
    red: '🔴 Red',
    purple: '🟣 Purple',
    blue: '🔵 Blue',
    sky: '🔵 Sky Blue',
    lime: '🟢 Lime',
    pink: '🌸 Pink',
    black: '⚫ Black',
  };
  return colorMap[color] || `🏷️ ${color}`;
}

function getColorEmoji(color: string): string {
  const emojiMap: Record<string, string> = {
    green: '🟢',
    yellow: '🟡',
    orange: '🟠',
    red: '🔴',
    purple: '🟣',
    blue: '🔵',
    sky: '💙',
    lime: '🟢',
    pink: '🌸',
    black: '⚫',
  };
  return emojiMap[color] || '🏷️';
}

function getColorBar(color: string): string {
  const colorBars: Record<string, string> = {
    green: '████████████████████ 🟢',
    yellow: '████████████████████ 🟡',
    orange: '████████████████████ 🟠',
    red: '████████████████████ 🔴',
    purple: '████████████████████ 🟣',
    blue: '████████████████████ 🔵',
    sky: '████████████████████ 💙',
    lime: '████████████████████ 🟢',
    pink: '████████████████████ 🌸',
    black: '████████████████████ ⚫',
  };
  return colorBars[color] || '████████████████████ 🏷️';
}
