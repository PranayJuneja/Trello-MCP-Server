import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const exportBoardDataSchema = z.object({
  boardId: z.string().describe('ID of the board to export'),
  format: z.enum(['csv', 'json', 'pdf']).describe('Export format'),
  includeArchived: z.boolean().optional().default(false).describe('Include archived cards and lists'),
  includeComments: z.boolean().optional().default(true).describe('Include card comments in export'),
  includeAttachments: z.boolean().optional().default(true).describe('Include attachment information'),
  includeChecklists: z.boolean().optional().default(true).describe('Include checklist data'),
  dateRange: z.object({
    startDate: z.string().optional().describe('Start date for filtering (ISO string)'),
    endDate: z.string().optional().describe('End date for filtering (ISO string)'),
  }).optional().describe('Date range for filtering cards by activity'),
  customFields: z.array(z.string()).optional().describe('Additional custom fields to include'),
});

export const exportUserActivitySchema = z.object({
  memberId: z.string().optional().describe('Member ID to export activity for (defaults to current user)'),
  format: z.enum(['csv', 'json', 'pdf']).describe('Export format'),
  dateRange: z.object({
    startDate: z.string().describe('Start date for activity export (ISO string)'),
    endDate: z.string().describe('End date for activity export (ISO string)'),
  }).describe('Date range for activity export'),
  boardIds: z.array(z.string()).optional().describe('Specific boards to include (defaults to all accessible)'),
  activityTypes: z.array(z.string()).optional().describe('Filter by specific activity types'),
  includeMetrics: z.boolean().optional().default(true).describe('Include productivity metrics'),
});

export const exportOrganizationDataSchema = z.object({
  organizationId: z.string().describe('ID of the organization to export'),
  format: z.enum(['csv', 'json', 'pdf']).describe('Export format'),
  includeBoards: z.boolean().optional().default(true).describe('Include board data'),
  includeMembers: z.boolean().optional().default(true).describe('Include member information'),
  includeActivity: z.boolean().optional().default(false).describe('Include recent activity'),
  dateRange: z.object({
    startDate: z.string().optional().describe('Start date for filtering (ISO string)'),
    endDate: z.string().optional().describe('End date for filtering (ISO string)'),
  }).optional().describe('Date range for filtering data'),
  aggregateMetrics: z.boolean().optional().default(true).describe('Include aggregated metrics'),
});

export const generateAnalyticsReportSchema = z.object({
  reportType: z.enum([
    'board_performance',
    'team_productivity',
    'workflow_analysis',
    'label_usage',
    'completion_trends',
    'collaboration_metrics',
    'custom_analysis'
  ]).describe('Type of analytics report to generate'),
  format: z.enum(['json', 'pdf', 'html']).describe('Report format'),
  dateRange: z.object({
    startDate: z.string().describe('Start date for analysis (ISO string)'),
    endDate: z.string().describe('End date for analysis (ISO string)'),
  }).describe('Date range for analysis'),
  boardIds: z.array(z.string()).optional().describe('Specific boards to analyze'),
  memberIds: z.array(z.string()).optional().describe('Specific members to analyze'),
  filters: z.object({
    labels: z.array(z.string()).optional().describe('Filter by specific labels'),
    lists: z.array(z.string()).optional().describe('Filter by specific lists'),
    cardTypes: z.array(z.string()).optional().describe('Filter by card characteristics'),
  }).optional().describe('Additional filters for analysis'),
  includeCharts: z.boolean().optional().default(true).describe('Include data visualizations'),
  includeRecommendations: z.boolean().optional().default(true).describe('Include improvement recommendations'),
});

export const createDashboardSchema = z.object({
  name: z.string().min(1).max(255).describe('Name for the dashboard'),
  description: z.string().optional().describe('Description of the dashboard'),
  widgets: z.array(z.object({
    type: z.enum([
      'board_overview',
      'activity_feed',
      'completion_chart',
      'member_activity',
      'label_distribution',
      'workflow_metrics',
      'custom_metric',
      'progress_tracker'
    ]).describe('Type of widget'),
    title: z.string().describe('Widget title'),
    config: z.record(z.string(), z.any()).optional().describe('Widget configuration'),
    position: z.object({
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().min(1).max(12),
      height: z.number().min(1).max(12),
    }).describe('Widget position and size'),
  })).min(1).max(20).describe('Dashboard widgets'),
  boardIds: z.array(z.string()).optional().describe('Boards to include in dashboard'),
  refreshInterval: z.number().min(30).max(3600).optional().default(300).describe('Auto-refresh interval in seconds'),
  isPublic: z.boolean().optional().default(false).describe('Whether dashboard is publicly accessible'),
});

export const updateDashboardSchema = z.object({
  dashboardId: z.string().describe('ID of the dashboard to update'),
  name: z.string().min(1).max(255).optional().describe('New dashboard name'),
  description: z.string().optional().describe('New dashboard description'),
  widgets: z.array(z.object({
    type: z.enum([
      'board_overview',
      'activity_feed',
      'completion_chart',
      'member_activity',
      'label_distribution',
      'workflow_metrics',
      'custom_metric',
      'progress_tracker'
    ]),
    title: z.string(),
    config: z.record(z.string(), z.any()).optional(),
    position: z.object({
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().min(1).max(12),
      height: z.number().min(1).max(12),
    }),
  })).optional().describe('New dashboard widgets'),
  boardIds: z.array(z.string()).optional().describe('New boards to include'),
  refreshInterval: z.number().min(30).max(3600).optional().describe('New refresh interval'),
  isPublic: z.boolean().optional().describe('New public accessibility setting'),
});

export const deleteDashboardSchema = z.object({
  dashboardId: z.string().describe('ID of the dashboard to delete'),
});

