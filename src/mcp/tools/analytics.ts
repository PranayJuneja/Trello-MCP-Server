/**
 * @fileoverview This file defines a suite of analytics tools for Trello.
 * These tools provide functions to generate various analytics reports, such as
 * board overviews, user activity summaries, team performance metrics, and more.
 * Each tool has a corresponding Zod schema for input validation.
 *
 * NOTE: The current implementation uses simplified, in-memory calculations based on
 * data fetched directly from the Trello API. For more complex or historical analytics,
 * a dedicated data warehousing solution would be more appropriate.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `getBoardAnalytics` tool.
 */
export const getBoardAnalyticsSchema = z.object({
  boardId: z.string().describe('The ID of the Trello board to analyze.'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('The time range for the analysis.'),
  includeMembers: z.boolean().optional().default(true).describe('Whether to include member activity analysis.'),
  includeLabels: z.boolean().optional().default(true).describe('Whether to include label usage analysis.'),
});

/**
 * Schema for the `getUserActivity` tool.
 */
export const getUserActivitySchema = z.object({
  memberId: z.string().optional().default('me').describe("The ID of the member to analyze (or 'me' for the current user)."),
  boardId: z.string().optional().describe('An optional board ID to scope the analysis.'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('The time range for the analysis.'),
});

/**
 * Schema for the `getTeamAnalytics` tool.
 */
export const getTeamAnalyticsSchema = z.object({
  boardId: z.string().describe('The ID of the board to analyze for team performance.'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('The time range for the analysis.'),
  includeProductivity: z.boolean().optional().default(true).describe('Whether to include productivity metrics (e.g., completion rates).'),
  includeWorkload: z.boolean().optional().default(true).describe('Whether to include workload distribution.'),
});

/**
 * Schema for the `getWorkflowAnalytics` tool.
 */
export const getWorkflowAnalyticsSchema = z.object({
  boardId: z.string().describe('The ID of the board for which to analyze the workflow.'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('The time range for the analysis.'),
  analyzeCardFlow: z.boolean().optional().default(true).describe('Whether to analyze card movement between lists.'),
  analyzeBottlenecks: z.boolean().optional().default(true).describe('Whether to identify potential workflow bottlenecks.'),
});

/**
 * Schema for the `getLabelAnalytics` tool.
 */
export const getLabelAnalyticsSchema = z.object({
  boardId: z.string().describe('The ID of the board for which to analyze label usage.'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('The time range for the analysis.'),
});

/**
 * Schema for the `getProductivityMetrics` tool.
 */
export const getProductivityMetricsSchema = z.object({
  boardId: z.string().optional().describe('An optional board ID to scope the productivity analysis.'),
  memberId: z.string().optional().describe("An optional member ID to analyze an individual's productivity."),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('The time range for the analysis.'),
});

// ===== TOOL HANDLERS =====

/**
 * Generates a comprehensive analytics report for a specific Trello board.
 * @param {z.infer<typeof getBoardAnalyticsSchema>} args - The arguments for the board analytics.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves to the analytics data and a summary.
 */
export async function getBoardAnalytics(args: z.infer<typeof getBoardAnalyticsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, timeRange: args.timeRange }, 'Analyzing board metrics');
  
  const board = await trelloClient.getBoard(args.boardId, { cards: 'all', lists: 'all', members: 'all', labels: 'all' });
  
  const analytics: any = {
    overview: {
      totalCards: board.cards?.length || 0,
      activeCards: board.cards?.filter(c => !c.closed).length || 0,
      totalLists: board.lists?.length || 0,
      totalMembers: board.members?.length || 0,
      totalLabels: board.labels?.length || 0,
    },
  };
  
  if (args.includeMembers && board.members && board.cards) {
    analytics.memberActivity = board.members.map(member => {
      const assignedCards = board.cards!.filter(card => card.idMembers.includes(member.id));
      return { name: member.fullName, assignedCards: assignedCards.length };
    }).sort((a, b) => b.assignedCards - a.assignedCards);
  }
  
  if (args.includeLabels && board.labels && board.cards) {
    analytics.labelUsage = board.labels.map(label => {
      const cardsWithLabel = board.cards!.filter(card => card.labels.some(l => l.id === label.id));
      return { name: label.name, color: label.color, cardCount: cardsWithLabel.length };
    }).sort((a, b) => b.cardCount - a.cardCount);
  }
  
  return {
    success: true,
    data: analytics,
    summary: `Board analytics: ${analytics.overview.totalCards} cards, ${analytics.overview.totalLists} lists, ${analytics.overview.totalMembers} members.`,
  };
}

/**
 * Generates a summary of a specific user's activity.
 * @param {z.infer<typeof getUserActivitySchema>} args - The arguments for the user activity analysis.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves to the user activity data and a summary.
 */
export async function getUserActivity(args: z.infer<typeof getUserActivitySchema>, context: McpContext) {
  context.logger.info({ memberId: args.memberId }, 'Analyzing user activity');
  
  const member = await trelloClient.getMember(args.memberId);
  const boards = await trelloClient.listBoards(args.memberId);
  
  const activity = {
    member: { fullName: member.fullName, username: member.username },
    metrics: { totalBoards: boards.length },
  };
  
  return {
    success: true,
    data: activity,
    summary: `User ${member.fullName} is a member of ${boards.length} boards.`,
  };
}

/**
 * Generates an analysis of team performance on a specific board.
 * @param {z.infer<typeof getTeamAnalyticsSchema>} args - The arguments for the team analytics.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves to the team analytics data and a summary.
 */
export async function getTeamAnalytics(args: z.infer<typeof getTeamAnalyticsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId }, 'Analyzing team performance');
  
  const board = await trelloClient.getBoard(args.boardId, { cards: 'all', members: 'all' });
  const teamAnalytics: any = {
    team: { totalMembers: board.members?.length || 0 },
  };
  
  if (args.includeProductivity && board.members && board.cards) {
    teamAnalytics.productivity = board.members.map(member => {
      const assigned = board.cards!.filter(card => card.idMembers.includes(member.id));
      const completed = assigned.filter(card => card.closed);
      return { name: member.fullName, assigned: assigned.length, completed: completed.length };
    }).sort((a, b) => b.completed - a.completed);
  }
  
  return {
    success: true,
    data: teamAnalytics,
    summary: `Team analytics for board ${board.name} covering ${teamAnalytics.team.totalMembers} members.`,
  };
}

/**
 * Analyzes the workflow of a specific board, focusing on card flow and bottlenecks.
 * @param {z.infer<typeof getWorkflowAnalyticsSchema>} args - The arguments for the workflow analysis.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves to the workflow analytics data and a summary.
 */
export async function getWorkflowAnalytics(args: z.infer<typeof getWorkflowAnalyticsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId }, 'Analyzing workflow');
  
  const board = await trelloClient.getBoard(args.boardId, { cards: 'all', lists: 'all' });
  const workflowAnalytics: any = {
    workflow: { totalLists: board.lists?.length || 0, totalCards: board.cards?.length || 0 },
  };
  
  if (args.analyzeCardFlow && board.lists && board.cards) {
    workflowAnalytics.listFlow = board.lists.map(list => {
      const cardsInList = board.cards!.filter(card => card.idList === list.id);
      return { name: list.name, cardCount: cardsInList.length };
    }).sort((a, b) => a.position - b.position);
  }
  
  if (args.analyzeBottlenecks && board.lists && board.cards) {
    workflowAnalytics.bottlenecks = board.lists.map(list => {
      const cardsInList = board.cards!.filter(card => card.idList === list.id && !card.closed);
      return { name: list.name, activeCards: cardsInList.length };
    }).sort((a, b) => b.activeCards - a.activeCards).slice(0, 3);
  }
  
  return {
    success: true,
    data: workflowAnalytics,
    summary: `Workflow analysis complete. Found ${workflowAnalytics.workflow.totalLists} lists.`,
  };
}

