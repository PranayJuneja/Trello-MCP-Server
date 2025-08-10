import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== AUTOMATION RULE SCHEMAS =====

export const automationTriggerSchema = z.object({
  type: z.enum([
    'card_moved_to_list',
    'card_moved_from_list', 
    'label_added_to_card',
    'label_removed_from_card',
    'member_assigned_to_card',
    'member_removed_from_card',
    'due_date_approaching',
    'due_date_overdue',
    'card_created_in_list',
    'card_archived',
    'card_unarchived',
    'checklist_completed',
    'checklist_item_completed',
  ]).describe('Type of trigger event'),
  conditions: z.object({
    listId: z.string().optional().describe('Specific list ID for list-based triggers'),
    labelId: z.string().optional().describe('Specific label ID for label-based triggers'),
    memberId: z.string().optional().describe('Specific member ID for member-based triggers'),
    daysBeforeDue: z.number().optional().describe('Days before due date for date-based triggers'),
    boardId: z.string().optional().describe('Restrict trigger to specific board'),
    cardNamePattern: z.string().optional().describe('Regex pattern to match card names'),
    cardDescriptionPattern: z.string().optional().describe('Regex pattern to match card descriptions'),
  }).optional().describe('Additional conditions for the trigger'),
});

export const automationActionSchema = z.object({
  type: z.enum([
    'move_card_to_list',
    'add_label_to_card',
    'remove_label_from_card',
    'assign_member_to_card',
    'remove_member_from_card',
    'set_due_date',
    'clear_due_date',
    'mark_due_complete',
    'archive_card',
    'unarchive_card',
    'create_comment',
    'create_checklist',
    'add_checklist_item',
    'create_card',
    'copy_card_to_list',
    'send_notification',
  ]).describe('Type of action to perform'),
  parameters: z.object({
    listId: z.string().optional().describe('Target list ID for move/create actions'),
    labelId: z.string().optional().describe('Label ID for label actions'),
    memberId: z.string().optional().describe('Member ID for assignment actions'),
    dueDate: z.string().optional().describe('Due date for date actions (ISO string)'),
    comment: z.string().optional().describe('Comment text for comment actions'),
    checklistName: z.string().optional().describe('Name for new checklist'),
    checklistItems: z.array(z.string()).optional().describe('Items for new checklist'),
    cardName: z.string().optional().describe('Name for new card'),
    cardDescription: z.string().optional().describe('Description for new card'),
    notificationMessage: z.string().optional().describe('Message for notifications'),
    notificationRecipients: z.array(z.string()).optional().describe('Member IDs to notify'),
  }).optional().describe('Parameters for the action'),
});

export const createAutomationRuleSchema = z.object({
  name: z.string().min(1).max(255).describe('Name for the automation rule'),
  description: z.string().optional().describe('Description of what the rule does'),
  boardId: z.string().describe('Board ID where the rule applies'),
  enabled: z.boolean().optional().default(true).describe('Whether the rule is active'),
  priority: z.number().min(1).max(100).optional().default(50).describe('Rule priority (1-100, higher = more important)'),
  trigger: automationTriggerSchema.describe('Event that triggers the automation'),
  actions: z.array(automationActionSchema).min(1).max(10).describe('Actions to perform when triggered'),
  cooldownMinutes: z.number().min(0).optional().default(0).describe('Minimum minutes between rule executions'),
});

export const updateAutomationRuleSchema = z.object({
  ruleId: z.string().describe('ID of the automation rule to update'),
  name: z.string().min(1).max(255).optional().describe('New name for the rule'),
  description: z.string().optional().describe('New description'),
  enabled: z.boolean().optional().describe('Whether the rule is active'),
  priority: z.number().min(1).max(100).optional().describe('New priority'),
  trigger: automationTriggerSchema.optional().describe('New trigger conditions'),
  actions: z.array(automationActionSchema).optional().describe('New actions'),
  cooldownMinutes: z.number().min(0).optional().describe('New cooldown period'),
});

export const deleteAutomationRuleSchema = z.object({
  ruleId: z.string().describe('ID of the automation rule to delete'),
});