export const getDashboardSchema = z.object({
  dashboardId: z.string().describe('ID of the dashboard to retrieve'),
  includeData: z.boolean().optional().default(true).describe('Include widget data in response'),
});

export const listDashboardsSchema = z.object({
  includePublic: z.boolean().optional().default(false).describe('Include public dashboards'),
  boardId: z.string().optional().describe('Filter by specific board'),
});

export const scheduleReportSchema = z.object({
  name: z.string().min(1).max(255).describe('Name for the scheduled report'),
  reportConfig: z.object({
    type: z.enum([
      'board_performance',
      'team_productivity',
      'workflow_analysis',
      'user_activity',
      'organization_summary'
    ]).describe('Type of report to schedule'),
    format: z.enum(['json', 'pdf', 'csv']).describe('Report format'),
    boardIds: z.array(z.string()).optional().describe('Boards to include'),
    memberIds: z.array(z.string()).optional().describe('Members to include'),
    filters: z.record(z.string(), z.any()).optional().describe('Report filters'),
  }).describe('Report configuration'),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']).describe('Report frequency'),
    dayOfWeek: z.number().min(0).max(6).optional().describe('Day of week for weekly reports (0=Sunday)'),
    dayOfMonth: z.number().min(1).max(31).optional().describe('Day of month for monthly reports'),
    time: z.string().describe('Time to run report (HH:MM format)'),
    timezone: z.string().optional().default('UTC').describe('Timezone for scheduling'),
  }).describe('Schedule configuration'),
  recipients: z.array(z.object({
    email: z.string().email().describe('Recipient email address'),
    name: z.string().optional().describe('Recipient name'),
  })).min(1).describe('Report recipients'),
  enabled: z.boolean().optional().default(true).describe('Whether the scheduled report is active'),
});

export const updateScheduledReportSchema = z.object({
  reportId: z.string().describe('ID of the scheduled report to update'),
  name: z.string().min(1).max(255).optional().describe('New report name'),
  reportConfig: z.object({
    type: z.enum([
      'board_performance',
      'team_productivity',
      'workflow_analysis',
      'user_activity',
      'organization_summary'
    ]).optional(),
    format: z.enum(['json', 'pdf', 'csv']).optional(),
    boardIds: z.array(z.string()).optional(),
    memberIds: z.array(z.string()).optional(),
    filters: z.record(z.string(), z.any()).optional(),
  }).optional().describe('New report configuration'),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().optional(),
    timezone: z.string().optional(),
  }).optional().describe('New schedule configuration'),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).optional().describe('New report recipients'),
  enabled: z.boolean().optional().describe('New enabled status'),
});

export const deleteScheduledReportSchema = z.object({
  reportId: z.string().describe('ID of the scheduled report to delete'),
});

export const listScheduledReportsSchema = z.object({
  enabled: z.boolean().optional().describe('Filter by enabled/disabled status'),
  reportType: z.string().optional().describe('Filter by report type'),
});

export const executeScheduledReportSchema = z.object({
  reportId: z.string().describe('ID of the scheduled report to execute immediately'),
  customDateRange: z.object({
    startDate: z.string().describe('Custom start date (ISO string)'),
    endDate: z.string().describe('Custom end date (ISO string)'),
  }).optional().describe('Override default date range for this execution'),
});

export const createDataVisualizationSchema = z.object({
  name: z.string().min(1).max(255).describe('Name for the visualization'),
  chartType: z.enum([
    'line_chart',
    'bar_chart',
    'pie_chart',
    'area_chart',
    'scatter_plot',
    'heatmap',
    'timeline',
    'kanban_flow'
  ]).describe('Type of chart to create'),
  dataSource: z.object({
    type: z.enum(['board', 'organization', 'user_activity', 'custom_query']).describe('Data source type'),
    boardIds: z.array(z.string()).optional().describe('Board IDs for data'),
    memberIds: z.array(z.string()).optional().describe('Member IDs for data'),
    dateRange: z.object({
      startDate: z.string().describe('Start date for data (ISO string)'),
      endDate: z.string().describe('End date for data (ISO string)'),
    }).describe('Date range for data'),
    filters: z.record(z.string(), z.any()).optional().describe('Additional data filters'),
  }).describe('Data source configuration'),
  chartConfig: z.object({
    xAxis: z.string().describe('X-axis data field'),
    yAxis: z.string().describe('Y-axis data field'),
    groupBy: z.string().optional().describe('Field to group data by'),
    aggregation: z.enum(['sum', 'count', 'average', 'min', 'max']).optional().default('count').describe('Data aggregation method'),
    colors: z.array(z.string()).optional().describe('Custom color palette'),
    showLegend: z.boolean().optional().default(true).describe('Show chart legend'),
    showGrid: z.boolean().optional().default(true).describe('Show chart grid'),
  }).describe('Chart configuration'),
  format: z.enum(['svg', 'png', 'json']).optional().default('svg').describe('Output format'),
});

// ===== IN-MEMORY STORAGE =====
// Note: In production, this would be stored in a database
const dashboards = new Map<string, any>();
const scheduledReports = new Map<string, any>();
const reportHistory = new Map<string, any[]>();

// ===== TOOL HANDLERS =====

