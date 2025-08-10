import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const getBoardAnalyticsSchema = z.object({
  boardId: z.string().describe('Board ID to analyze'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('Time range for analytics'),
  includeMembers: z.boolean().optional().default(true).describe('Include member activity analysis'),
  includeLabels: z.boolean().optional().default(true).describe('Include label usage analysis'),
  includeLists: z.boolean().optional().default(true).describe('Include list activity analysis'),
  includeCards: z.boolean().optional().default(true).describe('Include card statistics'),
});

export const getUserActivitySchema = z.object({
  memberId: z.string().optional().default('me').describe('Member ID to analyze'),
  boardId: z.string().optional().describe('Board ID to limit analysis to specific board'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('Time range for activity analysis'),
  includeActions: z.boolean().optional().default(true).describe('Include action history'),
  includeBoards: z.boolean().optional().default(true).describe('Include board activity'),
  includeCards: z.boolean().optional().default(true).describe('Include card activity'),
});

export const getTeamAnalyticsSchema = z.object({
  boardId: z.string().describe('Board ID to analyze team performance'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('Time range for team analytics'),
  includeProductivity: z.boolean().optional().default(true).describe('Include productivity metrics'),
  includeCollaboration: z.boolean().optional().default(true).describe('Include collaboration metrics'),
  includeWorkload: z.boolean().optional().default(true).describe('Include workload distribution'),
});

export const getWorkflowAnalyticsSchema = z.object({
  boardId: z.string().describe('Board ID to analyze workflow'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('Time range for workflow analysis'),
  analyzeCardFlow: z.boolean().optional().default(true).describe('Analyze card movement between lists'),
  analyzeCycleTime: z.boolean().optional().default(true).describe('Analyze cycle time metrics'),
  analyzeBottlenecks: z.boolean().optional().default(true).describe('Identify workflow bottlenecks'),
});

export const getLabelAnalyticsSchema = z.object({
  boardId: z.string().describe('Board ID to analyze label usage'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('Time range for label analytics'),
  includeUsageTrends: z.boolean().optional().default(true).describe('Include usage trend analysis'),
  includeDistribution: z.boolean().optional().default(true).describe('Include label distribution analysis'),
  includeEffectiveness: z.boolean().optional().default(true).describe('Include label effectiveness metrics'),
});

export const getProductivityMetricsSchema = z.object({
  boardId: z.string().optional().describe('Board ID to limit analysis to specific board'),
  memberId: z.string().optional().describe('Member ID to analyze individual productivity'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('Time range for productivity analysis'),
  includeVelocity: z.boolean().optional().default(true).describe('Include velocity metrics'),
  includeQuality: z.boolean().optional().default(true).describe('Include quality metrics'),
  includeEfficiency: z.boolean().optional().default(true).describe('Include efficiency metrics'),
});

// ===== TOOL HANDLERS =====

export async function getBoardAnalytics(args: z.infer<typeof getBoardAnalyticsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, timeRange: args.timeRange }, 'Analyzing board metrics');
  
  // Get comprehensive board data
  const board = await trelloClient.getBoard(args.boardId, {
    cards: 'all',
    lists: 'all',
    members: 'all',
    labels: 'all',
    actions: 'all',
    fields: 'all'
  });
  
  const analytics = {
    board: {
      id: board.id,
      name: board.name,
      created: board.dateLastActivity,
    },
    overview: {
      totalCards: 0,
      activeCards: 0,
      completedCards: 0,
      totalLists: 0,
      activeLists: 0,
      totalMembers: 0,
      totalLabels: 0,
    },
    timeRange: args.timeRange,
    generatedAt: new Date().toISOString(),
  };
  
  // Calculate basic metrics
  if (board.cards) {
    analytics.overview.totalCards = board.cards.length;
    analytics.overview.activeCards = board.cards.filter(card => !card.closed).length;
    analytics.overview.completedCards = board.cards.filter(card => card.closed).length;
  }
  
  if (board.lists) {
    analytics.overview.totalLists = board.lists.length;
    analytics.overview.activeLists = board.lists.filter(list => !list.closed).length;
  }
  
  analytics.overview.totalMembers = board.members?.length || 0;
  analytics.overview.totalLabels = board.labels?.length || 0;
  
  // Member activity analysis
  if (args.includeMembers && board.members && board.cards) {
    const memberActivity = board.members.map(member => {
      const assignedCards = board.cards!.filter(card => card.idMembers.includes(member.id));
      const completedCards = assignedCards.filter(card => card.closed);
      
      return {
        member: {
          id: member.id,
          fullName: member.fullName,
          username: member.username,
        },
        metrics: {
          assignedCards: assignedCards.length,
          completedCards: completedCards.length,
          activeCards: assignedCards.length - completedCards.length,
          completionRate: assignedCards.length > 0 ? Math.round((completedCards.length / assignedCards.length) * 100) : 0,
        },
      };
    });
    
    (analytics as any).memberActivity = memberActivity.sort((a, b) => b.metrics.assignedCards - a.metrics.assignedCards);
  }
  
  // Label usage analysis
  if (args.includeLabels && board.labels && board.cards) {
    const labelUsage = board.labels.map(label => {
      const cardsWithLabel = board.cards!.filter(card => 
        card.labels.some(cardLabel => cardLabel.id === label.id)
      );
      
      return {
        label: {
          id: label.id,
          name: label.name,
          color: label.color,
        },
        metrics: {
          totalUses: cardsWithLabel.length,
          activeUses: cardsWithLabel.filter(card => !card.closed).length,
          completedUses: cardsWithLabel.filter(card => card.closed).length,
          usagePercentage: board.cards!.length > 0 ? Math.round((cardsWithLabel.length / board.cards!.length) * 100) : 0,
        },
      };
    });
    
    (analytics as any).labelUsage = labelUsage.sort((a, b) => b.metrics.totalUses - a.metrics.totalUses);
  }
  
  // List analysis
  if (args.includeLists && board.lists && board.cards) {
    const listAnalysis = board.lists.map(list => {
      const cardsInList = board.cards!.filter(card => card.idList === list.id);
      
      return {
        list: {
          id: list.id,
          name: list.name,
          position: list.pos,
        },
        metrics: {
          totalCards: cardsInList.length,
          activeCards: cardsInList.filter(card => !card.closed).length,
          completedCards: cardsInList.filter(card => card.closed).length,
          avgCardsPerMember: 0, // Would need more complex calculation
        },
      };
    });
    
    (analytics as any).listAnalysis = listAnalysis.sort((a, b) => a.list.position - b.list.position);
  }
  
  // Card statistics
  if (args.includeCards && board.cards) {
    const cardStats = {
      withDueDate: board.cards.filter(card => card.due).length,
      overdue: board.cards.filter(card => card.due && new Date(card.due) < new Date() && !card.dueComplete).length,
      withAttachments: board.cards.filter(card => card.badges.attachments > 0).length,
      withChecklists: board.cards.filter(card => card.badges.checkItems > 0).length,
      withComments: board.cards.filter(card => card.badges.comments > 0).length,
      withLabels: board.cards.filter(card => card.labels.length > 0).length,
      withMembers: board.cards.filter(card => card.idMembers.length > 0).length,
    };
    
    (analytics as any).cardStatistics = cardStats;
  }
  
  return {
    success: true,
    data: analytics,
    summary: `Board analytics: ${analytics.overview.totalCards} cards (${analytics.overview.activeCards} active), ${analytics.overview.totalLists} lists, ${analytics.overview.totalMembers} members`,
  };
}

export async function getUserActivity(args: z.infer<typeof getUserActivitySchema>, context: McpContext) {
  context.logger.info({ memberId: args.memberId, timeRange: args.timeRange }, 'Analyzing user activity');
  
  // Get member information
  const member = await trelloClient.getMember(args.memberId);
  
  const activity = {
    member: {
      id: member.id,
      fullName: member.fullName,
      username: member.username,
    },
    timeRange: args.timeRange,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalBoards: 0,
      activeBoards: 0,
      totalCards: 0,
      completedCards: 0,
      totalActions: 0,
    },
  };
  
  // Get member's boards
  if (args.includeBoards) {
    const boards = await trelloClient.listBoards(args.memberId);
    activity.metrics.totalBoards = boards.length;
    activity.metrics.activeBoards = boards.filter(board => !board.closed).length;
    
    (activity as any).boardActivity = boards.slice(0, 10).map(board => ({
      board: {
        id: board.id,
        name: board.name,
        closed: board.closed,
      },
      lastActivity: board.dateLastActivity,
    }));
  }
  
  // Get card activity (if board specified)
  if (args.includeCards && args.boardId) {
    const board = await trelloClient.getBoard(args.boardId, {
      cards: 'all',
      fields: 'name'
    });
    
    if (board.cards) {
      const memberCards = board.cards.filter(card => card.idMembers.includes(member.id));
      activity.metrics.totalCards = memberCards.length;
      activity.metrics.completedCards = memberCards.filter(card => card.closed).length;
      
      (activity as any).cardActivity = {
        assignedCards: memberCards.length,
        completedCards: memberCards.filter(card => card.closed).length,
        activeCards: memberCards.filter(card => !card.closed).length,
        recentCards: memberCards
          .sort((a, b) => new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime())
          .slice(0, 5)
          .map(card => ({
            id: card.id,
            name: card.name,
            lastActivity: card.dateLastActivity,
            closed: card.closed,
          })),
      };
    }
  }
  
  return {
    success: true,
    data: activity,
    summary: `User activity: ${activity.metrics.totalBoards} boards, ${activity.metrics.totalCards} cards assigned (${activity.metrics.completedCards} completed)`,
  };
}

export async function getTeamAnalytics(args: z.infer<typeof getTeamAnalyticsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, timeRange: args.timeRange }, 'Analyzing team performance');
  
  const board = await trelloClient.getBoard(args.boardId, {
    cards: 'all',
    members: 'all',
    lists: 'all',
    fields: 'all'
  });
  
  const teamAnalytics = {
    board: {
      id: board.id,
      name: board.name,
    },
    team: {
      totalMembers: board.members?.length || 0,
      activeMembers: 0,
    },
    timeRange: args.timeRange,
    generatedAt: new Date().toISOString(),
  };
  
  if (args.includeProductivity && board.members && board.cards) {
    const memberProductivity = board.members.map(member => {
      const assignedCards = board.cards!.filter(card => card.idMembers.includes(member.id));
      const completedCards = assignedCards.filter(card => card.closed);
      
      return {
        member: {
          id: member.id,
          fullName: member.fullName,
          username: member.username,
        },
        productivity: {
          assignedCards: assignedCards.length,
          completedCards: completedCards.length,
          completionRate: assignedCards.length > 0 ? Math.round((completedCards.length / assignedCards.length) * 100) : 0,
        },
      };
    });
    
    teamAnalytics.team.activeMembers = memberProductivity.filter(m => m.productivity.assignedCards > 0).length;
    (teamAnalytics as any).productivity = memberProductivity.sort((a, b) => b.productivity.completedCards - a.productivity.completedCards);
  }
  
  if (args.includeWorkload && board.members && board.cards) {
    const workloadDistribution = board.members.map(member => {
      const assignedCards = board.cards!.filter(card => card.idMembers.includes(member.id));
      const overdueCards = assignedCards.filter(card => 
        card.due && new Date(card.due) < new Date() && !card.dueComplete
      );
      
      return {
        member: {
          id: member.id,
          fullName: member.fullName,
        },
        workload: {
          totalCards: assignedCards.length,
          overdueCards: overdueCards.length,
          workloadPercentage: board.cards!.length > 0 ? Math.round((assignedCards.length / board.cards!.length) * 100) : 0,
        },
      };
    });
    
    (teamAnalytics as any).workloadDistribution = workloadDistribution.sort((a, b) => b.workload.totalCards - a.workload.totalCards);
  }
  
  return {
    success: true,
    data: teamAnalytics,
    summary: `Team analytics: ${teamAnalytics.team.totalMembers} members (${teamAnalytics.team.activeMembers} active)`,
  };
}

export async function getWorkflowAnalytics(args: z.infer<typeof getWorkflowAnalyticsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, timeRange: args.timeRange }, 'Analyzing workflow');
  
  const board = await trelloClient.getBoard(args.boardId, {
    cards: 'all',
    lists: 'all',
    actions: 'all',
    fields: 'all'
  });
  
  const workflowAnalytics = {
    board: {
      id: board.id,
      name: board.name,
    },
    workflow: {
      totalLists: board.lists?.length || 0,
      totalCards: board.cards?.length || 0,
    },
    timeRange: args.timeRange,
    generatedAt: new Date().toISOString(),
  };
  
  if (args.analyzeCardFlow && board.lists && board.cards) {
    const listFlow = board.lists.map(list => {
      const cardsInList = board.cards!.filter(card => card.idList === list.id);
      
      return {
        list: {
          id: list.id,
          name: list.name,
          position: list.pos,
        },
        flow: {
          currentCards: cardsInList.filter(card => !card.closed).length,
          completedCards: cardsInList.filter(card => card.closed).length,
          avgTimeInList: 0, // Would need action history analysis
        },
      };
    });
    
    (workflowAnalytics as any).listFlow = listFlow.sort((a, b) => a.list.position - b.list.position);
  }
  
  if (args.analyzeBottlenecks && board.lists && board.cards) {
    const bottlenecks = board.lists.map(list => {
      const cardsInList = board.cards!.filter(card => card.idList === list.id && !card.closed);
      const overdueCards = cardsInList.filter(card => 
        card.due && new Date(card.due) < new Date()
      );
      
      return {
        list: {
          id: list.id,
          name: list.name,
        },
        bottleneckMetrics: {
          cardCount: cardsInList.length,
          overdueCount: overdueCards.length,
          bottleneckScore: cardsInList.length * 0.5 + overdueCards.length * 0.5,
        },
      };
    }).sort((a, b) => b.bottleneckMetrics.bottleneckScore - a.bottleneckMetrics.bottleneckScore);
    
    (workflowAnalytics as any).bottlenecks = bottlenecks.slice(0, 3); // Top 3 bottlenecks
  }
  
  return {
    success: true,
    data: workflowAnalytics,
    summary: `Workflow analytics: ${workflowAnalytics.workflow.totalLists} lists, ${workflowAnalytics.workflow.totalCards} cards`,
  };
}