export const listAutomationRulesSchema = z.object({
  boardId: z.string().optional().describe('Filter rules by board ID'),
  enabled: z.boolean().optional().describe('Filter by enabled/disabled status'),
  triggerType: z.string().optional().describe('Filter by trigger type'),
});

export const getAutomationRuleSchema = z.object({
  ruleId: z.string().describe('ID of the automation rule to retrieve'),
});

export const testAutomationRuleSchema = z.object({
  ruleId: z.string().describe('ID of the automation rule to test'),
  testCardId: z.string().describe('Card ID to use for testing the rule'),
  dryRun: z.boolean().optional().default(true).describe('Whether to only simulate the actions'),
});

export const executeAutomationRuleSchema = z.object({
  ruleId: z.string().describe('ID of the automation rule to execute'),
  cardId: z.string().describe('Card ID that triggered the rule'),
  force: z.boolean().optional().default(false).describe('Force execution ignoring cooldown'),
});

export const getAutomationHistorySchema = z.object({
  boardId: z.string().optional().describe('Filter by board ID'),
  ruleId: z.string().optional().describe('Filter by rule ID'),
  cardId: z.string().optional().describe('Filter by card ID'),
  startDate: z.string().optional().describe('Start date filter (ISO string)'),
  endDate: z.string().optional().describe('End date filter (ISO string)'),
  limit: z.number().min(1).max(1000).optional().default(100).describe('Maximum number of history entries'),
});

// ===== SCHEDULED ACTION SCHEMAS =====

export const createScheduledActionSchema = z.object({
  name: z.string().min(1).max(255).describe('Name for the scheduled action'),
  description: z.string().optional().describe('Description of the action'),
  boardId: z.string().describe('Board ID where the action applies'),
  enabled: z.boolean().optional().default(true).describe('Whether the action is active'),
  schedule: z.object({
    type: z.enum(['once', 'daily', 'weekly', 'monthly', 'cron']).describe('Schedule type'),
    datetime: z.string().optional().describe('Specific datetime for one-time actions (ISO string)'),
    time: z.string().optional().describe('Time of day for recurring actions (HH:MM format)'),
    dayOfWeek: z.number().min(0).max(6).optional().describe('Day of week for weekly actions (0=Sunday)'),
    dayOfMonth: z.number().min(1).max(31).optional().describe('Day of month for monthly actions'),
    cronExpression: z.string().optional().describe('Cron expression for complex schedules'),
    timezone: z.string().optional().default('UTC').describe('Timezone for the schedule'),
  }).describe('Schedule configuration'),
  actions: z.array(automationActionSchema).min(1).max(10).describe('Actions to perform on schedule'),
  filters: z.object({
    listIds: z.array(z.string()).optional().describe('Only affect cards in these lists'),
    labelIds: z.array(z.string()).optional().describe('Only affect cards with these labels'),
    memberIds: z.array(z.string()).optional().describe('Only affect cards assigned to these members'),
    dueDateFilter: z.enum(['overdue', 'due_today', 'due_this_week', 'no_due_date']).optional().describe('Filter by due date status'),
    archivedFilter: z.enum(['active_only', 'archived_only', 'both']).optional().default('active_only').describe('Filter by archive status'),
  }).optional().describe('Filters to apply when selecting cards'),
});

export const updateScheduledActionSchema = z.object({
  actionId: z.string().describe('ID of the scheduled action to update'),
  name: z.string().min(1).max(255).optional().describe('New name'),
  description: z.string().optional().describe('New description'),
  enabled: z.boolean().optional().describe('Whether the action is active'),
  schedule: z.object({
    type: z.enum(['once', 'daily', 'weekly', 'monthly', 'cron']).optional(),
    datetime: z.string().optional(),
    time: z.string().optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    cronExpression: z.string().optional(),
    timezone: z.string().optional(),
  }).optional().describe('New schedule configuration'),
  actions: z.array(automationActionSchema).optional().describe('New actions'),
  filters: z.object({
    listIds: z.array(z.string()).optional(),
    labelIds: z.array(z.string()).optional(),
    memberIds: z.array(z.string()).optional(),
    dueDateFilter: z.enum(['overdue', 'due_today', 'due_this_week', 'no_due_date']).optional(),
    archivedFilter: z.enum(['active_only', 'archived_only', 'both']).optional(),
  }).optional().describe('New filters'),
});