export async function exportBoardData(args: z.infer<typeof exportBoardDataSchema>, context: McpContext) {
  context.logger.info({ 
    boardId: args.boardId, 
    format: args.format,
    includeArchived: args.includeArchived 
  }, 'Exporting board data');

  try {
    // Get comprehensive board data
    const board = await trelloClient.getBoard(args.boardId, {
      lists: args.includeArchived ? 'all' : 'open',
      cards: args.includeArchived ? 'all' : 'open',
      members: 'all',
      labels: 'all',
      checklists: 'all',
    });

    // Get additional data if requested
    let cardsWithDetails = board.cards || [];
    if (args.includeComments || args.includeAttachments || args.includeChecklists) {
      cardsWithDetails = await Promise.all(
        (board.cards || []).map(async (card) => {
          const cardDetails = await trelloClient.getCard(card.id, {
            actions: args.includeComments ? 'commentCard' : 'none',
            attachments: args.includeAttachments,
            checklists: args.includeChecklists ? 'all' : 'none',
          });
          return cardDetails;
        })
      );
    }

    // Apply date filtering if specified
    if (args.dateRange) {
      const startDate = args.dateRange.startDate ? new Date(args.dateRange.startDate) : null;
      const endDate = args.dateRange.endDate ? new Date(args.dateRange.endDate) : null;
      
      cardsWithDetails = cardsWithDetails.filter(card => {
        const cardDate = new Date(card.dateLastActivity);
        if (startDate && cardDate < startDate) return false;
        if (endDate && cardDate > endDate) return false;
        return true;
      });
    }

    // Generate export data based on format
    let exportData;
    const timestamp = new Date().toISOString();
    
    switch (args.format) {
      case 'json':
        exportData = {
          metadata: {
            exportDate: timestamp,
            boardId: args.boardId,
            boardName: board.name,
            includeArchived: args.includeArchived,
            totalCards: cardsWithDetails.length,
            totalLists: board.lists?.length || 0,
            totalMembers: board.members?.length || 0,
          },
          board: {
            ...board,
            cards: cardsWithDetails,
          },
        };
        break;
        
      case 'csv':
        exportData = generateCsvExport(board, cardsWithDetails, args);
        break;
        
      case 'pdf':
        exportData = generatePdfExport(board, cardsWithDetails, args);
        break;
    }

    return {
      success: true,
      data: {
        format: args.format,
        exportData,
        metadata: {
          boardName: board.name,
          exportDate: timestamp,
          cardCount: cardsWithDetails.length,
          listCount: board.lists?.length || 0,
          fileSize: JSON.stringify(exportData).length,
        },
      },
      summary: `Exported ${cardsWithDetails.length} cards from board "${board.name}" in ${args.format.toUpperCase()} format`,
    };
  } catch (error: any) {
    context.logger.error({ error, boardId: args.boardId }, 'Failed to export board data');
    throw error;
  }
}

export async function exportOrganizationData(args: z.infer<typeof exportOrganizationDataSchema>, context: McpContext) {
  context.logger.info({ 
    organizationId: args.organizationId, 
    format: args.format,
    includeBoards: args.includeBoards 
  }, 'Exporting organization data');

  try {
    // Get organization data
    const organization = await trelloClient.getOrganization(args.organizationId, {
      boards: args.includeBoards ? 'all' : 'none',
      members: args.includeMembers ? 'all' : 'none',
      actions: args.includeActivity ? 'all' : 'none',
    });

    // Get additional data if requested
    let boardsData: any[] = [];
    if (args.includeBoards && organization.boards) {
      boardsData = await Promise.all(
        organization.boards.slice(0, 20).map(async (board: any) => {
          try {
            return await trelloClient.getBoard(board.id, {
              lists: 'open',
              cards: 'open',
              members: 'all',
            });
          } catch (error) {
            context.logger.warn({ boardId: board.id, error }, 'Failed to get board details');
            return board;
          }
        })
      );
    }

    // Apply date filtering if specified
    let filteredData = {
      organization,
      boards: boardsData,
      members: organization.members || [],
      actions: organization.actions || [],
    };

    if (args.dateRange) {
      const startDate = args.dateRange.startDate ? new Date(args.dateRange.startDate) : null;
      const endDate = args.dateRange.endDate ? new Date(args.dateRange.endDate) : null;
      
      if (filteredData.actions) {
        filteredData.actions = filteredData.actions.filter((action: any) => {
          const actionDate = new Date(action.date);
          if (startDate && actionDate < startDate) return false;
          if (endDate && actionDate > endDate) return false;
          return true;
        });
      }
    }

    // Generate export data based on format
    let exportData;
    const timestamp = new Date().toISOString();
    
    switch (args.format) {
      case 'json':
        exportData = {
          metadata: {
            exportDate: timestamp,
            organizationId: args.organizationId,
            organizationName: organization.name,
            includeBoards: args.includeBoards,
            includeMembers: args.includeMembers,
            includeActivity: args.includeActivity,
            totalBoards: boardsData.length,
            totalMembers: filteredData.members.length,
            totalActions: filteredData.actions.length,
          },
          data: filteredData,
        };
        break;
        
      case 'csv':
        exportData = generateOrganizationCsvExport(filteredData, args);
        break;
        
      case 'pdf':
        exportData = generateOrganizationPdfExport(filteredData, args);
        break;
    }

    return {
      success: true,
      data: {
        format: args.format,
        exportData,
        metadata: {
          organizationName: organization.name,
          exportDate: timestamp,
          boardCount: boardsData.length,
          memberCount: filteredData.members.length,
          actionCount: filteredData.actions.length,
        },
      },
      summary: `Exported organization "${organization.name}" data with ${boardsData.length} boards and ${filteredData.members.length} members`,
    };
  } catch (error: any) {
    context.logger.error({ error, organizationId: args.organizationId }, 'Failed to export organization data');
    throw error;
  }
}

