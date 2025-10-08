/**
 * @fileoverview Defines the handler for the `trello:checklist` MCP resource.
 * This module fetches a Trello checklist, enriches it with context about its parent
 * board and card, and formats the data into a structured object and a detailed,
 * human-readable summary for use in an MCP client.
 */
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloChecklist, TrelloBoard, TrelloCard } from '../../trello/types.js';

/**
 * Reads and processes a Trello checklist resource from its URI.
 * It fetches the checklist, its parent board and card for context, and then
 * generates a structured object and a comprehensive, human-readable summary.
 * @param {string} uri - The MCP resource URI for the checklist (e.g., `trello:checklist/{id}`).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves to an object containing the summary
 * and the enriched checklist data.
 * @throws {Error} If the URI format is invalid or the checklist ID is missing.
 */
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
  
  // Get the core checklist data.
  const checklist = await trelloClient.getChecklist(checklistId);
  
  // Initialize context variables.
  let board: TrelloBoard | null = null;
  let card: TrelloCard | null = null;
  
  try {
    // Fetch the board and card context for additional information.
    board = await trelloClient.getChecklistBoard(checklistId);
    const cardData = await trelloClient.getChecklistCard(checklistId);
    if (cardData && cardData.length > 0) {
      card = cardData[0]; // A checklist belongs to a single card.
    }
  } catch (error) {
    context.logger.warn({ error: (error as Error).message }, 'Could not get context information for checklist');
  }
  
  // Create a human-readable summary.
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

/**
 * Creates a detailed, human-readable summary of a Trello checklist in Markdown format.
 * The summary includes context, progress statistics, a progress bar, and a detailed
 * breakdown of complete and incomplete items.
 * @param {TrelloChecklist} checklist - The core Trello checklist object.
 * @param {TrelloBoard | null} board - The parent board object, for context.
 * @param {TrelloCard | null} card - The parent card object, for context.
 * @returns {string} A string containing the Markdown-formatted summary.
 */
function createChecklistSummary(checklist: TrelloChecklist, board: TrelloBoard | null, card: TrelloCard | null): string {
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
    
    const sortedItems = checklist.checkItems.sort((a, b) => a.pos - b.pos);
    const incompleteItemsList = sortedItems.filter(item => item.state === 'incomplete');
    const completedItemsList = sortedItems.filter(item => item.state === 'complete');
    
    // Show incomplete items first for better visibility of pending tasks.
    if (incompleteItemsList.length > 0) {
      lines.push(`### Incomplete Items (${incompleteItemsList.length})`);
      incompleteItemsList.forEach((item, index) => {
        const dueInfo = item.due ? ` [Due: ${new Date(item.due).toLocaleDateString()}]` : '';
        const memberInfo = item.idMember ? ` [Assigned to: ${item.idMember}]` : '';
        lines.push(`${index + 1}. ☐ ${item.name}${dueInfo}${memberInfo}`);
      });
      lines.push('');
    }
    
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
    
    const itemsWithDueDates = checklist.checkItems.filter(item => item.due);
    if (itemsWithDueDates.length > 0) {
      lines.push(`Items with due dates: ${itemsWithDueDates.length}`);
      
      const now = new Date();
      const overdueItems = itemsWithDueDates.filter(item => 
        item.state === 'incomplete' && new Date(item.due!) < now
      );
      if (overdueItems.length > 0) {
        lines.push(`⚠️ Overdue items: ${overdueItems.length}`);
      }
      
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
    
    const assignedItems = checklist.checkItems.filter(item => item.idMember);
    if (assignedItems.length > 0) {
      lines.push(`Assigned items: ${assignedItems.length}`);
    }
    lines.push('');
  }
  
  // Recent activity insights
  if (checklist.checkItems.length > 0) {
    // A simple heuristic for recent activity: show the last few completed items.
    const recentItems = checklist.checkItems
      .filter(item => item.state === 'complete')
      .slice(-3);
    
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
