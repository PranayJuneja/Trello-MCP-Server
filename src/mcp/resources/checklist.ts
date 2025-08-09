import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloChecklist } from '../../trello/types.js';

export async function readChecklistResource(uri: string, context: McpContext) {
  // Extract checklist ID from URI: trello:checklist/{id}
  const match = uri.match(/^trello:checklist\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid checklist URI format: ${uri}`);
  }
  
  const checklistId = match[1];
  if (!checklistId) {
    throw new Error('Checklist ID is required');
  }
  context.logger.info({ checklistId }, 'Reading checklist resource');
  
  // Get checklist with check items
  const checklist = await trelloClient.getChecklist(checklistId);
  
  // Get board and card context for additional information
  let board = null;
  let card = null;
  
  try {
    // Get the board the checklist is on
    const boardData = await trelloClient.getChecklistBoard(checklistId);
    board = boardData;
    
    // Get the card the checklist is on
    const cardData = await trelloClient.getChecklistCard(checklistId);
    if (cardData && cardData.length > 0) {
      card = cardData[0]; // Take the first card (checklists can only be on one card)
    }
  } catch (error) {
    context.logger.warn({ error: (error as Error).message }, 'Could not get context information for checklist');
  }
  
  // Create a human-readable summary
  const summary = createChecklistSummary(checklist, board, card);
  
  return {
    summary,
    checklist: {
      ...checklist,
      board,
      card,
    },
  };
}

function createChecklistSummary(checklist: TrelloChecklist, board: any, card: any): string {
  const lines: string[] = [];
  
  lines.push(`# Checklist: ${checklist.name}`);
  lines.push('');
  
  // Context information
  if (board || card) {
    lines.push(`## Context`);
    if (board) {
      lines.push(`Board: ${board.name}`);
      if (board.url) {
        lines.push(`Board URL: ${board.url}`);
      }
    }
    if (card) {
      lines.push(`Card: ${card.name}`);
      if (card.url) {
        lines.push(`Card URL: ${card.url}`);
      }
    }
    lines.push('');
  }
  
  // Basic information
  lines.push(`## Checklist Details`);
  lines.push(`ID: ${checklist.id}`);
  lines.push(`Position: ${checklist.pos}`);
  
  // Check items summary
  const totalItems = checklist.checkItems.length;
  const completedItems = checklist.checkItems.filter(item => item.state === 'complete').length;
  const incompleteItems = totalItems - completedItems;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  lines.push(`Total Items: ${totalItems}`);
  lines.push(`Completed: ${completedItems}`);
  lines.push(`Incomplete: ${incompleteItems}`);
  lines.push(`Progress: ${completionPercentage}%`);
  lines.push('');
  
  // Progress bar visualization
  if (totalItems > 0) {
    lines.push(`## Progress Bar`);
    const progressBarLength = 20;
    const filledBars = Math.round((completedItems / totalItems) * progressBarLength);
    const emptyBars = progressBarLength - filledBars;
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    lines.push(`[${progressBar}] ${completionPercentage}%`);
    lines.push('');
  }
  
  // Check items list
  if (checklist.checkItems.length > 0) {
    lines.push(`## Check Items`);
    
    // Sort items by position
    const sortedItems = checklist.checkItems.sort((a, b) => a.pos - b.pos);
    
    // Group by completion status
    const incompleteItemsList = sortedItems.filter(item => item.state === 'incomplete');
    const completedItemsList = sortedItems.filter(item => item.state === 'complete');
    
    // Show incomplete items first
    if (incompleteItemsList.length > 0) {
      lines.push(`### Incomplete Items (${incompleteItemsList.length})`);
      incompleteItemsList.forEach((item, index) => {
        const dueInfo = item.due ? ` [Due: ${new Date(item.due).toLocaleDateString()}]` : '';
        const memberInfo = item.idMember ? ` [Assigned to: ${item.idMember}]` : '';
        lines.push(`${index + 1}. ☐ ${item.name}${dueInfo}${memberInfo}`);
      });
      lines.push('');
    }
    
    // Show completed items
    if (completedItemsList.length > 0) {
      lines.push(`### Completed Items (${completedItemsList.length})`);
      completedItemsList.forEach((item, index) => {
        const dueInfo = item.due ? ` [Due: ${new Date(item.due).toLocaleDateString()}]` : '';
        const memberInfo = item.idMember ? ` [Assigned to: ${item.idMember}]` : '';
        lines.push(`${index + 1}. ✅ ${item.name}${dueInfo}${memberInfo}`);
      });
      lines.push('');
    }
  } else {
    lines.push(`## Check Items`);
    lines.push(`No items in this checklist yet.`);
    lines.push('');
  }
  
  // Statistics and insights
  if (checklist.checkItems.length > 0) {
    lines.push(`## Statistics`);
    
    // Items with due dates
    const itemsWithDueDates = checklist.checkItems.filter(item => item.due);
    if (itemsWithDueDates.length > 0) {
      lines.push(`Items with due dates: ${itemsWithDueDates.length}`);
      
      // Overdue items
      const now = new Date();
      const overdueItems = itemsWithDueDates.filter(item => 
        item.state === 'incomplete' && new Date(item.due!) < now
      );
      if (overdueItems.length > 0) {
        lines.push(`⚠️ Overdue items: ${overdueItems.length}`);
      }
      
      // Upcoming items (due within 7 days)
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingItems = itemsWithDueDates.filter(item => 
        item.state === 'incomplete' && 
        new Date(item.due!) >= now && 
        new Date(item.due!) <= weekFromNow
      );
      if (upcomingItems.length > 0) {
        lines.push(`📅 Due within 7 days: ${upcomingItems.length}`);
      }
    }
    
    // Assigned items
    const assignedItems = checklist.checkItems.filter(item => item.idMember);
    if (assignedItems.length > 0) {
      lines.push(`Assigned items: ${assignedItems.length}`);
    }
    
    lines.push('');
  }
  
  // Recent activity insights
  if (checklist.checkItems.length > 0) {
    // Find most recently updated items based on position (rough approximation)
    const recentItems = checklist.checkItems
      .filter(item => item.state === 'complete')
      .slice(-3); // Get last 3 completed items
    
    if (recentItems.length > 0) {
      lines.push(`## Recently Completed`);
      recentItems.forEach(item => {
        lines.push(`- ✅ ${item.name}`);
      });
      lines.push('');
    }
  }
  
  return lines.join('\n');
}