export async function getLabelAnalytics(args: z.infer<typeof getLabelAnalyticsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, timeRange: args.timeRange }, 'Analyzing label usage');
  
  const board = await trelloClient.getBoard(args.boardId, {
    cards: 'all',
    labels: 'all',
    fields: 'all'
  });
  
  const labelAnalytics = {
    board: {
      id: board.id,
      name: board.name,
    },
    overview: {
      totalLabels: board.labels?.length || 0,
      totalCards: board.cards?.length || 0,
      labeledCards: 0,
    },
    timeRange: args.timeRange,
    generatedAt: new Date().toISOString(),
  };
  
  if (board.cards) {
    labelAnalytics.overview.labeledCards = board.cards.filter(card => card.labels.length > 0).length;
  }
  
  if (args.includeUsageTrends && board.labels && board.cards) {
    const labelUsage = board.labels.map(label => {
      const cardsWithLabel = board.cards!.filter(card => 
        card.labels.some(cardLabel => cardLabel.id === label.id)
      );
      
      return {
        label: {
          id: label.id,
          name: label.name,
          color: label.color,
        },
        usage: {
          totalCards: cardsWithLabel.length,
          activeCards: cardsWithLabel.filter(card => !card.closed).length,
          completedCards: cardsWithLabel.filter(card => card.closed).length,
          usagePercentage: board.cards!.length > 0 ? Math.round((cardsWithLabel.length / board.cards!.length) * 100) : 0,
        },
      };
    });
    
    (labelAnalytics as any).labelUsage = labelUsage.sort((a, b) => b.usage.totalCards - a.usage.totalCards);
  }
  
  if (args.includeDistribution && board.labels) {
    const colorDistribution = board.labels.reduce((dist: any, label) => {
      const color = label.color || 'none';
      dist[color] = (dist[color] || 0) + 1;
      return dist;
    }, {});
    
    (labelAnalytics as any).colorDistribution = colorDistribution;
  }
  
  return {
    success: true,
    data: labelAnalytics,
    summary: `Label analytics: ${labelAnalytics.overview.totalLabels} labels, ${labelAnalytics.overview.labeledCards}/${labelAnalytics.overview.totalCards} cards labeled`,
  };
}