export const deleteScheduledActionSchema = z.object({
  actionId: z.string().describe('ID of the scheduled action to delete'),
});

export const listScheduledActionsSchema = z.object({
  boardId: z.string().optional().describe('Filter by board ID'),
  enabled: z.boolean().optional().describe('Filter by enabled/disabled status'),
  scheduleType: z.string().optional().describe('Filter by schedule type'),
});

export const executeScheduledActionSchema = z.object({
  actionId: z.string().describe('ID of the scheduled action to execute'),
  dryRun: z.boolean().optional().default(false).describe('Whether to only simulate the execution'),
});

// ===== IN-MEMORY STORAGE =====
// Note: In a production environment, this would be stored in a database
const automationRules = new Map<string, any>();
const scheduledActions = new Map<string, any>();
const automationHistory: any[] = [];

// ===== TOOL HANDLERS =====

export async function createAutomationRule(args: z.infer<typeof createAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ name: args.name, boardId: args.boardId }, 'Creating automation rule');
  
  const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const rule = {
    id: ruleId,
    ...args,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastExecuted: null,
    executionCount: 0,
  };
  
  automationRules.set(ruleId, rule);
  
  return {
    success: true,
    data: rule,
    summary: `Created automation rule "${args.name}" for board ${args.boardId}`,
  };
}

export async function updateAutomationRule(args: z.infer<typeof updateAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ ruleId: args.ruleId }, 'Updating automation rule');
  
  const rule = automationRules.get(args.ruleId);
  if (!rule) {
    throw new Error(`Automation rule ${args.ruleId} not found`);
  }
  
  const updatedRule = {
    ...rule,
    ...args,
    id: args.ruleId, // Preserve original ID
    updatedAt: new Date().toISOString(),
  };
  
  automationRules.set(args.ruleId, updatedRule);
  
  return {
    success: true,
    data: updatedRule,
    summary: `Updated automation rule ${args.ruleId}`,
  };
}

export async function deleteAutomationRule(args: z.infer<typeof deleteAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ ruleId: args.ruleId }, 'Deleting automation rule');
  
  const rule = automationRules.get(args.ruleId);
  if (!rule) {
    throw new Error(`Automation rule ${args.ruleId} not found`);
  }
  
  automationRules.delete(args.ruleId);
  
  return {
    success: true,
    data: { deleted: true, id: args.ruleId },
    summary: `Deleted automation rule ${args.ruleId}`,
  };
}

export async function listAutomationRules(args: z.infer<typeof listAutomationRulesSchema>, context: McpContext) {
  context.logger.info(args, 'Listing automation rules');
  
  let rules = Array.from(automationRules.values());
  
  if (args.boardId) {
    rules = rules.filter(rule => rule.boardId === args.boardId);
  }
  
  if (args.enabled !== undefined) {
    rules = rules.filter(rule => rule.enabled === args.enabled);
  }
  
  if (args.triggerType) {
    rules = rules.filter(rule => rule.trigger.type === args.triggerType);
  }
  
  // Sort by priority (descending) then by name
  rules.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return a.name.localeCompare(b.name);
  });
  
  return {
    success: true,
    data: rules,
    summary: `Found ${rules.length} automation rules`,
  };
}

export async function getAutomationRule(args: z.infer<typeof getAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ ruleId: args.ruleId }, 'Getting automation rule');
  
  const rule = automationRules.get(args.ruleId);
  if (!rule) {
    throw new Error(`Automation rule ${args.ruleId} not found`);
  }
  
  return {
    success: true,
    data: rule,
    summary: `Retrieved automation rule "${rule.name}"`,
  };
}

