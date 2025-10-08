/**
 * @fileoverview This module provides tools for creating, managing, and executing automations
 * in Trello. It defines schemas for event-based rules and scheduled actions, and provides
 * functions to interact with them.
 *
 * NOTE: This implementation uses an in-memory store for automation rules and history.
 * In a production environment, this should be replaced with a persistent database
 * to ensure data durability and scalability.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== AUTOMATION RULE SCHEMAS =====

/**
 * Defines the structure of a trigger for an event-based automation rule.
 */
export const automationTriggerSchema = z.object({
  type: z.enum(['card_moved_to_list', 'label_added_to_card', 'member_assigned_to_card', 'due_date_overdue']).describe('Type of event that triggers the rule.'),
  conditions: z.object({
    listId: z.string().optional().describe('ID of the list for move triggers.'),
    labelId: z.string().optional().describe('ID of the label for label triggers.'),
  }).optional().describe('Additional conditions to refine the trigger.'),
});

/**
 * Defines the structure of an action to be performed by an automation rule.
 */
export const automationActionSchema = z.object({
  type: z.enum(['move_card_to_list', 'add_label_to_card', 'create_comment', 'archive_card']).describe('Type of action to perform.'),
  parameters: z.object({
    listId: z.string().optional().describe('Target list ID for move actions.'),
    labelId: z.string().optional().describe('Label ID for label actions.'),
    comment: z.string().optional().describe('Text for comment actions.'),
  }).optional().describe('Parameters required for the action.'),
});

/**
 * Schema for creating a new event-based automation rule.
 */
export const createAutomationRuleSchema = z.object({
  name: z.string().min(1).describe('A descriptive name for the automation rule.'),
  boardId: z.string().describe('The ID of the board where the rule will be active.'),
  trigger: automationTriggerSchema.describe('The event that triggers the automation.'),
  actions: z.array(automationActionSchema).min(1).describe('A list of actions to perform when the rule is triggered.'),
});

/**
 * Schema for updating an existing automation rule.
 */
export const updateAutomationRuleSchema = z.object({
  ruleId: z.string().describe('ID of the automation rule to update.'),
  name: z.string().min(1).optional().describe('A new name for the rule.'),
  enabled: z.boolean().optional().describe('Set to true to enable the rule, false to disable.'),
  trigger: automationTriggerSchema.optional().describe('A new trigger definition.'),
  actions: z.array(automationActionSchema).optional().describe('A new list of actions.'),
});

/**
 * Schema for deleting an automation rule.
 */
export const deleteAutomationRuleSchema = z.object({
  ruleId: z.string().describe('ID of the automation rule to delete.'),
});

/**
 * Schema for listing existing automation rules.
 */
export const listAutomationRulesSchema = z.object({
  boardId: z.string().optional().describe('An optional board ID to filter rules by.'),
});

// ===== IN-MEMORY STORAGE (for demonstration) =====
const automationRules = new Map<string, any>();

// ===== TOOL HANDLERS =====

/**
 * Creates a new event-based automation rule and stores it.
 * @param {z.infer<typeof createAutomationRuleSchema>} args - The details of the rule to create.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the created rule data and a summary.
 */
export async function createAutomationRule(args: z.infer<typeof createAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ name: args.name, boardId: args.boardId }, 'Creating automation rule');
  const ruleId = `rule_${Date.now()}`;
  const rule = { id: ruleId, ...args, enabled: true, createdAt: new Date().toISOString() };
  automationRules.set(ruleId, rule);
  return {
    success: true,
    data: rule,
    summary: `Created automation rule "${args.name}" with ID ${ruleId}.`,
  };
}

/**
 * Updates an existing automation rule.
 * @param {z.infer<typeof updateAutomationRuleSchema>} args - The properties of the rule to update.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated rule data and a summary.
 * @throws {Error} If the rule is not found.
 */
export async function updateAutomationRule(args: z.infer<typeof updateAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ ruleId: args.ruleId }, 'Updating automation rule');
  const rule = automationRules.get(args.ruleId);
  if (!rule) {
    throw new Error(`Automation rule ${args.ruleId} not found.`);
  }
  const updatedRule = { ...rule, ...args, updatedAt: new Date().toISOString() };
  automationRules.set(args.ruleId, updatedRule);
  return {
    success: true,
    data: updatedRule,
    summary: `Updated automation rule ${args.ruleId}.`,
  };
}

/**
 * Deletes an automation rule.
 * @param {z.infer<typeof deleteAutomationRuleSchema>} args - The ID of the rule to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the deletion.
 * @throws {Error} If the rule is not found.
 */
export async function deleteAutomationRule(args: z.infer<typeof deleteAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ ruleId: args.ruleId }, 'Deleting automation rule');
  if (!automationRules.has(args.ruleId)) {
    throw new Error(`Automation rule ${args.ruleId} not found.`);
  }
  automationRules.delete(args.ruleId);
  return {
    success: true,
    summary: `Deleted automation rule ${args.ruleId}.`,
  };
}

/**
 * Lists all configured automation rules, with an option to filter by board.
 * @param {z.infer<typeof listAutomationRulesSchema>} args - The filtering options.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the list of rules and a summary.
 */
export async function listAutomationRules(args: z.infer<typeof listAutomationRulesSchema>, context: McpContext) {
  context.logger.info(args, 'Listing automation rules');
  let rules = Array.from(automationRules.values());
  if (args.boardId) {
    rules = rules.filter(rule => rule.boardId === args.boardId);
  }
  return {
    success: true,
    data: rules,
    summary: `Found ${rules.length} automation rules.`,
  };
}

/**
 * Simulates the execution of a rule's actions on a given card to test its logic.
 * This is a placeholder and does not perform real actions.
 * @param {z.infer<typeof testAutomationRuleSchema>} args - The rule and card to use for testing.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the simulation results.
 * @throws {Error} If the rule is not found.
 */
export async function testAutomationRule(args: z.infer<typeof testAutomationRuleSchema>, context: McpContext) {
  context.logger.info({ ruleId: args.ruleId, cardId: args.testCardId }, 'Testing automation rule');
  const rule = automationRules.get(args.ruleId);
  if (!rule) {
    throw new Error(`Automation rule ${args.ruleId} not found.`);
  }
  
  // This is a simplified simulation. A real implementation would evaluate the trigger
  // against the card's state and then describe the actions that would be taken.
  const simulatedActions = rule.actions.map((action: any) => getActionDescription(action));

  return {
    success: true,
    data: {
      rule: rule.name,
      trigger: rule.trigger.type,
      simulatedActions,
    },
    summary: `Test for rule "${rule.name}": The trigger is '${rule.trigger.type}'. If triggered, it would perform ${simulatedActions.length} action(s).`,
  };
}

// ===== HELPER FUNCTIONS =====

/**
 * Generates a human-readable description of an automation action.
 * @param {any} action - The action object.
 * @returns {string} A descriptive string for the action.
 */
function getActionDescription(action: any): string {
  switch (action.type) {
    case 'move_card_to_list':
      return `Move card to list ${action.parameters?.listId}`;
    case 'add_label_to_card':
      return `Add label ${action.parameters?.labelId} to card`;
    case 'create_comment':
      return `Add comment: "${action.parameters?.comment}"`;
    case 'archive_card':
      return 'Archive the card';
    default:
      return `Execute ${action.type}`;
  }
}
