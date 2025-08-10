import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

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

async function generateDashboardReport(dashboardId: string, context: McpContext): Promise<any> {
  // In a real implementation, this would fetch dashboard data from storage
  // For now, return a mock dashboard structure
  return {
    id: dashboardId,
    name: 'Project Dashboard',
    description: 'Overview of project metrics and progress',
    widgets: [
      {
        type: 'board_overview',
        title: 'Board Statistics',
        data: {
          totalCards: 45,
          completedCards: 23,
          inProgressCards: 15,
          todoCards: 7,
        },
      },
      {
        type: 'completion_chart',
        title: 'Completion Trends',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          completed: [5, 8, 12, 15],
          created: [7, 10, 14, 18],
        },
      },
      {
        type: 'member_activity',
        title: 'Team Activity',
        data: {
          members: [
            { name: 'John Doe', actions: 23, lastActive: '2024-01-15T10:30:00Z' },
            { name: 'Jane Smith', actions: 18, lastActive: '2024-01-15T14:20:00Z' },
            { name: 'Bob Johnson', actions: 12, lastActive: '2024-01-14T16:45:00Z' },
          ],
        },
      },
    ],
    lastUpdated: new Date().toISOString(),
    accessCount: 42,
  };
}

async function generateAnalyticsReport(reportId: string, context: McpContext): Promise<any> {
  // Mock analytics report data
  return {
    id: reportId,
    type: 'team_productivity',
    title: 'Team Productivity Analysis',
    dateRange: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
    },
    metrics: {
      totalCards: 156,
      completedCards: 98,
      completionRate: 0.628,
      averageCompletionTime: 4.2,
      teamVelocity: 12.3,
      collaborationIndex: 0.75,
    },
    trends: {
      completionRateTrend: 'increasing',
      velocityTrend: 'stable',
      collaborationTrend: 'improving',
    },
    insights: [
      'Team completion rate has improved by 15% compared to last month',
      'Average card completion time has decreased from 5.1 to 4.2 days',
      'Collaboration between team members has increased significantly',
      'Consider redistributing workload to optimize team efficiency',
    ],
    recommendations: [
      'Implement daily standups to maintain momentum',
      'Create templates for recurring card types',
      'Set up automated notifications for overdue items',
      'Review and optimize current workflow processes',
    ],
    generatedAt: new Date().toISOString(),
  };
}

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
    recordCount: {
      boards: 1,
      lists: 8,
      cards: 156,
      comments: 234,
      attachments: 67,
      checklists: 89,
    },
    downloadUrl: `/exports/${exportId}/download`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  };
}

async function generateScheduledReportSummary(reportId: string, context: McpContext): Promise<any> {
  // Mock scheduled report data
  return {
    id: reportId,
    name: 'Weekly Team Performance Report',
    type: 'team_productivity',
    schedule: {
      frequency: 'weekly',
      dayOfWeek: 1, // Monday
      time: '09:00',
      timezone: 'UTC',
    },
    recipients: [
      { email: 'manager@company.com', name: 'Project Manager' },
      { email: 'lead@company.com', name: 'Team Lead' },
    ],
    lastExecuted: '2024-01-15T09:00:00Z',
    nextExecution: '2024-01-22T09:00:00Z',
    executionCount: 12,
    successRate: 1.0,
    enabled: true,
    createdAt: '2023-10-01T10:00:00Z',
  };
}