export async function testAutomationRule(args: z.infer<typeof testAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ ruleId: args.ruleId, cardId: args.testCardId }, 'Testing automation rule');
  
  const rule = automationRules.get(args.ruleId);
  if (!rule) {
    throw new Error(`Automation rule ${args.ruleId} not found`);
  }
  
  // Get the test card
  const card = await trelloClient.getCard(args.testCardId, {
    actions: 'all',
    members: true,
    checklists: 'all',
  });
  
  // Simulate trigger evaluation
  const triggerMatches = await evaluateTrigger(rule.trigger, card, context);
  
  if (!triggerMatches) {
    return {
      success: true,
      data: {
        triggerMatches: false,
        message: 'Trigger conditions do not match the test card',
        rule: rule.name,
        card: card.name,
      },
      summary: `Test rule "${rule.name}" - trigger does not match card "${card.name}"`,
    };
  }
  
  // Simulate actions
  const actionResults = [];
  for (const action of rule.actions) {
    if (args.dryRun) {
      actionResults.push({
        action: action.type,
        parameters: action.parameters,
        simulated: true,
        description: getActionDescription(action),
      });
    } else {
      try {
        const result = await executeAction(action, card, context);
        actionResults.push({
          action: action.type,
          parameters: action.parameters,
          executed: true,
          result,
        });
      } catch (error: any) {
        actionResults.push({
          action: action.type,
          parameters: action.parameters,
          executed: false,
          error: error.message,
        });
      }
    }
  }
  
  return {
    success: true,
    data: {
      triggerMatches: true,
      rule: rule.name,
      card: card.name,
      dryRun: args.dryRun,
      actions: actionResults,
    },
    summary: `Test rule "${rule.name}" - ${args.dryRun ? 'simulated' : 'executed'} ${actionResults.length} actions`,
  };
}

export async function createScheduledAction(args: z.infer<typeof createScheduledActionSchema>, context: McpContext) {
  context.logger.info({ name: args.name, boardId: args.boardId }, 'Creating scheduled action');
  
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const action = {
    id: actionId,
    ...args,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastExecuted: null,
    nextExecution: calculateNextExecution(args.schedule),
    executionCount: 0,
  };
  
  scheduledActions.set(actionId, action);
  
  return {
    success: true,
    data: action,
    summary: `Created scheduled action "${args.name}" for board ${args.boardId}`,
  };
}

export async function updateScheduledAction(args: z.infer<typeof updateScheduledActionSchema>, context: McpContext) {
  context.logger.info({ actionId: args.actionId }, 'Updating scheduled action');
  
  const action = scheduledActions.get(args.actionId);
  if (!action) {
    throw new Error(`Scheduled action ${args.actionId} not found`);
  }
  
  const updatedAction = {
    ...action,
    ...args,
    id: args.actionId, // Preserve original ID
    updatedAt: new Date().toISOString(),
    nextExecution: args.schedule ? calculateNextExecution(args.schedule) : action.nextExecution,
  };
  
  scheduledActions.set(args.actionId, updatedAction);
  
  return {
    success: true,
    data: updatedAction,
    summary: `Updated scheduled action ${args.actionId}`,
  };
}

export async function deleteScheduledAction(args: z.infer<typeof deleteScheduledActionSchema>, context: McpContext) {
  context.logger.info({ actionId: args.actionId }, 'Deleting scheduled action');
  
  const action = scheduledActions.get(args.actionId);
  if (!action) {
    throw new Error(`Scheduled action ${args.actionId} not found`);
  }
  
  scheduledActions.delete(args.actionId);
  
  return {
    success: true,
    data: { deleted: true, id: args.actionId },
    summary: `Deleted scheduled action ${args.actionId}`,
  };
}