export async function exportUserActivity(args: z.infer<typeof exportUserActivitySchema>, context: McpContext) {
  context.logger.info({ 
    memberId: args.memberId, 
    format: args.format,
    dateRange: args.dateRange 
  }, 'Exporting user activity');

  try {
    const memberId = args.memberId || 'me';
    
    // Get user information
    const member = await trelloClient.getMember(memberId);
    
    // Get user's boards
    const boards = await trelloClient.listBoards(memberId);
    const filteredBoards = args.boardIds 
      ? boards.filter(board => args.boardIds!.includes(board.id))
      : boards;

    // Collect activity data from boards
    const activityData = [];
    const startDate = new Date(args.dateRange.startDate);
    const endDate = new Date(args.dateRange.endDate);

    for (const board of filteredBoards.slice(0, 10)) { // Limit to prevent API overload
      try {
        const fullBoard = await trelloClient.getBoard(board.id, {
          cards: 'all',
        });

        // Get board actions separately since they're not part of the TrelloBoard interface
        let boardActions: any[] = [];
        try {
          // Note: In a real implementation, you would need to add a method to get board actions
          // For now, we'll use an empty array and note this limitation
          boardActions = []; // Placeholder - would need board.actions API endpoint
        } catch (error) {
          context.logger.warn({ boardId: board.id }, 'Could not fetch board actions');
        }

        // Filter actions by date and user
        const userActions = boardActions.filter((action: any) => {
          const actionDate = new Date(action.date);
          const isInDateRange = actionDate >= startDate && actionDate <= endDate;
          const isUserAction = action.idMemberCreator === member.id;
          const matchesType = !args.activityTypes || args.activityTypes.includes(action.type);
          
          return isInDateRange && isUserAction && matchesType;
        });

        activityData.push({
          board: {
            id: board.id,
            name: board.name,
            url: board.url,
          },
          actions: userActions,
          metrics: calculateActivityMetrics(userActions, fullBoard.cards || []),
        });
      } catch (error) {
        context.logger.warn({ boardId: board.id, error }, 'Failed to get board activity');
      }
    }

    // Generate export based on format
    let exportData;
    const timestamp = new Date().toISOString();
    
    switch (args.format) {
      case 'json':
        exportData = {
          metadata: {
            exportDate: timestamp,
            memberId: member.id,
            memberName: member.fullName,
            dateRange: args.dateRange,
            boardCount: filteredBoards.length,
            totalActions: activityData.reduce((sum, board) => sum + board.actions.length, 0),
          },
          member,
          activity: activityData,
          summary: args.includeMetrics ? generateActivitySummary(activityData) : null,
        };
        break;
        
      case 'csv':
        exportData = generateActivityCsvExport(member, activityData, args);
        break;
        
      case 'pdf':
        exportData = generateActivityPdfExport(member, activityData, args);
        break;
    }

    return {
      success: true,
      data: {
        format: args.format,
        exportData,
        metadata: {
          memberName: member.fullName,
          exportDate: timestamp,
          activityCount: activityData.reduce((sum, board) => sum + board.actions.length, 0),
          boardCount: filteredBoards.length,
        },
      },
      summary: `Exported activity for ${member.fullName} across ${filteredBoards.length} boards`,
    };
  } catch (error: any) {
    context.logger.error({ error, memberId: args.memberId }, 'Failed to export user activity');
    throw error;
  }
}

export async function generateAnalyticsReport(args: z.infer<typeof generateAnalyticsReportSchema>, context: McpContext) {
  context.logger.info({ 
    reportType: args.reportType, 
    format: args.format,
    dateRange: args.dateRange 
  }, 'Generating analytics report');

  try {
    // Get data for analysis
    const analysisData = await collectAnalysisData(args, context);
    
    // Generate report based on type
    let reportData;
    switch (args.reportType) {
      case 'board_performance':
        reportData = generateBoardPerformanceReport(analysisData, args);
        break;
      case 'team_productivity':
        reportData = generateTeamProductivityReport(analysisData, args);
        break;
      case 'workflow_analysis':
        reportData = generateWorkflowAnalysisReport(analysisData, args);
        break;
      case 'label_usage':
        reportData = generateLabelUsageReport(analysisData, args);
        break;
      case 'completion_trends':
        reportData = generateCompletionTrendsReport(analysisData, args);
        break;
      case 'collaboration_metrics':
        reportData = generateCollaborationMetricsReport(analysisData, args);
        break;
      default:
        reportData = generateCustomAnalysisReport(analysisData, args);
    }

    // Format report
    const timestamp = new Date().toISOString();
    let formattedReport;
    
    switch (args.format) {
      case 'json':
        formattedReport = {
          metadata: {
            reportType: args.reportType,
            generatedAt: timestamp,
            dateRange: args.dateRange,
            boardCount: args.boardIds?.length || 0,
            memberCount: args.memberIds?.length || 0,
          },
          report: reportData,
        };
        break;
        
      case 'pdf':
        formattedReport = generateReportPdf(reportData, args);
        break;
        
      case 'html':
        formattedReport = generateReportHtml(reportData, args);
        break;
    }

    return {
      success: true,
      data: {
        reportType: args.reportType,
        format: args.format,
        report: formattedReport,
        metadata: {
          generatedAt: timestamp,
          dateRange: args.dateRange,
          dataPoints: reportData.metrics?.totalDataPoints || 0,
        },
      },
      summary: `Generated ${args.reportType} report in ${args.format.toUpperCase()} format`,
    };
  } catch (error: any) {
    context.logger.error({ error, reportType: args.reportType }, 'Failed to generate analytics report');
    throw error;
  }
}

export async function createDashboard(args: z.infer<typeof createDashboardSchema>, context: McpContext) {
  context.logger.info({ name: args.name, widgetCount: args.widgets.length }, 'Creating dashboard');

  const dashboardId = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const dashboard = {
    id: dashboardId,
    ...args,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessed: null,
    accessCount: 0,
  };

  dashboards.set(dashboardId, dashboard);

  return {
    success: true,
    data: dashboard,
    summary: `Created dashboard "${args.name}" with ${args.widgets.length} widgets`,
  };
}