function createDashboardSummary(dashboard: any): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Dashboard: ${dashboard.name}`);
  lines.push('');

  // Basic Information
  lines.push('## Overview');
  lines.push(`- **Dashboard ID**: ${dashboard.id}`);
  lines.push(`- **Name**: ${dashboard.name}`);
  if (dashboard.description) {
    lines.push(`- **Description**: ${dashboard.description}`);
  }
  lines.push(`- **Widgets**: ${dashboard.widgets.length}`);
  lines.push(`- **Last Updated**: ${new Date(dashboard.lastUpdated).toLocaleString()}`);
  lines.push(`- **Access Count**: ${dashboard.accessCount} views`);
  lines.push('');

  // Widget Information
  lines.push('## Dashboard Widgets');
  lines.push('');
  
  dashboard.widgets.forEach((widget: any, index: number) => {
    lines.push(`### ${index + 1}. ${widget.title}`);
    lines.push(`- **Type**: ${widget.type.replace(/_/g, ' ').toUpperCase()}`);
    
    switch (widget.type) {
      case 'board_overview':
        if (widget.data) {
          lines.push(`- **Total Cards**: ${widget.data.totalCards}`);
          lines.push(`- **Completed**: ${widget.data.completedCards} (${Math.round((widget.data.completedCards / widget.data.totalCards) * 100)}%)`);
          lines.push(`- **In Progress**: ${widget.data.inProgressCards}`);
          lines.push(`- **To Do**: ${widget.data.todoCards}`);
        }
        break;
        
      case 'completion_chart':
        if (widget.data && widget.data.labels) {
          lines.push(`- **Time Period**: ${widget.data.labels.length} periods`);
          lines.push(`- **Latest Completion**: ${widget.data.completed[widget.data.completed.length - 1]} cards`);
          lines.push(`- **Latest Created**: ${widget.data.created[widget.data.created.length - 1]} cards`);
          
          const totalCompleted = widget.data.completed.reduce((sum: number, val: number) => sum + val, 0);
          const totalCreated = widget.data.created.reduce((sum: number, val: number) => sum + val, 0);
          lines.push(`- **Overall Completion Rate**: ${Math.round((totalCompleted / totalCreated) * 100)}%`);
        }
        break;
        
      case 'member_activity':
        if (widget.data && widget.data.members) {
          lines.push(`- **Team Members**: ${widget.data.members.length}`);
          const totalActions = widget.data.members.reduce((sum: number, member: any) => sum + member.actions, 0);
          lines.push(`- **Total Actions**: ${totalActions}`);
          lines.push(`- **Average Actions per Member**: ${Math.round(totalActions / widget.data.members.length)}`);
          
          const mostActive = widget.data.members.reduce((max: any, member: any) => 
            member.actions > max.actions ? member : max
          );
          lines.push(`- **Most Active Member**: ${mostActive.name} (${mostActive.actions} actions)`);
        }
        break;
        
      default:
        lines.push(`- **Status**: Data available`);
    }
    
    lines.push('');
  });

  // Performance Insights
  lines.push('## Performance Insights');
  lines.push('');
  
  // Calculate insights from widget data
  const boardWidget = dashboard.widgets.find((w: any) => w.type === 'board_overview');
  if (boardWidget && boardWidget.data) {
    const completionRate = (boardWidget.data.completedCards / boardWidget.data.totalCards) * 100;
    
    if (completionRate > 70) {
      lines.push('🟢 **Excellent Progress**: Your team is maintaining a high completion rate');
    } else if (completionRate > 50) {
      lines.push('🟡 **Good Progress**: Steady progress with room for improvement');
    } else {
      lines.push('🔴 **Needs Attention**: Consider reviewing workflow efficiency');
    }
    
    lines.push(`- Current completion rate: ${Math.round(completionRate)}%`);
    lines.push(`- Cards remaining: ${boardWidget.data.totalCards - boardWidget.data.completedCards}`);
  }

  const activityWidget = dashboard.widgets.find((w: any) => w.type === 'member_activity');
  if (activityWidget && activityWidget.data) {
    const members = activityWidget.data.members;
    const avgActions = members.reduce((sum: number, m: any) => sum + m.actions, 0) / members.length;
    
    lines.push(`- Team activity level: ${avgActions > 15 ? 'High' : avgActions > 8 ? 'Moderate' : 'Low'}`);
    lines.push(`- Active team members: ${members.filter((m: any) => m.actions > 5).length}/${members.length}`);
  }
  
  lines.push('');

  // Usage and Management
  lines.push('## Dashboard Management');
  lines.push('');
  lines.push('### Available Actions:');
  lines.push('- **Refresh Data**: Update widget data with latest information');
  lines.push('- **Customize Layout**: Modify widget positions and sizes');
  lines.push('- **Add Widgets**: Include additional metrics and visualizations');
  lines.push('- **Export Dashboard**: Generate reports in various formats');
  lines.push('- **Share Dashboard**: Create public or team-specific access');
  lines.push('');
  
  lines.push('### Widget Types Available:');
  lines.push('- **Board Overview**: Key statistics and completion metrics');
  lines.push('- **Activity Feed**: Recent team actions and updates');
  lines.push('- **Completion Chart**: Progress trends over time');
  lines.push('- **Member Activity**: Individual team member performance');
  lines.push('- **Label Distribution**: Card categorization analysis');
  lines.push('- **Workflow Metrics**: Process efficiency measurements');
  lines.push('- **Custom Metrics**: User-defined KPIs and measurements');
  lines.push('- **Progress Tracker**: Goal and milestone tracking');
  lines.push('');

  // Best Practices
  lines.push('## Best Practices');
  lines.push('');
  lines.push('### Dashboard Optimization:');
  lines.push('- Keep the most important metrics visible without scrolling');
  lines.push('- Use consistent time periods across related widgets');
  lines.push('- Set appropriate refresh intervals based on data volatility');
  lines.push('- Group related widgets together for better context');
  lines.push('');
  
  lines.push('### Performance Monitoring:');
  lines.push('- Review dashboard metrics regularly to identify trends');
  lines.push('- Set up alerts for critical performance thresholds');
  lines.push('- Compare current performance against historical data');
  lines.push('- Use insights to drive team discussions and improvements');
  lines.push('');

  // Technical Information
  lines.push('## Technical Details');
  lines.push(`- **Dashboard ID**: ${dashboard.id}`);
  lines.push(`- **Last Data Refresh**: ${new Date(dashboard.lastUpdated).toLocaleString()}`);
  lines.push(`- **Total Views**: ${dashboard.accessCount}`);
  lines.push('- **Data Sources**: Trello boards, cards, and member activity');
  lines.push('- **Update Frequency**: Real-time with configurable refresh intervals');

  return lines.join('\n');
}