export async function executeScheduledAction(args: z.infer<typeof executeScheduledActionSchema>, context: McpContext) {
  context.logger.info({ actionId: args.actionId, dryRun: args.dryRun }, 'Executing scheduled action');
  
  const action = scheduledActions.get(args.actionId);
  if (!action) {
    throw new Error(`Scheduled action ${args.actionId} not found`);
  }
  
  if (!action.enabled) {
    throw new Error(`Scheduled action ${args.actionId} is disabled`);
  }
  
  // Get board and apply filters to get target cards
  const board = await trelloClient.getBoard(action.boardId, { 
    cards: 'all', 
    lists: 'all',
    members: 'all',
    labels: 'all' 
  });
  
  let targetCards = board.cards || [];
  
  // Apply filters
  if (action.filters) {
    if (action.filters.listIds) {
      targetCards = targetCards.filter(card => action.filters!.listIds!.includes(card.idList));
    }
    
    if (action.filters.labelIds) {
      targetCards = targetCards.filter(card => 
        card.labels.some(label => action.filters!.labelIds!.includes(label.id))
      );
    }
    
    if (action.filters.memberIds) {
      targetCards = targetCards.filter(card => 
        card.idMembers.some(memberId => action.filters!.memberIds!.includes(memberId))
      );
    }
    
    if (action.filters.archivedFilter === 'active_only') {
      targetCards = targetCards.filter(card => !card.closed);
    } else if (action.filters.archivedFilter === 'archived_only') {
      targetCards = targetCards.filter(card => card.closed);
    }
    
    if (action.filters.dueDateFilter) {
      const now = new Date();
      targetCards = targetCards.filter(card => {
        switch (action.filters!.dueDateFilter) {
          case 'overdue':
            return card.due && new Date(card.due) < now && !card.dueComplete;
          case 'due_today':
            return card.due && new Date(card.due).toDateString() === now.toDateString();
          case 'due_this_week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return card.due && new Date(card.due) <= weekFromNow;
          case 'no_due_date':
            return !card.due;
          default:
            return true;
        }
      });
    }
  }
  
  // Execute actions on each target card
  const results = [];
  for (const card of targetCards) {
    for (const actionDef of action.actions) {
      try {
        if (args.dryRun) {
          results.push({
            cardId: card.id,
            cardName: card.name,
            action: actionDef.type,
            simulated: true,
            description: getActionDescription(actionDef),
          });
        } else {
          const result = await executeAction(actionDef, card, context);
          results.push({
            cardId: card.id,
            cardName: card.name,
            action: actionDef.type,
            executed: true,
            result,
          });
        }
      } catch (error: any) {
        results.push({
          cardId: card.id,
          cardName: card.name,
          action: actionDef.type,
          executed: false,
          error: error.message,
        });
      }
    }
  }
  
  // Update execution tracking
  if (!args.dryRun) {
    action.lastExecuted = new Date().toISOString();
    action.executionCount = (action.executionCount || 0) + 1;
    action.nextExecution = calculateNextExecution(action.schedule);
    scheduledActions.set(args.actionId, action);
  }
  
  return {
    success: true,
    data: {
      action: action.name,
      targetCards: targetCards.length,
      results,
      dryRun: args.dryRun,
    },
    summary: `${args.dryRun ? 'Simulated' : 'Executed'} scheduled action "${action.name}" on ${targetCards.length} cards`,
  };
}

export async function listScheduledActions(args: z.infer<typeof listScheduledActionsSchema>, context: McpContext) {
  context.logger.info(args, 'Listing scheduled actions');
  
  let actions = Array.from(scheduledActions.values());
  
  if (args.boardId) {
    actions = actions.filter(action => action.boardId === args.boardId);
  }
  
  if (args.enabled !== undefined) {
    actions = actions.filter(action => action.enabled === args.enabled);
  }
  
  if (args.scheduleType) {
    actions = actions.filter(action => action.schedule.type === args.scheduleType);
  }
  
  // Sort by next execution time
  actions.sort((a, b) => {
    if (!a.nextExecution) return 1;
    if (!b.nextExecution) return -1;
    return new Date(a.nextExecution).getTime() - new Date(b.nextExecution).getTime();
  });
  
  return {
    success: true,
    data: actions,
    summary: `Found ${actions.length} scheduled actions`,
  };
}

export async function getAutomationHistory(args: z.infer<typeof getAutomationHistorySchema>, context: McpContext) {
  context.logger.info(args, 'Getting automation history');
  
  let history = [...automationHistory];
  
  if (args.boardId) {
    history = history.filter(entry => entry.boardId === args.boardId);
  }
  
  if (args.ruleId) {
    history = history.filter(entry => entry.ruleId === args.ruleId);
  }
  
  if (args.cardId) {
    history = history.filter(entry => entry.cardId === args.cardId);
  }
  
  if (args.startDate) {
    const startDate = new Date(args.startDate);
    history = history.filter(entry => new Date(entry.timestamp) >= startDate);
  }
  
  if (args.endDate) {
    const endDate = new Date(args.endDate);
    history = history.filter(entry => new Date(entry.timestamp) <= endDate);
  }
  
  // Sort by timestamp (most recent first)
  history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Apply limit
  history = history.slice(0, args.limit);
  
  return {
    success: true,
    data: history,
    summary: `Retrieved ${history.length} automation history entries`,
  };
}

