/**
 * @fileoverview Defines the handler for the `trello:report` MCP resource.
 * This module acts as a dispatcher for various types of reports (dashboards, analytics, etc.).
 * It parses the report URI, calls the appropriate data generation function, and
 * creates a human-readable summary for the MCP client.
 *
 * NOTE: The current implementation uses mock data for demonstration purposes.
 * In a real-world scenario, the `generate...` functions would fetch and process
 * data from persistent storage or a data warehouse.
 */
import { McpContext } from '../server.js';

/**
 * Reads and processes a Trello report resource from its URI.
 * It acts as a dispatcher, routing the request to the correct report generation
 * and summarization function based on the report type specified in the URI.
 * @param {string} uri - The MCP resource URI for the report (e.g., `trello:report/{type}/{id}`).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves to an MCP content object containing the report summary.
 * @throws {Error} If the URI format is invalid or the report type is unsupported.
 */
export async function readReportResource(uri: string, context: McpContext) {
  // Extract report ID and type from URI like "trello:report/{type}/{id}"
  const match = uri.match(/^trello:report\/(.+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid report URI format: ${uri}. Expected format: trello:report/{type}/{id}`);
  }

  const reportType = match[1];
  const reportId = match[2];
  
  if (!reportType || !reportId) {
    throw new Error(`Invalid report type or ID in URI: ${uri}`);
  }
  
  context.logger.info({ reportType, reportId }, 'Reading report resource');

  try {
    let reportData;
    let reportSummary;

    switch (reportType) {
      case 'dashboard':
        reportData = await generateDashboardReport(reportId, context);
        reportSummary = createDashboardSummary(reportData);
        break;
      case 'analytics':
        reportData = await generateAnalyticsReport(reportId, context);
        reportSummary = createAnalyticsReportSummary(reportData);
        break;
      case 'export':
        reportData = await generateExportReport(reportId, context);
        reportSummary = createExportReportSummary(reportData);
        break;
      case 'scheduled':
        reportData = await generateScheduledReportSummary(reportId, context);
        reportSummary = createScheduledReportSummary(reportData);
        break;
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    return {
      contents: [
        {
          type: 'text',
          text: reportSummary,
        },
      ],
    };
  } catch (error: any) {
    context.logger.error({ error, reportType, reportId }, 'Failed to read report resource');
    throw error;
  }
}

/**
 * Generates mock data for a dashboard report.
 * @param {string} dashboardId - The ID of the dashboard.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<any>} A promise that resolves to the mock dashboard data.
 */
async function generateDashboardReport(dashboardId: string, context: McpContext): Promise<any> {
  // In a real implementation, this would fetch dashboard data from a database or analytics service.
  return {
    id: dashboardId,
    name: 'Project Alpha Dashboard',
    description: 'Live overview of Project Alpha metrics and progress.',
    widgets: [
      { type: 'board_overview', title: 'Board Statistics', data: { totalCards: 45, completedCards: 23, inProgressCards: 15, todoCards: 7 }},
      { type: 'completion_chart', title: 'Completion Trends', data: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], completed: [5, 8, 12, 15], created: [7, 10, 14, 18] }},
      { type: 'member_activity', title: 'Team Activity', data: { members: [{ name: 'John Doe', actions: 23 }, { name: 'Jane Smith', actions: 18 }]}},
    ],
    lastUpdated: new Date().toISOString(),
    accessCount: 42,
  };
}

/**
 * Generates mock data for an analytics report.
 * @param {string} reportId - The ID of the report.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<any>} A promise that resolves to the mock analytics data.
 */
async function generateAnalyticsReport(reportId: string, context: McpContext): Promise<any> {
  // Mock analytics report data
  return {
    id: reportId,
    type: 'team_productivity',
    title: 'Team Productivity Analysis',
    dateRange: { startDate: '2024-01-01T00:00:00Z', endDate: '2024-01-31T23:59:59Z' },
    metrics: { totalCards: 156, completedCards: 98, completionRate: 0.628, averageCompletionTime: 4.2, teamVelocity: 12.3, collaborationIndex: 0.75 },
    trends: { completionRateTrend: 'increasing', velocityTrend: 'stable', collaborationTrend: 'improving' },
    insights: [ 'Team completion rate has improved by 15% compared to last month.', 'Average card completion time has decreased from 5.1 to 4.2 days.'],
    recommendations: [ 'Implement daily standups to maintain momentum.', 'Create templates for recurring card types.' ],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates mock data for an export report.
 * @param {string} exportId - The ID of the export.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<any>} A promise that resolves to the mock export data.
 */
async function generateExportReport(exportId: string, context: McpContext): Promise<any> {
  // Mock export report data
  return {
    id: exportId,
    type: 'board_export',
    boardName: 'Product Development',
    format: 'json',
    status: 'completed',
    exportedAt: new Date().toISOString(),
    fileSize: '2.3 MB',
    recordCount: { boards: 1, lists: 8, cards: 156, comments: 234, attachments: 67, checklists: 89 },
    downloadUrl: `/exports/${exportId}/download`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  };
}

/**
 * Generates mock data for a scheduled report configuration.
 * @param {string} reportId - The ID of the scheduled report.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<any>} A promise that resolves to the mock scheduled report data.
 */
async function generateScheduledReportSummary(reportId: string, context: McpContext): Promise<any> {
  // Mock scheduled report data
  return {
    id: reportId,
    name: 'Weekly Team Performance Report',
    type: 'team_productivity',
    schedule: { frequency: 'weekly', dayOfWeek: 1, time: '09:00', timezone: 'UTC' },
    recipients: [ { email: 'manager@company.com', name: 'Project Manager' }, { email: 'lead@company.com', name: 'Team Lead' }],
    lastExecuted: '2024-01-15T09:00:00Z',
    nextExecution: '2024-01-22T09:00:00Z',
    executionCount: 12,
    successRate: 1.0,
    enabled: true,
    createdAt: '2023-10-01T10:00:00Z',
  };
}

/**
 * Creates a human-readable summary for a dashboard report.
 * @param {any} dashboard - The dashboard data object.
 * @returns {string} A Markdown-formatted summary of the dashboard.
 */
function createDashboardSummary(dashboard: any): string {
  const lines: string[] = [];

  lines.push(`# Dashboard: ${dashboard.name}`);
  lines.push('');
  lines.push('## Overview');
  lines.push(`- **ID**: ${dashboard.id}`);
  lines.push(`- **Description**: ${dashboard.description}`);
  lines.push(`- **Widgets**: ${dashboard.widgets.length}`);
  lines.push(`- **Last Updated**: ${new Date(dashboard.lastUpdated).toLocaleString()}`);
  lines.push('');

  lines.push('## Dashboard Widgets');
  dashboard.widgets.forEach((widget: any, index: number) => {
    lines.push(`### ${index + 1}. ${widget.title}`);
    lines.push(`- **Type**: ${widget.type.replace(/_/g, ' ').toUpperCase()}`);
    if (widget.type === 'board_overview' && widget.data) {
      lines.push(`- **Total Cards**: ${widget.data.totalCards}`);
      lines.push(`- **Completed**: ${widget.data.completedCards} (${Math.round((widget.data.completedCards / widget.data.totalCards) * 100)}%)`);
    } else if (widget.type === 'member_activity' && widget.data) {
      lines.push(`- **Team Members**: ${widget.data.members.length}`);
      const totalActions = widget.data.members.reduce((sum: number, member: any) => sum + member.actions, 0);
      lines.push(`- **Total Actions**: ${totalActions}`);
    }
    lines.push('');
  });

  lines.push('## Performance Insights');
  const boardWidget = dashboard.widgets.find((w: any) => w.type === 'board_overview');
  if (boardWidget && boardWidget.data) {
    const completionRate = (boardWidget.data.completedCards / boardWidget.data.totalCards) * 100;
    if (completionRate > 70) {
      lines.push('🟢 **Excellent Progress**: Your team is maintaining a high completion rate.');
    } else {
      lines.push('🟡 **Good Progress**: Steady progress with room for improvement.');
    }
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Creates a human-readable summary for an analytics report.
 * @param {any} report - The analytics report data object.
 * @returns {string} A Markdown-formatted summary of the report.
 */
function createAnalyticsReportSummary(report: any): string {
  const lines: string[] = [];

  lines.push(`# Analytics Report: ${report.title}`);
  lines.push('');
  lines.push('## Report Overview');
  lines.push(`- **ID**: ${report.id}`);
  lines.push(`- **Analysis Period**: ${new Date(report.dateRange.startDate).toLocaleDateString()} - ${new Date(report.dateRange.endDate).toLocaleDateString()}`);
  lines.push('');

  lines.push('## Key Performance Metrics');
  if (report.metrics) {
    lines.push(`- **Completion Rate**: ${Math.round(report.metrics.completionRate * 100)}%`);
    lines.push(`- **Average Completion Time**: ${report.metrics.averageCompletionTime} days`);
    lines.push(`- **Team Velocity**: ${report.metrics.teamVelocity} cards/week`);
  }
  lines.push('');

  lines.push('## Key Insights');
  if (report.insights && report.insights.length > 0) {
    report.insights.forEach((insight: string) => lines.push(`- ${insight}`));
  }
  lines.push('');

  lines.push('## Recommendations');
  if (report.recommendations && report.recommendations.length > 0) {
    report.recommendations.forEach((rec: string) => lines.push(`- ${rec}`));
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Creates a human-readable summary for an export report.
 * @param {any} exportData - The export report data object.
 * @returns {string} A Markdown-formatted summary of the export.
 */
function createExportReportSummary(exportData: any): string {
  const lines: string[] = [];

  lines.push(`# Export Report: ${exportData.boardName}`);
  lines.push('');
  lines.push('## Export Details');
  lines.push(`- **ID**: ${exportData.id}`);
  lines.push(`- **Format**: ${exportData.format.toUpperCase()}`);
  lines.push(`- **Status**: ${exportData.status.toUpperCase()}`);
  lines.push(`- **Exported On**: ${new Date(exportData.exportedAt).toLocaleString()}`);
  lines.push('');

  lines.push('## Export Statistics');
  if (exportData.recordCount) {
    lines.push(`- **Cards**: ${exportData.recordCount.cards}`);
    lines.push(`- **Comments**: ${exportData.recordCount.comments}`);
    lines.push(`- **Attachments**: ${exportData.recordCount.attachments}`);
  }
  lines.push('');

  lines.push('## Download Information');
  lines.push(`- **URL**: ${exportData.downloadUrl}`);
  lines.push(`- **Expires**: ${new Date(exportData.expiresAt).toLocaleString()}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Creates a human-readable summary for a scheduled report configuration.
 * @param {any} reportData - The scheduled report data object.
 * @returns {string} A Markdown-formatted summary of the scheduled report.
 */
function createScheduledReportSummary(reportData: any): string {
  const lines: string[] = [];

  lines.push(`# Scheduled Report: ${reportData.name}`);
  lines.push('');
  lines.push('## Configuration');
  lines.push(`- **ID**: ${reportData.id}`);
  lines.push(`- **Status**: ${reportData.enabled ? '🟢 Active' : '🔴 Disabled'}`);
  lines.push('');

  lines.push('## Schedule Details');
  lines.push(`- **Frequency**: ${reportData.schedule.frequency.toUpperCase()}`);
  lines.push(`- **Time**: ${reportData.schedule.time} ${reportData.schedule.timezone}`);
  lines.push(`- **Next Run**: ${new Date(reportData.nextExecution).toLocaleString()}`);
  lines.push('');

  lines.push('## Recipients');
  reportData.recipients.forEach((recipient: any) => {
    lines.push(`- **${recipient.name}** <${recipient.email}>`);
  });
  lines.push('');

  return lines.join('\n');
}