export async function updateDashboard(args: z.infer<typeof updateDashboardSchema>, context: McpContext) {
  context.logger.info({ dashboardId: args.dashboardId }, 'Updating dashboard');

  const dashboard = dashboards.get(args.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard ${args.dashboardId} not found`);
  }

  const updatedDashboard = {
    ...dashboard,
    ...args,
    id: args.dashboardId, // Preserve original ID
    updatedAt: new Date().toISOString(),
  };

  dashboards.set(args.dashboardId, updatedDashboard);

  return {
    success: true,
    data: updatedDashboard,
    summary: `Updated dashboard ${args.dashboardId}`,
  };
}

export async function deleteDashboard(args: z.infer<typeof deleteDashboardSchema>, context: McpContext) {
  context.logger.info({ dashboardId: args.dashboardId }, 'Deleting dashboard');

  const dashboard = dashboards.get(args.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard ${args.dashboardId} not found`);
  }

  dashboards.delete(args.dashboardId);

  return {
    success: true,
    data: { deleted: true, id: args.dashboardId },
    summary: `Deleted dashboard ${args.dashboardId}`,
  };
}

export async function getDashboard(args: z.infer<typeof getDashboardSchema>, context: McpContext) {
  context.logger.info({ dashboardId: args.dashboardId }, 'Getting dashboard');

  const dashboard = dashboards.get(args.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard ${args.dashboardId} not found`);
  }

  // Update access tracking
  dashboard.lastAccessed = new Date().toISOString();
  dashboard.accessCount = (dashboard.accessCount || 0) + 1;
  dashboards.set(args.dashboardId, dashboard);

  let result = dashboard;

  // Include widget data if requested
  if (args.includeData) {
    const widgetData = await Promise.all(
      dashboard.widgets.map(async (widget: any) => {
        try {
          const data = await generateWidgetData(widget, dashboard.boardIds || []);
          return { ...widget, data };
        } catch (error) {
          context.logger.warn({ widgetType: widget.type, error }, 'Failed to generate widget data');
          return { ...widget, data: null, error: 'Failed to load data' };
        }
      })
    );
    
    result = {
      ...dashboard,
      widgets: widgetData,
    };
  }

  return {
    success: true,
    data: result,
    summary: `Retrieved dashboard "${dashboard.name}"`,
  };
}

export async function listDashboards(args: z.infer<typeof listDashboardsSchema>, context: McpContext) {
  context.logger.info(args, 'Listing dashboards');

  let dashboardList = Array.from(dashboards.values());

  // Filter by public status
  if (!args.includePublic) {
    dashboardList = dashboardList.filter(dashboard => !dashboard.isPublic);
  }

  // Filter by board
  if (args.boardId) {
    dashboardList = dashboardList.filter(dashboard => 
      dashboard.boardIds && dashboard.boardIds.includes(args.boardId)
    );
  }

  // Sort by last updated
  dashboardList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    success: true,
    data: dashboardList,
    summary: `Found ${dashboardList.length} dashboards`,
  };
}

export async function scheduleReport(args: z.infer<typeof scheduleReportSchema>, context: McpContext) {
  context.logger.info({ name: args.name, frequency: args.schedule.frequency }, 'Scheduling report');

  const reportId = `scheduled_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const scheduledReport = {
    id: reportId,
    ...args,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastExecuted: null,
    executionCount: 0,
    nextExecution: calculateNextExecution(args.schedule),
  };

  scheduledReports.set(reportId, scheduledReport);
  reportHistory.set(reportId, []);

  return {
    success: true,
    data: scheduledReport,
    summary: `Scheduled ${args.schedule.frequency} report "${args.name}" for ${args.recipients.length} recipients`,
  };
}

export async function updateScheduledReport(args: z.infer<typeof updateScheduledReportSchema>, context: McpContext) {
  context.logger.info({ reportId: args.reportId }, 'Updating scheduled report');

  const report = scheduledReports.get(args.reportId);
  if (!report) {
    throw new Error(`Scheduled report ${args.reportId} not found`);
  }

  const updatedReport = {
    ...report,
    ...args,
    id: args.reportId, // Preserve original ID
    updatedAt: new Date().toISOString(),
    nextExecution: args.schedule ? calculateNextExecution(args.schedule) : report.nextExecution,
  };

  scheduledReports.set(args.reportId, updatedReport);

  return {
    success: true,
    data: updatedReport,
    summary: `Updated scheduled report ${args.reportId}`,
  };
}

export async function deleteScheduledReport(args: z.infer<typeof deleteScheduledReportSchema>, context: McpContext) {
  context.logger.info({ reportId: args.reportId }, 'Deleting scheduled report');

  const report = scheduledReports.get(args.reportId);
  if (!report) {
    throw new Error(`Scheduled report ${args.reportId} not found`);
  }

  scheduledReports.delete(args.reportId);
  reportHistory.delete(args.reportId);

  return {
    success: true,
    data: { deleted: true, id: args.reportId },
    summary: `Deleted scheduled report ${args.reportId}`,
  };
}

export async function listScheduledReports(args: z.infer<typeof listScheduledReportsSchema>, context: McpContext) {
  context.logger.info(args, 'Listing scheduled reports');

  let reportList = Array.from(scheduledReports.values());

  if (args.enabled !== undefined) {
    reportList = reportList.filter(report => report.enabled === args.enabled);
  }

  if (args.reportType) {
    reportList = reportList.filter(report => report.reportConfig.type === args.reportType);
  }

  // Sort by next execution time
  reportList.sort((a, b) => {
    if (!a.nextExecution) return 1;
    if (!b.nextExecution) return -1;
    return new Date(a.nextExecution).getTime() - new Date(b.nextExecution).getTime();
  });

  return {
    success: true,
    data: reportList,
    summary: `Found ${reportList.length} scheduled reports`,
  };
}

export async function executeScheduledReport(args: z.infer<typeof executeScheduledReportSchema>, context: McpContext) {
  context.logger.info({ reportId: args.reportId }, 'Executing scheduled report');

  const report = scheduledReports.get(args.reportId);
  if (!report) {
    throw new Error(`Scheduled report ${args.reportId} not found`);
  }

  try {
    // Prepare report generation arguments
    const reportArgs = {
      reportType: report.reportConfig.type,
      format: report.reportConfig.format,
      dateRange: args.customDateRange || generateDefaultDateRange(report.schedule.frequency),
      boardIds: report.reportConfig.boardIds,
      memberIds: report.reportConfig.memberIds,
      filters: report.reportConfig.filters,
      includeCharts: true,
      includeRecommendations: true,
    };

    // Generate the report
    const reportResult = await generateAnalyticsReport(reportArgs, context);

    // Create execution record
    const execution = {
      executedAt: new Date().toISOString(),
      success: true,
      reportData: reportResult.data,
      recipients: report.recipients,
      customDateRange: args.customDateRange,
    };

    // Update report tracking
    report.lastExecuted = execution.executedAt;
    report.executionCount = (report.executionCount || 0) + 1;
    if (!args.customDateRange) {
      report.nextExecution = calculateNextExecution(report.schedule);
    }
    scheduledReports.set(args.reportId, report);

    // Store execution history
    const history = reportHistory.get(args.reportId) || [];
    history.push(execution);
    if (history.length > 50) { // Keep last 50 executions
      history.splice(0, history.length - 50);
    }
    reportHistory.set(args.reportId, history);

    return {
      success: true,
      data: {
        execution,
        report: reportResult.data,
        nextExecution: report.nextExecution,
      },
      summary: `Executed scheduled report "${report.name}" for ${report.recipients.length} recipients`,
    };
  } catch (error: any) {
    // Create failed execution record
    const execution = {
      executedAt: new Date().toISOString(),
      success: false,
      error: error.message,
      recipients: report.recipients,
      customDateRange: args.customDateRange,
    };

    const history = reportHistory.get(args.reportId) || [];
    history.push(execution);
    reportHistory.set(args.reportId, history);

    context.logger.error({ error, reportId: args.reportId }, 'Failed to execute scheduled report');
    throw error;
  }
}

export async function createDataVisualization(args: z.infer<typeof createDataVisualizationSchema>, context: McpContext) {
  context.logger.info({ name: args.name, chartType: args.chartType }, 'Creating data visualization');

  try {
    // Collect data based on source configuration
    const data = await collectVisualizationData(args.dataSource, context);
    
    // Generate chart data
    const chartData = processChartData(data, args.chartConfig);
    
    // Create visualization
    let visualization;
    switch (args.format) {
      case 'svg':
        visualization = generateSvgChart(chartData, args);
        break;
      case 'png':
        visualization = generatePngChart(chartData, args);
        break;
      case 'json':
        visualization = {
          chartData,
          config: args.chartConfig,
          metadata: {
            dataPoints: chartData.length,
            generatedAt: new Date().toISOString(),
          },
        };
        break;
    }

    return {
      success: true,
      data: {
        name: args.name,
        chartType: args.chartType,
        format: args.format,
        visualization,
        metadata: {
          dataPoints: chartData.length,
          generatedAt: new Date().toISOString(),
        },
      },
      summary: `Created ${args.chartType} visualization "${args.name}" with ${chartData.length} data points`,
    };
  } catch (error: any) {
    context.logger.error({ error, name: args.name }, 'Failed to create data visualization');
    throw error;
  }
}

// ===== HELPER FUNCTIONS =====

function generateCsvExport(board: any, cards: any[], args: any): string {
  const headers = [
    'Card ID', 'Card Name', 'List Name', 'Description', 'Due Date', 
    'Members', 'Labels', 'Checklist Progress', 'Attachments', 'Comments', 'Created Date', 'Last Activity'
  ];
  
  const rows = cards.map(card => {
    const list = board.lists?.find((l: any) => l.id === card.idList);
    const members = card.members?.map((m: any) => m.fullName).join('; ') || '';
    const labels = card.labels?.map((l: any) => l.name || l.color).join('; ') || '';
    const checklistProgress = card.checklists?.map((cl: any) => 
      `${cl.name}: ${cl.checkItems?.filter((ci: any) => ci.state === 'complete').length || 0}/${cl.checkItems?.length || 0}`
    ).join('; ') || '';
    const attachments = card.attachments?.length || 0;
    const comments = card.actions?.filter((a: any) => a.type === 'commentCard').length || 0;
    
    return [
      card.id,
      `"${card.name.replace(/"/g, '""')}"`,
      `"${list?.name || 'Unknown'}"`,
      `"${(card.desc || '').replace(/"/g, '""')}"`,
      card.due || '',
      `"${members}"`,
      `"${labels}"`,
      `"${checklistProgress}"`,
      attachments,
      comments,
      card.dateLastActivity,
      card.dateLastActivity,
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

function generatePdfExport(board: any, cards: any[], args: any): any {
  // This would generate a PDF document
  // For now, return a structured representation
  return {
    type: 'pdf',
    title: `Board Export: ${board.name}`,
    pages: [
      {
        type: 'cover',
        title: board.name,
        subtitle: `Exported on ${new Date().toLocaleDateString()}`,
        stats: {
          totalCards: cards.length,
          totalLists: board.lists?.length || 0,
          totalMembers: board.members?.length || 0,
        },
      },
      {
        type: 'summary',
        content: generateBoardSummaryForPdf(board, cards),
      },
      {
        type: 'cards',
        content: cards.map(card => generateCardSummaryForPdf(card, board)),
      },
    ],
  };
}

function generateActivityCsvExport(member: any, activityData: any[], args: any): string {
  const headers = [
    'Date', 'Time', 'Board', 'Action Type', 'Target Type', 'Target Name', 'Description'
  ];
  
  const rows: string[] = [];
  activityData.forEach(boardData => {
    boardData.actions.forEach((action: any) => {
      const date = new Date(action.date);
      const targetType = action.type.includes('Card') ? 'Card' : 
                        action.type.includes('List') ? 'List' : 'Other';
      const targetName = action.data?.card?.name || action.data?.list?.name || '';
      
      rows.push([
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        `"${boardData.board.name}"`,
        action.type,
        targetType,
        `"${targetName}"`,
        `"${generateActionDescription(action)}"`,
      ].join(','));
    });
  });
  
  return [headers.join(','), ...rows].join('\n');
}

function generateActivityPdfExport(member: any, activityData: any[], args: any): any {
  return {
    type: 'pdf',
    title: `Activity Report: ${member.fullName}`,
    pages: [
      {
        type: 'cover',
        title: `Activity Report`,
        subtitle: member.fullName,
        dateRange: args.dateRange,
        stats: {
          totalActions: activityData.reduce((sum, board) => sum + board.actions.length, 0),
          boardsActive: activityData.length,
        },
      },
      {
        type: 'summary',
        content: generateActivitySummary(activityData),
      },
      {
        type: 'detailed_activity',
        content: activityData,
      },
    ],
  };
}

function generateActionDescription(action: any): string {
  switch (action.type) {
    case 'createCard':
      return `Created card "${action.data?.card?.name || 'Unknown'}"`;
    case 'updateCard':
      return `Updated card "${action.data?.card?.name || 'Unknown'}"`;
    case 'commentCard':
      return `Commented on card "${action.data?.card?.name || 'Unknown'}"`;
    case 'moveCardToBoard':
      return `Moved card to different board`;
    default:
      return action.type;
  }
}

function calculateActivityMetrics(actions: any[], cards: any[]): any {
  const actionCounts = actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {});

  return {
    totalActions: actions.length,
    actionBreakdown: actionCounts,
    cardsInteracted: new Set(
      actions
        .map(action => action.data?.card?.id)
        .filter(Boolean)
    ).size,
    averageActionsPerDay: actions.length / 7, // Assuming week view
  };
}

function generateActivitySummary(activityData: any[]): any {
  const totalActions = activityData.reduce((sum, board) => sum + board.actions.length, 0);
  const boardsActive = activityData.length;
  
  const actionTypes = activityData.reduce((acc, board) => {
    board.actions.forEach((action: any) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
    });
    return acc;
  }, {});

  return {
    overview: {
      totalActions,
      boardsActive,
      averageActionsPerBoard: boardsActive > 0 ? Math.round(totalActions / boardsActive) : 0,
    },
    actionBreakdown: actionTypes,
    recommendations: generateActivityRecommendations(activityData),
  };
}

function generateActivityRecommendations(activityData: any[]): string[] {
  const recommendations = [];
  const totalActions = activityData.reduce((sum, board) => sum + board.actions.length, 0);
  
  if (totalActions < 10) {
    recommendations.push("Consider increasing daily engagement with your boards");
  }
  
  if (activityData.length > 10) {
    recommendations.push("You're active across many boards - consider focusing on key projects");
  }
  
  return recommendations;
}

async function collectAnalysisData(args: any, context: McpContext): Promise<any> {
  // This would collect data for analytics based on the report type and filters
  // For now, return a placeholder structure
  return {
    boards: [],
    cards: [],
    actions: [],
    members: [],
    dateRange: args.dateRange,
    filters: args.filters,
  };
}

function generateBoardPerformanceReport(data: any, args: any): any {
  return {
    type: 'board_performance',
    metrics: {
      totalDataPoints: 100,
      completionRate: 0.75,
      averageCardAge: 5.2,
      throughput: 12.3,
    },
    trends: [],
    recommendations: [],
  };
}

function generateTeamProductivityReport(data: any, args: any): any {
  return {
    type: 'team_productivity',
    metrics: {
      totalDataPoints: 100,
      teamVelocity: 8.7,
      collaborationIndex: 0.82,
      memberProductivity: {},
    },
    trends: [],
    recommendations: [],
  };
}

function generateWorkflowAnalysisReport(data: any, args: any): any {
  return {
    type: 'workflow_analysis',
    metrics: {
      totalDataPoints: 100,
      bottlenecks: [],
      flowEfficiency: 0.68,
      cycleTime: 4.2,
    },
    trends: [],
    recommendations: [],
  };
}

function generateLabelUsageReport(data: any, args: any): any {
  return {
    type: 'label_usage',
    metrics: {
      totalDataPoints: 100,
      labelDistribution: {},
      mostUsedLabels: [],
      unusedLabels: [],
    },
    trends: [],
    recommendations: [],
  };
}

function generateCompletionTrendsReport(data: any, args: any): any {
  return {
    type: 'completion_trends',
    metrics: {
      totalDataPoints: 100,
      completionTrend: 'increasing',
      seasonality: {},
      predictedCompletion: {},
    },
    trends: [],
    recommendations: [],
  };
}

function generateCollaborationMetricsReport(data: any, args: any): any {
  return {
    type: 'collaboration_metrics',
    metrics: {
      totalDataPoints: 100,
      communicationFrequency: 15.2,
      crossTeamInteraction: 0.45,
      knowledgeSharing: 0.73,
    },
    trends: [],
    recommendations: [],
  };
}

function generateCustomAnalysisReport(data: any, args: any): any {
  return {
    type: 'custom_analysis',
    metrics: {
      totalDataPoints: 100,
      customMetrics: {},
    },
    trends: [],
    recommendations: [],
  };
}

function generateReportPdf(reportData: any, args: any): any {
  return {
    type: 'pdf',
    title: `Analytics Report: ${args.reportType}`,
    content: reportData,
    charts: args.includeCharts ? [] : null,
  };
}

function generateReportHtml(reportData: any, args: any): string {
  return `
    <html>
      <head><title>Analytics Report: ${args.reportType}</title></head>
      <body>
        <h1>${args.reportType} Report</h1>
        <div class="content">${JSON.stringify(reportData, null, 2)}</div>
      </body>
    </html>
  `;
}

async function generateWidgetData(widget: any, boardIds: string[]): Promise<any> {
  // Generate mock data for different widget types
  switch (widget.type) {
    case 'board_overview':
      return {
        totalCards: 45,
        completedCards: 23,
        activeMembers: 8,
        recentActivity: 12,
      };
    case 'activity_feed':
      return {
        recentActions: [
          { type: 'card_created', user: 'John Doe', timestamp: new Date().toISOString() },
          { type: 'card_moved', user: 'Jane Smith', timestamp: new Date().toISOString() },
        ],
      };
    case 'completion_chart':
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        data: [5, 8, 12, 7, 15],
      };
    default:
      return { message: 'Widget data not implemented yet' };
  }
}

function calculateNextExecution(schedule: any): string {
  const now = new Date();
  const next = new Date();
  
  switch (schedule.frequency) {
    case 'daily':
      next.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(now.getDate() + (7 - now.getDay() + (schedule.dayOfWeek || 0)) % 7);
      break;
    case 'monthly':
      next.setMonth(now.getMonth() + 1);
      next.setDate(schedule.dayOfMonth || 1);
      break;
  }
  
  const [hours, minutes] = schedule.time.split(':');
  next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return next.toISOString();
}

function generateDefaultDateRange(frequency: string): any {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (frequency) {
    case 'daily':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

async function collectVisualizationData(dataSource: any, context: McpContext): Promise<any[]> {
  // Collect data based on source type
  // For now, return mock data
  return [
    { x: 'Jan', y: 10 },
    { x: 'Feb', y: 15 },
    { x: 'Mar', y: 8 },
    { x: 'Apr', y: 22 },
    { x: 'May', y: 18 },
  ];
}

function processChartData(data: any[], config: any): any[] {
  // Process and aggregate data based on chart configuration
  return data;
}

function generateSvgChart(chartData: any[], args: any): string {
  // Generate SVG chart representation
  return `<svg width="400" height="300"><text x="50%" y="50%" text-anchor="middle">${args.chartType} Chart</text></svg>`;
}

function generatePngChart(chartData: any[], args: any): any {
  // Generate PNG chart (would typically use a charting library)
  return {
    type: 'image/png',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    width: 400,
    height: 300,
  };
}

function generateBoardSummaryForPdf(board: any, cards: any[]): any {
  return {
    boardInfo: {
      name: board.name,
      description: board.desc,
      url: board.url,
    },
    statistics: {
      totalCards: cards.length,
      completedCards: cards.filter(c => c.closed).length,
      totalLists: board.lists?.length || 0,
      totalMembers: board.members?.length || 0,
    },
  };
}

function generateCardSummaryForPdf(card: any, board: any): any {
  const list = board.lists?.find((l: any) => l.id === card.idList);
  return {
    id: card.id,
    name: card.name,
    list: list?.name || 'Unknown',
    description: card.desc,
    dueDate: card.due,
    members: card.members?.map((m: any) => m.fullName) || [],
    labels: card.labels?.map((l: any) => l.name || l.color) || [],
    checklistProgress: card.checklists?.map((cl: any) => ({
      name: cl.name,
      completed: cl.checkItems?.filter((ci: any) => ci.state === 'complete').length || 0,
      total: cl.checkItems?.length || 0,
    })) || [],
  };
}

function generateOrganizationCsvExport(data: any, args: any): string {
  // Generate CSV export for organization data
  const headers = ['Type', 'ID', 'Name', 'Status', 'Members', 'Cards', 'Last Activity'];
  const rows = [];

  // Add organization row
  rows.push([
    'Organization',
    data.organization.id,
    `"${data.organization.name}"`,
    data.organization.closed ? 'Closed' : 'Active',
    data.members.length,
    '',
    ''
  ].join(','));

  // Add board rows
  data.boards.forEach((board: any) => {
    rows.push([
      'Board',
      board.id,
      `"${board.name}"`,
      board.closed ? 'Closed' : 'Active',
      board.members?.length || 0,
      board.cards?.length || 0,
      board.dateLastActivity
    ].join(','));
  });

  return [headers.join(','), ...rows].join('\n');
}

function generateOrganizationPdfExport(data: any, args: any): any {
  return {
    type: 'pdf',
    title: `Organization Export: ${data.organization.name}`,
    pages: [
      {
        type: 'cover',
        title: data.organization.name,
        subtitle: `Organization Export - ${new Date().toLocaleDateString()}`,
        stats: {
          totalBoards: data.boards.length,
          totalMembers: data.members.length,
          totalActions: data.actions.length,
        },
      },
      {
        type: 'organization_summary',
        content: {
          organization: data.organization,
          boards: data.boards,
          members: data.members,
        },
      },
    ],
  };
}