// ===== HELPER FUNCTIONS =====

async function evaluateTrigger(trigger: any, card: any, context: McpContext): Promise<boolean> {
  // This is a simplified trigger evaluation
  // In a full implementation, this would check the trigger type and conditions
  // against the card's current state and recent actions
  
  context.logger.debug({ triggerType: trigger.type, cardId: card.id }, 'Evaluating trigger');
  
  switch (trigger.type) {
    case 'card_moved_to_list':
      return trigger.conditions?.listId === card.idList;
    
    case 'label_added_to_card':
      return trigger.conditions?.labelId 
        ? card.labels.some((label: any) => label.id === trigger.conditions.labelId)
        : card.labels.length > 0;
    
    case 'member_assigned_to_card':
      return trigger.conditions?.memberId
        ? card.idMembers.includes(trigger.conditions.memberId)
        : card.idMembers.length > 0;
    
    case 'due_date_approaching':
      if (!card.due) return false;
      const dueDate = new Date(card.due);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= (trigger.conditions?.daysBeforeDue || 1);
    
    case 'due_date_overdue':
      if (!card.due) return false;
      return new Date(card.due) < new Date() && !card.dueComplete;
    
    default:
      return false;
  }
}

async function executeAction(action: any, card: any, context: McpContext): Promise<any> {
  context.logger.debug({ actionType: action.type, cardId: card.id }, 'Executing action');
  
  switch (action.type) {
    case 'move_card_to_list':
      if (!action.parameters?.listId) throw new Error('listId required for move action');
      return await trelloClient.moveCard(card.id, action.parameters.listId);
    
    case 'add_label_to_card':
      if (!action.parameters?.labelId) throw new Error('labelId required for add label action');
      return await trelloClient.addLabelToCard(card.id, action.parameters.labelId);
    
    case 'remove_label_from_card':
      if (!action.parameters?.labelId) throw new Error('labelId required for remove label action');
      return await trelloClient.removeLabelFromCard(card.id, action.parameters.labelId);
    
    case 'assign_member_to_card':
      if (!action.parameters?.memberId) throw new Error('memberId required for assign member action');
      return await trelloClient.assignMemberToCard(card.id, action.parameters.memberId);
    
    case 'create_comment':
      if (!action.parameters?.comment) throw new Error('comment required for comment action');
      return await trelloClient.addComment(card.id, action.parameters.comment);
    
    case 'archive_card':
      return await trelloClient.archiveCard(card.id);
    
    case 'set_due_date':
      if (!action.parameters?.dueDate) throw new Error('dueDate required for set due date action');
      return await trelloClient.updateCard(card.id, { due: action.parameters.dueDate });
    
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

function getActionDescription(action: any): string {
  switch (action.type) {
    case 'move_card_to_list':
      return `Move card to list ${action.parameters?.listId}`;
    case 'add_label_to_card':
      return `Add label ${action.parameters?.labelId} to card`;
    case 'remove_label_from_card':
      return `Remove label ${action.parameters?.labelId} from card`;
    case 'assign_member_to_card':
      return `Assign member ${action.parameters?.memberId} to card`;
    case 'create_comment':
      return `Add comment: "${action.parameters?.comment}"`;
    case 'archive_card':
      return 'Archive the card';
    case 'set_due_date':
      return `Set due date to ${action.parameters?.dueDate}`;
    default:
      return `Execute ${action.type}`;
  }
}

function calculateNextExecution(schedule: any): string | null {
  const now = new Date();
  
  switch (schedule.type) {
    case 'once':
      return schedule.datetime || null;
    
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':');
        tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return tomorrow.toISOString();
    
    case 'weekly':
      const nextWeek = new Date(now);
      const daysUntilTarget = (schedule.dayOfWeek - now.getDay() + 7) % 7;
      nextWeek.setDate(nextWeek.getDate() + (daysUntilTarget || 7));
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':');
        nextWeek.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return nextWeek.toISOString();
    
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(schedule.dayOfMonth || 1);
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':');
        nextMonth.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return nextMonth.toISOString();
    
    default:
      return null;
  }
}