function createAnalyticsReportSummary(report: any): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Analytics Report: ${report.title}`);
  lines.push('');

  // Basic Information
  lines.push('## Report Overview');
  lines.push(`- **Report ID**: ${report.id}`);
  lines.push(`- **Report Type**: ${report.type.replace(/_/g, ' ').toUpperCase()}`);
  lines.push(`- **Analysis Period**: ${new Date(report.dateRange.startDate).toLocaleDateString()} - ${new Date(report.dateRange.endDate).toLocaleDateString()}`);
  lines.push(`- **Generated**: ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push('');

  // Key Metrics
  lines.push('## Key Performance Metrics');
  lines.push('');
  
  if (report.metrics) {
    lines.push(`- **Total Cards Analyzed**: ${report.metrics.totalCards}`);
    lines.push(`- **Completion Rate**: ${Math.round(report.metrics.completionRate * 100)}% (${report.metrics.completedCards}/${report.metrics.totalCards})`);
    lines.push(`- **Average Completion Time**: ${report.metrics.averageCompletionTime} days`);
    lines.push(`- **Team Velocity**: ${report.metrics.teamVelocity} cards/week`);
    lines.push(`- **Collaboration Index**: ${Math.round(report.metrics.collaborationIndex * 100)}%`);
  }
  
  lines.push('');

  // Trends Analysis
  lines.push('## Trend Analysis');
  lines.push('');
  
  if (report.trends) {
    const getTrendEmoji = (trend: string) => {
      switch (trend) {
        case 'increasing': return '📈';
        case 'decreasing': return '📉';
        case 'stable': return '➡️';
        case 'improving': return '🟢';
        case 'declining': return '🔴';
        default: return '📊';
      }
    };

    lines.push(`${getTrendEmoji(report.trends.completionRateTrend)} **Completion Rate**: ${report.trends.completionRateTrend}`);
    lines.push(`${getTrendEmoji(report.trends.velocityTrend)} **Team Velocity**: ${report.trends.velocityTrend}`);
    lines.push(`${getTrendEmoji(report.trends.collaborationTrend)} **Team Collaboration**: ${report.trends.collaborationTrend}`);
  }
  
  lines.push('');

  // Key Insights
  lines.push('## Key Insights');
  lines.push('');
  
  if (report.insights && report.insights.length > 0) {
    report.insights.forEach((insight: string, index: number) => {
      lines.push(`${index + 1}. ${insight}`);
    });
  } else {
    lines.push('No specific insights available for this analysis period.');
  }
  
  lines.push('');

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  
  if (report.recommendations && report.recommendations.length > 0) {
    report.recommendations.forEach((recommendation: string, index: number) => {
      lines.push(`### ${index + 1}. ${recommendation}`);
      
      // Add context based on recommendation type
      if (recommendation.includes('standups')) {
        lines.push('   - Schedule daily 15-minute team check-ins');
        lines.push('   - Focus on blockers and priorities');
        lines.push('   - Track progress against sprint goals');
      } else if (recommendation.includes('templates')) {
        lines.push('   - Identify recurring card patterns');
        lines.push('   - Create standardized checklists');
        lines.push('   - Include relevant labels and assignments');
      } else if (recommendation.includes('notifications')) {
        lines.push('   - Set up due date reminders');
        lines.push('   - Configure activity alerts');
        lines.push('   - Establish escalation procedures');
      } else if (recommendation.includes('workflow')) {
        lines.push('   - Map current processes');
        lines.push('   - Identify bottlenecks');
        lines.push('   - Streamline approval steps');
      }
      
      lines.push('');
    });
  } else {
    lines.push('Current performance is optimal. Continue monitoring for changes.');
  }

  // Performance Benchmarks
  lines.push('## Performance Benchmarks');
  lines.push('');
  
  if (report.metrics) {
    const completionRate = report.metrics.completionRate * 100;
    const velocity = report.metrics.teamVelocity;
    const collaboration = report.metrics.collaborationIndex * 100;

    lines.push('### Completion Rate Assessment:');
    if (completionRate >= 80) {
      lines.push('🟢 **Excellent** (≥80%): Outstanding completion performance');
    } else if (completionRate >= 60) {
      lines.push('🟡 **Good** (60-79%): Solid performance with improvement opportunities');
    } else if (completionRate >= 40) {
      lines.push('🟠 **Fair** (40-59%): Below average, requires attention');
    } else {
      lines.push('🔴 **Poor** (<40%): Immediate intervention needed');
    }
    
    lines.push('');
    lines.push('### Team Velocity Assessment:');
    if (velocity >= 15) {
      lines.push('🟢 **High Velocity** (≥15 cards/week): Excellent throughput');
    } else if (velocity >= 10) {
      lines.push('🟡 **Moderate Velocity** (10-14 cards/week): Steady progress');
    } else if (velocity >= 5) {
      lines.push('🟠 **Low Velocity** (5-9 cards/week): Consider process improvements');
    } else {
      lines.push('🔴 **Very Low Velocity** (<5 cards/week): Significant bottlenecks present');
    }
    
    lines.push('');
    lines.push('### Collaboration Assessment:');
    if (collaboration >= 75) {
      lines.push('🟢 **Excellent Collaboration** (≥75%): Strong team coordination');
    } else if (collaboration >= 50) {
      lines.push('🟡 **Good Collaboration** (50-74%): Healthy team interaction');
    } else if (collaboration >= 25) {
      lines.push('🟠 **Limited Collaboration** (25-49%): Encourage more interaction');
    } else {
      lines.push('🔴 **Poor Collaboration** (<25%): Address communication barriers');
    }
  }
  
  lines.push('');

  // Action Items
  lines.push('## Next Steps');
  lines.push('');
  lines.push('### Immediate Actions (This Week):');
  lines.push('- Review current sprint progress and adjust capacity');
  lines.push('- Identify and address any immediate blockers');
  lines.push('- Communicate findings with team stakeholders');
  lines.push('');
  
  lines.push('### Short-term Goals (Next Month):');
  lines.push('- Implement highest-priority recommendations');
  lines.push('- Establish baseline metrics for comparison');
  lines.push('- Schedule follow-up analysis');
  lines.push('');
  
  lines.push('### Long-term Strategy (Next Quarter):');
  lines.push('- Develop comprehensive process improvements');
  lines.push('- Invest in team training and development');
  lines.push('- Implement advanced workflow automation');

  return lines.join('\n');
}

