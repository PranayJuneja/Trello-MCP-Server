/**
 * @fileoverview Defines the handler for the `trello:label` MCP resource.
 * This module is responsible for fetching a Trello label, enriching it with context
 * about its parent board and usage (i.e., which cards use it), and then formatting
 * this data into a structured object and a detailed, human-readable summary.
 */
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloLabel, TrelloBoard, TrelloCard } from '../../trello/types.js';

/**
 * Reads and processes a Trello label resource from its URI.
 * It fetches the label's details, its parent board, and a list of cards that use it.
 * This data is then used to generate a structured object and a comprehensive summary.
 * @param {string} uri - The MCP resource URI for the label (e.g., `trello:label/{id}`).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves to an object containing the summary and the enriched label data.
 * @throws {Error} If the URI format is invalid or the label ID is missing.
 */
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
  
  // Get the core label details.
  const label = await trelloClient.getLabel(labelId);
  
  // Initialize context and usage variables.
  let board: TrelloBoard | null = null;
  const labelUsage = {
    cardsUsingLabel: [] as TrelloCard[],
  };
  
  try {
    // If the label has a board ID, fetch the board and its cards to determine usage.
    if (label.idBoard) {
      try {
        board = await trelloClient.getBoard(label.idBoard, { 
          fields: 'name,url,desc',
          cards: 'open', // Fetch open cards to check for label usage.
          labels: 'all'
        });
        
        // Filter the board's cards to find those using this specific label.
        if (board.cards) {
          labelUsage.cardsUsingLabel = board.cards.filter(card => 
            card.labels.some(cardLabel => cardLabel.id === labelId)
          );
        }
      } catch (error) {
        context.logger.warn({ error: (error as Error).message }, 'Could not get board context for label');
      }
    }
  } catch (error) {
    context.logger.warn({ error: (error as Error).message }, 'Could not get usage information for label');
  }
  
  // Create a human-readable summary.
  const summary = createLabelSummary(label, board, labelUsage);
  
  return {
    summary,
    label: {
      ...label,
      board,
      usage: {
        ...labelUsage,
        totalBoardUses: board ? 1 : 0, // Simplified: assumes label is on one board.
      },
    },
  };
}

/**
 * Creates a detailed, human-readable summary of a Trello label in Markdown format.
 * The summary includes the label's details, color visualization, usage statistics,
 * a list of cards using the label, and management suggestions.
 * @param {TrelloLabel} label - The core Trello label object.
 * @param {TrelloBoard | null} board - The parent board object, for context.
 * @param {{ cardsUsingLabel: TrelloCard[] }} usage - An object containing usage data.
 * @returns {string} A string containing the Markdown-formatted summary.
 */
function createLabelSummary(
  label: TrelloLabel, 
  board: TrelloBoard | null,
  usage: { cardsUsingLabel: TrelloCard[] }
): string {
  const lines: string[] = [];
  
  lines.push(`# Label: ${label.name || 'Unnamed Label'}`);
  lines.push('');
  
  // Basic information
  lines.push(`## Label Details`);
  lines.push(`ID: ${label.id}`);
  lines.push(`Color: ${label.color ? getColorDisplay(label.color) : 'No color'}`);
  lines.push(`Uses (on this board): ${usage.cardsUsingLabel.length}`); // Trello's `uses` can be across boards. This is more specific.
  
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
  lines.push(`Total Cards Using Label (on this board): ${usage.cardsUsingLabel.length}`);
  
  if (usage.cardsUsingLabel.length > 0) {
    const archivedCards = usage.cardsUsingLabel.filter(card => card.closed).length;
    const activeCards = usage.cardsUsingLabel.length - archivedCards;
    lines.push(`- Active Cards: ${activeCards}`);
    lines.push(`- Archived Cards: ${archivedCards}`);
    
    // Calculate usage percentage if we have board context with cards.
    if (board && board.cards && board.cards.length > 0) {
      const usagePercentage = Math.round((usage.cardsUsingLabel.length / board.cards.length) * 100);
      lines.push(`- Usage on Board: ~${usagePercentage}% of open cards`);
    }
  }
  lines.push('');
  
  // Cards using this label
  if (usage.cardsUsingLabel.length > 0) {
    lines.push(`## Cards Using This Label (up to 10 shown)`);
    
    // Group cards by their list for better organization.
    const cardsByList = new Map<string, TrelloCard[]>();
    
    usage.cardsUsingLabel.forEach(card => {
      if (card.idList) {
        if (!cardsByList.has(card.idList)) {
          cardsByList.set(card.idList, []);
        }
        cardsByList.get(card.idList)!.push(card);
      }
    });
    
    // Display cards grouped by list.
    if (cardsByList.size > 0 && board && (board as any).lists) {
      for (const [listId, cards] of cardsByList) {
        const list = (board as any).lists.find((l: any) => l.id === listId);
        const listName = list ? list.name : `List ID: ${listId}`;
        
        lines.push(`### In List: ${listName} (${cards.length} cards)`);
        cards.slice(0, 10).forEach((card, index) => {
          const status = card.closed ? '✅' : '📝';
          const dueInfo = card.due ? ` [Due: ${new Date(card.due).toLocaleDateString()}]` : '';
          lines.push(`${index + 1}. ${status} ${card.name}${dueInfo}`);
        });
        lines.push('');
      }
    }
  } else {
    lines.push(`## Cards Using This Label`);
    lines.push(`No open cards on this board are currently using this label.`);
    lines.push('');
  }
  
  // Label management suggestions
  if (usage.cardsUsingLabel.length === 0) {
    lines.push(`## Management Suggestions`);
    lines.push(`⚠️ This label is not used on any open cards on this board. Consider archiving or deleting it if it's no longer relevant.`);
    lines.push('');
  } else if (usage.cardsUsingLabel.length > 20) {
    lines.push(`## Management Suggestions`);
    lines.push(`📊 This label is heavily used. Ensure its meaning is clear and consistently applied by the team.`);
    lines.push('');
  }
  
  // Color coordination info
  if (label.color && board && board.labels) {
    lines.push(`## Color Coordination`);
    lines.push(`This label uses the **${label.color}** color.`);
    
    const sameColorLabels = board.labels.filter((l: any) => l.color === label.color && l.id !== label.id);
    if (sameColorLabels.length > 0) {
      lines.push(`Other labels with the same color on this board:`);
      sameColorLabels.forEach((otherLabel: any) => {
        lines.push(`- ${otherLabel.name || 'Unnamed'}`);
      });
      lines.push(`Consider using different colors for better visual distinction if needed.`);
    } else {
      lines.push(`This is the only ${label.color} label on the board, which is great for unique identification!`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Returns a user-friendly string representation of a Trello color, including an emoji.
 * @param {string} color - The Trello color name (e.g., 'green', 'blue').
 * @returns {string} The display-friendly color string.
 */
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

/**
 * Returns an emoji corresponding to a Trello color.
 * @param {string} color - The Trello color name.
 * @returns {string} The corresponding emoji or a default tag emoji.
 */
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

/**
 * Creates a simple text-based bar visualization for a Trello color.
 * @param {string} color - The Trello color name.
 * @returns {string} A string representing a colored bar with an emoji.
 */
function getColorBar(color: string): string {
  // This is a creative way to "visualize" the color in a text-only summary.
  const emoji = getColorEmoji(color);
  return `████████████████████ ${emoji}`;
}