export async function getProductivityMetrics(args: z.infer<typeof getProductivityMetricsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, memberId: args.memberId, timeRange: args.timeRange }, 'Analyzing productivity metrics');
  
  const metrics = {
    scope: {
      boardId: args.boardId,
      memberId: args.memberId,
      timeRange: args.timeRange,
    },
    generatedAt: new Date().toISOString(),
    productivity: {
      velocity: {
        cardsCompleted: 0,
        averageCompletionTime: 0,
        throughput: 0,
      },
      quality: {
        cardsWithDescription: 0,
        cardsWithDueDate: 0,
        cardsWithChecklists: 0,
        qualityScore: 0,
      },
      efficiency: {
        overdueCards: 0,
        onTimeCompletion: 0,
        efficiencyScore: 0,
      },
    },
  };
  
  let cards: any[] = [];
  
  if (args.boardId) {
    const board = await trelloClient.getBoard(args.boardId, {
      cards: 'all',
      fields: 'name'
    });
    
    if (board.cards) {
      cards = args.memberId 
        ? board.cards.filter(card => args.memberId && card.idMembers.includes(args.memberId))
        : board.cards;
    }
  } else if (args.memberId) {
    // Get user's boards and aggregate cards
    const boards = await trelloClient.listBoards(args.memberId);
    
    for (const board of boards.slice(0, 5)) { // Limit to 5 boards for performance
      try {
        const fullBoard = await trelloClient.getBoard(board.id, { cards: 'all' });
        if (fullBoard.cards) {
          cards.push(...fullBoard.cards.filter(card => args.memberId && card.idMembers.includes(args.memberId)));
        }
      } catch (error) {
        // Skip boards we can't access
      }
    }
  }
  
  if (cards.length > 0) {
    const completedCards = cards.filter(card => card.closed);
    const activeCards = cards.filter(card => !card.closed);
    
    // Velocity metrics
    if (args.includeVelocity) {
      metrics.productivity.velocity.cardsCompleted = completedCards.length;
      metrics.productivity.velocity.throughput = Math.round(completedCards.length / 30); // Cards per day (rough estimate)
    }
    
    // Quality metrics
    if (args.includeQuality) {
      metrics.productivity.quality.cardsWithDescription = cards.filter(card => card.desc && card.desc.length > 0).length;
      metrics.productivity.quality.cardsWithDueDate = cards.filter(card => card.due).length;
      metrics.productivity.quality.cardsWithChecklists = cards.filter(card => card.badges.checkItems > 0).length;
      
      const qualityFactors = [
        metrics.productivity.quality.cardsWithDescription,
        metrics.productivity.quality.cardsWithDueDate,
        metrics.productivity.quality.cardsWithChecklists,
      ];
      
      metrics.productivity.quality.qualityScore = cards.length > 0 
        ? Math.round((qualityFactors.reduce((sum, factor) => sum + factor, 0) / (cards.length * 3)) * 100)
        : 0;
    }
    
    // Efficiency metrics
    if (args.includeEfficiency) {
      const overdueCards = cards.filter(card => 
        card.due && new Date(card.due) < new Date() && !card.dueComplete
      );
      
      metrics.productivity.efficiency.overdueCards = overdueCards.length;
      
      const cardsWithDueDate = cards.filter(card => card.due);
      const onTimeCards = cardsWithDueDate.filter(card => 
        !card.due || new Date(card.due) >= new Date() || card.dueComplete
      );
      
      metrics.productivity.efficiency.onTimeCompletion = cardsWithDueDate.length > 0
        ? Math.round((onTimeCards.length / cardsWithDueDate.length) * 100)
        : 100;
      
      metrics.productivity.efficiency.efficiencyScore = Math.max(0, 100 - (overdueCards.length * 10)); // Penalty for overdue cards
    }
  }
  
  return {
    success: true,
    data: metrics,
    summary: `Productivity metrics: ${metrics.productivity.velocity.cardsCompleted} cards completed, ${metrics.productivity.quality.qualityScore}% quality score, ${metrics.productivity.efficiency.efficiencyScore}% efficiency score`,
  };
}