function createExportReportSummary(exportData: any): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Export Report: ${exportData.boardName}`);
  lines.push('');

  // Basic Information
  lines.push('## Export Details');
  lines.push(`- **Export ID**: ${exportData.id}`);
  lines.push(`- **Board Name**: ${exportData.boardName}`);
  lines.push(`- **Format**: ${exportData.format.toUpperCase()}`);
  lines.push(`- **Status**: ${exportData.status.toUpperCase()}`);
  lines.push(`- **Exported**: ${new Date(exportData.exportedAt).toLocaleString()}`);
  lines.push(`- **File Size**: ${exportData.fileSize}`);
  lines.push('');

  // Export Statistics
  lines.push('## Export Statistics');
  lines.push('');
  
  if (exportData.recordCount) {
    lines.push(`- **Boards**: ${exportData.recordCount.boards}`);
    lines.push(`- **Lists**: ${exportData.recordCount.lists}`);
    lines.push(`- **Cards**: ${exportData.recordCount.cards}`);
    lines.push(`- **Comments**: ${exportData.recordCount.comments}`);
    lines.push(`- **Attachments**: ${exportData.recordCount.attachments}`);
    lines.push(`- **Checklists**: ${exportData.recordCount.checklists}`);
    
    const totalRecords = Object.values(exportData.recordCount).reduce((sum: number, count: any) => sum + count, 0);
    lines.push(`- **Total Records**: ${totalRecords}`);
  }
  
  lines.push('');

  // Download Information
  lines.push('## Download Information');
  lines.push('');
  lines.push(`- **Download URL**: ${exportData.downloadUrl}`);
  lines.push(`- **Expires**: ${new Date(exportData.expiresAt).toLocaleString()}`);
  
  const expiresIn = Math.ceil((new Date(exportData.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  lines.push(`- **Time Remaining**: ${expiresIn} days`);
  lines.push('');

  // Export Format Information
  lines.push('## Format Specifications');
  lines.push('');
  
  switch (exportData.format) {
    case 'json':
      lines.push('### JSON Export Features:');
      lines.push('- Complete data structure preservation');
      lines.push('- Nested relationships maintained');
      lines.push('- Machine-readable format');
      lines.push('- Suitable for data processing and integration');
      break;
      
    case 'csv':
      lines.push('### CSV Export Features:');
      lines.push('- Tabular data format');
      lines.push('- Compatible with spreadsheet applications');
      lines.push('- Easy data analysis and filtering');
      lines.push('- Human-readable format');
      break;
      
    case 'pdf':
      lines.push('### PDF Export Features:');
      lines.push('- Professional report formatting');
      lines.push('- Print-ready document');
      lines.push('- Includes charts and visualizations');
      lines.push('- Suitable for presentations and archives');
      break;
  }
  
  lines.push('');

  // Usage Guidelines
  lines.push('## Usage Guidelines');
  lines.push('');
  lines.push('### Data Security:');
  lines.push('- Download files contain sensitive project information');
  lines.push('- Ensure secure storage and access controls');
  lines.push('- Delete files after use to maintain security');
  lines.push('- Share only with authorized team members');
  lines.push('');
  
  lines.push('### Data Accuracy:');
  lines.push('- Export reflects data state at time of generation');
  lines.push('- Real-time changes are not included');
  lines.push('- Re-export for latest data if needed');
  lines.push('- Verify critical information before use');
  lines.push('');

  // Import and Integration
  lines.push('## Import and Integration');
  lines.push('');
  
  switch (exportData.format) {
    case 'json':
      lines.push('### JSON Integration:');
      lines.push('- Parse with standard JSON libraries');
      lines.push('- Use for API integration and data migration');
      lines.push('- Suitable for backup and restore operations');
      lines.push('- Compatible with most programming languages');
      break;
      
    case 'csv':
      lines.push('### CSV Integration:');
      lines.push('- Import into Excel, Google Sheets, or similar');
      lines.push('- Use for data analysis and reporting');
      lines.push('- Create pivot tables and charts');
      lines.push('- Merge with other data sources');
      break;
      
    case 'pdf':
      lines.push('### PDF Usage:');
      lines.push('- Share in meetings and presentations');
      lines.push('- Archive for compliance and records');
      lines.push('- Print for offline review');
      lines.push('- Include in project documentation');
      break;
  }

  return lines.join('\n');
}

function createScheduledReportSummary(reportData: any): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Scheduled Report: ${reportData.name}`);
  lines.push('');

  // Basic Information
  lines.push('## Report Configuration');
  lines.push(`- **Report ID**: ${reportData.id}`);
  lines.push(`- **Report Name**: ${reportData.name}`);
  lines.push(`- **Report Type**: ${reportData.type.replace(/_/g, ' ').toUpperCase()}`);
  lines.push(`- **Status**: ${reportData.enabled ? '🟢 Active' : '🔴 Disabled'}`);
  lines.push(`- **Created**: ${new Date(reportData.createdAt).toLocaleString()}`);
  lines.push('');

  // Schedule Information
  lines.push('## Schedule Details');
  lines.push(`- **Frequency**: ${reportData.schedule.frequency.toUpperCase()}`);
  
  if (reportData.schedule.frequency === 'weekly') {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    lines.push(`- **Day of Week**: ${dayNames[reportData.schedule.dayOfWeek]}`);
  }
  
  if (reportData.schedule.frequency === 'monthly') {
    lines.push(`- **Day of Month**: ${reportData.schedule.dayOfMonth}`);
  }
  
  lines.push(`- **Time**: ${reportData.schedule.time} ${reportData.schedule.timezone}`);
  lines.push(`- **Next Execution**: ${new Date(reportData.nextExecution).toLocaleString()}`);
  
  const nextExecutionIn = Math.ceil((new Date(reportData.nextExecution).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  lines.push(`- **Time Until Next Run**: ${nextExecutionIn} days`);
  lines.push('');

  // Execution History
  lines.push('## Execution History');
  lines.push(`- **Total Executions**: ${reportData.executionCount}`);
  lines.push(`- **Success Rate**: ${Math.round(reportData.successRate * 100)}%`);
  lines.push(`- **Last Executed**: ${reportData.lastExecuted ? new Date(reportData.lastExecuted).toLocaleString() : 'Never'}`);
  
  if (reportData.lastExecuted) {
    const daysSinceLastRun = Math.floor((Date.now() - new Date(reportData.lastExecuted).getTime()) / (1000 * 60 * 60 * 24));
    lines.push(`- **Days Since Last Run**: ${daysSinceLastRun}`);
  }
  
  lines.push('');

  // Recipients
  lines.push('## Report Recipients');
  lines.push(`- **Total Recipients**: ${reportData.recipients.length}`);
  lines.push('');
  
  reportData.recipients.forEach((recipient: any, index: number) => {
    lines.push(`${index + 1}. **${recipient.name || 'Unnamed'}** - ${recipient.email}`);
  });
  
  lines.push('');

  // Performance Analysis
  lines.push('## Performance Analysis');
  lines.push('');
  
  if (reportData.successRate === 1.0) {
    lines.push('🟢 **Excellent Reliability**: All scheduled executions have been successful');
  } else if (reportData.successRate >= 0.9) {
    lines.push('🟡 **Good Reliability**: Minor issues detected, monitoring recommended');
  } else if (reportData.successRate >= 0.7) {
    lines.push('🟠 **Fair Reliability**: Several failures detected, investigation needed');
  } else {
    lines.push('🔴 **Poor Reliability**: Frequent failures, immediate attention required');
  }
  
  lines.push(`- Success rate: ${Math.round(reportData.successRate * 100)}% (${Math.floor(reportData.executionCount * reportData.successRate)}/${reportData.executionCount} successful)`);
  
  if (reportData.executionCount > 0) {
    const avgExecutionsPerMonth = reportData.executionCount / Math.max(1, Math.ceil((Date.now() - new Date(reportData.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
    lines.push(`- Average executions per month: ${Math.round(avgExecutionsPerMonth * 10) / 10}`);
  }
  
  lines.push('');

  // Schedule Optimization
  lines.push('## Schedule Optimization');
  lines.push('');
  
  switch (reportData.schedule.frequency) {
    case 'daily':
      lines.push('### Daily Schedule Considerations:');
      lines.push('- Ideal for high-activity teams requiring frequent updates');
      lines.push('- Consider time zones of all recipients');
      lines.push('- Avoid sending during non-business hours');
      lines.push('- Monitor email frequency to prevent recipient fatigue');
      break;
      
    case 'weekly':
      lines.push('### Weekly Schedule Considerations:');
      lines.push('- Monday mornings are ideal for planning discussions');
      lines.push('- Friday afternoons good for retrospective reviews');
      lines.push('- Align with team meeting schedules');
      lines.push('- Consider end-of-sprint timing for development teams');
      break;
      
    case 'monthly':
      lines.push('### Monthly Schedule Considerations:');
      lines.push('- Beginning of month ideal for planning and goal setting');
      lines.push('- End of month suitable for performance reviews');
      lines.push('- Align with budget and planning cycles');
      lines.push('- Consider quarterly reporting requirements');
      break;
  }
  
  lines.push('');

  // Management Actions
  lines.push('## Management Actions');
  lines.push('');
  lines.push('### Available Operations:');
  lines.push('- **Execute Now**: Run report immediately for testing');
  lines.push('- **Modify Schedule**: Change frequency, timing, or recipients');
  lines.push('- **Update Configuration**: Modify report parameters and filters');
  lines.push('- **Pause/Resume**: Temporarily disable without deletion');
  lines.push('- **View History**: Review past execution logs and results');
  lines.push('- **Test Delivery**: Send test report to verify configuration');
  lines.push('');

  // Best Practices
  lines.push('## Best Practices');
  lines.push('');
  lines.push('### Report Content:');
  lines.push('- Keep reports focused on actionable insights');
  lines.push('- Include visual elements for better comprehension');
  lines.push('- Provide context and recommendations');
  lines.push('- Maintain consistent formatting and structure');
  lines.push('');
  
  lines.push('### Recipient Management:');
  lines.push('- Regularly review recipient list relevance');
  lines.push('- Provide opt-out options for non-essential recipients');
  lines.push('- Use role-based distribution lists when possible');
  lines.push('- Consider different report variants for different audiences');
  lines.push('');
  
  lines.push('### Monitoring and Maintenance:');
  lines.push('- Set up alerts for execution failures');
  lines.push('- Regularly review report relevance and accuracy');
  lines.push('- Monitor recipient engagement and feedback');
  lines.push('- Update report parameters as project needs evolve');

  return lines.join('\n');
}