/**
 * Analyzes the usage of labels on a specific board.
 * @param {z.infer<typeof getLabelAnalyticsSchema>} args - The arguments for the label analysis.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves to the label analytics data and a summary.
 */
export async function getLabelAnalytics(args: z.infer<typeof getLabelAnalyticsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId }, 'Analyzing label usage');
  
  const board = await trelloClient.getBoard(args.boardId, { cards: 'all', labels: 'all' });
  const labeledCards = board.cards?.filter(card => card.labels.length > 0).length || 0;
  
  const labelAnalytics: any = {
    overview: {
      totalLabels: board.labels?.length || 0,
      totalCards: board.cards?.length || 0,
      labeledCards,
    },
  };
  
  return {
    success: true,
    data: labelAnalytics,
    summary: `Label analytics: ${labeledCards}/${labelAnalytics.overview.totalCards} cards are labeled.`,
  };
}

/**
 * Gathers and calculates various productivity metrics for a given scope (board or member).
 * @param {z.infer<typeof getProductivityMetricsSchema>} args - The arguments for the productivity metrics.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves to the productivity metrics and a summary.
 */
export async function getProductivityMetrics(args: z.infer<typeof getProductivityMetricsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, memberId: args.memberId }, 'Analyzing productivity metrics');
  
  let cards: any[] = [];
  if (args.boardId) {
    const board = await trelloClient.getBoard(args.boardId, { cards: 'all' });
    cards = board.cards || [];
    if (args.memberId) {
      cards = cards.filter(card => card.idMembers.includes(args.memberId!));
    }
  }
  
  const completedCards = cards.filter(card => card.closed);
  const overdueCards = cards.filter(card => card.due && new Date(card.due) < new Date() && !card.dueComplete);

  const metrics = {
    velocity: { cardsCompleted: completedCards.length },
    quality: { cardsWithDescription: cards.filter(c => c.desc).length },
    efficiency: { overdueCards: overdueCards.length },
  };
  
  return {
    success: true,
    data: metrics,
    summary: `Productivity metrics: ${metrics.velocity.cardsCompleted} cards completed, ${metrics.efficiency.overdueCards} overdue.`,
  };
}
