/**
 * @fileoverview This file defines the MCP tools for interacting with Trello cards.
 * It includes a comprehensive suite of functions for creating, reading, updating, deleting,
 * and managing various aspects of cards, such as comments, labels, members, and attachments.
 * Each tool is accompanied by a Zod schema for input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `getCard` tool.
 */
export const getCardSchema = z.object({
  id: z.string().describe('The ID of the card to retrieve.'),
  includeActions: z.boolean().optional().describe('Set to true to include recent actions and comments.'),
  includeAttachments: z.boolean().optional().describe('Set to true to include attachments.'),
  includeMembers: z.boolean().optional().describe('Set to true to include member details.'),
  includeChecklists: z.boolean().optional().describe('Set to true to include checklists and their items.'),
});

/**
 * Schema for the `createCard` tool.
 */
export const createCardSchema = z.object({
  listId: z.string().describe('The ID of the list where the new card will be created.'),
  name: z.string().min(1).max(16384).describe('The name/title of the card.'),
  desc: z.string().max(16384).optional().describe('A detailed description for the card.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('The position of the card in the list ("top", "bottom", or a positive number).'),
  due: z.string().optional().describe('The due date for the card in ISO 8601 format.'),
  start: z.string().optional().describe('The start date for the card in ISO 8601 format.'),
  dueComplete: z.boolean().optional().describe('Whether the due date is marked as complete.'),
  idMembers: z.array(z.string()).optional().describe('An array of member IDs to assign to the card.'),
  idLabels: z.array(z.string()).optional().describe('An array of label IDs to apply to the card.'),
  urlSource: z.string().url().optional().describe('A URL to attach to the card upon creation.'),
});

/**
 * Schema for the `updateCard` tool.
 */
export const updateCardSchema = z.object({
  id: z.string().describe('The ID of the card to update.'),
  name: z.string().min(1).max(16384).optional().describe('A new name/title for the card.'),
  desc: z.string().max(16384).optional().describe('A new description for the card.'),
  closed: z.boolean().optional().describe('Set to true to archive the card, or false to unarchive it.'),
  idList: z.string().optional().describe('The ID of a new list to move the card to.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('A new position for the card.'),
  due: z.string().optional().describe('A new due date in ISO 8601 format.'),
  start: z.string().optional().describe('A new start date in ISO 8601 format.'),
  dueComplete: z.boolean().optional().describe('A new completion status for the due date.'),
  subscribed: z.boolean().optional().describe('Set to true to subscribe to the card, or false to unsubscribe.'),
});

/**
 * Schema for the `moveCard` tool.
 */
export const moveCardSchema = z.object({
  id: z.string().describe('The ID of the card to move.'),
  listId: z.string().describe('The ID of the list to move the card to.'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('The position in the new list.'),
});

/**
 * Schema for the `archiveCard` tool.
 */
export const archiveCardSchema = z.object({
  id: z.string().describe('The ID of the card to archive.'),
});

/**
 * Schema for the `unarchiveCard` tool.
 */
export const unarchiveCardSchema = z.object({
  id: z.string().describe('The ID of the card to unarchive.'),
});

/**
 * Schema for the `deleteCard` tool.
 */
export const deleteCardSchema = z.object({
  id: z.string().describe('The ID of the card to delete permanently.'),
});

/**
 * Schema for the `addComment` tool.
 */
export const addCommentSchema = z.object({
  cardId: z.string().describe('The ID of the card to add the comment to.'),
  text: z.string().min(1).max(16384).describe('The text content of the comment.'),
});

/**
 * Schema for the `editComment` tool.
 */
export const editCommentSchema = z.object({
  actionId: z.string().describe('The ID of the comment action to edit.'),
  text: z.string().min(1).max(16384).describe('The new text for the comment.'),
});

/**
 * Schema for the `deleteComment` tool.
 */
export const deleteCommentSchema = z.object({
  actionId: z.string().describe('The ID of the comment action to delete.'),
});

/**
 * Schema for the `addLabelToCard` tool.
 */
export const addLabelToCardSchema = z.object({
  cardId: z.string().describe('The ID of the card to add the label to.'),
  labelId: z.string().describe('The ID of the label to add.'),
});

/**
 * Schema for the `removeLabelFromCard` tool.
 */
export const removeLabelFromCardSchema = z.object({
  cardId: z.string().describe('The ID of the card to remove the label from.'),
  labelId: z.string().describe('The ID of the label to remove.'),
});

/**
 * Schema for the `assignMemberToCard` tool.
 */
export const assignMemberToCardSchema = z.object({
  cardId: z.string().describe('The ID of the card to assign a member to.'),
  memberId: z.string().describe('The ID of the member to assign.'),
});

/**
 * Schema for the `removeMemberFromCard` tool.
 */
export const removeMemberFromCardSchema = z.object({
  cardId: z.string().describe('The ID of the card to remove a member from.'),
  memberId: z.string().describe('The ID of the member to remove.'),
});

/**
 * Schema for the `addAttachmentUrl` tool.
 */
export const addAttachmentUrlSchema = z.object({
  cardId: z.string().describe('The ID of the card to add the attachment to.'),
  url: z.string().url().describe('The URL of the attachment to add.'),
  name: z.string().optional().describe('A name for the attachment.'),
});

/**
 * Schema for the `removeAttachment` tool.
 */
export const removeAttachmentSchema = z.object({
  cardId: z.string().describe('The ID of the card to remove an attachment from.'),
  attachmentId: z.string().describe('The ID of the attachment to remove.'),
});

/**
 * Schema for the `getCardActions` tool.
 */
export const getCardActionsSchema = z.object({
  cardId: z.string().describe('The ID of the card to get actions for.'),
  filter: z.string().optional().default('all').describe('A comma-separated list of action types (e.g., "commentCard,updateCard").'),
  limit: z.number().min(1).max(1000).optional().default(50).describe('The maximum number of actions to return.'),
});

// ===== TOOL HANDLERS =====

/**
 * Retrieves detailed information about a specific Trello card.
 * @param {z.infer<typeof getCardSchema>} args - The arguments for retrieving the card, including optional data to include.
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves with the card data and a summary.
 */
export async function getCard(args: z.infer<typeof getCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Getting card details');
  
  const options: any = {};
  if (args.includeActions) options.actions = 'commentCard';
  if (args.includeAttachments) options.attachments = true;
  if (args.includeMembers) options.members = true;
  if (args.includeChecklists) options.checklists = 'all';
  
  const card = await trelloClient.getCard(args.id, options);
  
  return {
    success: true,
    data: card,
    summary: `Retrieved card "${card.name}" from list ${card.idList}.`,
  };
}

/**
 * Creates a new Trello card in a specified list.
 * @param {z.infer<typeof createCardSchema>} args - The details of the card to be created.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the newly created card data.
 */
export async function createCard(args: z.infer<typeof createCardSchema>, context: McpContext) {
  context.logger.info({ listId: args.listId, name: args.name }, 'Creating new card');
  
  const { listId, ...cardData } = args;
  const request = { idList: listId, ...cardData };
  
  const card = await trelloClient.createCard(request);
  
  return {
    success: true,
    data: card,
    summary: `Created card "${card.name}" with ID ${card.id}.`,
  };
}

/**
 * Updates an existing Trello card.
 * @param {z.infer<typeof updateCardSchema>} args - The ID of the card and the fields to update.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated card data.
 */
export async function updateCard(args: z.infer<typeof updateCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Updating card');
  const { id, ...updateData } = args;
  const card = await trelloClient.updateCard(id, updateData);
  return {
    success: true,
    data: card,
    summary: `Updated card "${card.name}".`,
  };
}

/**
 * Moves a card to a different list.
 * @param {z.infer<typeof moveCardSchema>} args - The card to move and the target list.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated card data.
 */
export async function moveCard(args: z.infer<typeof moveCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id, listId: args.listId }, 'Moving card');
  const card = await trelloClient.moveCard(args.id, args.listId, args.pos);
  return {
    success: true,
    data: card,
    summary: `Moved card "${card.name}" to list ${args.listId}.`,
  };
}

/**
 * Archives a Trello card.
 * @param {z.infer<typeof archiveCardSchema>} args - The ID of the card to archive.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated card data.
 */
export async function archiveCard(args: z.infer<typeof archiveCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Archiving card');
  const card = await trelloClient.archiveCard(args.id);
  return {
    success: true,
    data: card,
    summary: `Archived card "${card.name}".`,
  };
}

/**
 * Unarchives a Trello card.
 * @param {z.infer<typeof unarchiveCardSchema>} args - The ID of the card to unarchive.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated card data.
 */
export async function unarchiveCard(args: z.infer<typeof unarchiveCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Unarchiving card');
  const card = await trelloClient.unarchiveCard(args.id);
  return {
    success: true,
    data: card,
    summary: `Unarchived card "${card.name}".`,
  };
}

/**
 * Permanently deletes a Trello card. This action is irreversible.
 * @param {z.infer<typeof deleteCardSchema>} args - The ID of the card to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the deletion.
 */
export async function deleteCard(args: z.infer<typeof deleteCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Deleting card permanently');
  const card = await trelloClient.getCard(args.id, { fields: 'name' });
  await trelloClient.deleteCard(args.id);
  return {
    success: true,
    data: { id: args.id, deleted: true },
    summary: `Permanently deleted card "${card.name}".`,
  };
}

/**
 * Adds a comment to a Trello card.
 * @param {z.infer<typeof addCommentSchema>} args - The card ID and comment text.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the new comment action data.
 */
export async function addComment(args: z.infer<typeof addCommentSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId }, 'Adding comment to card');
  const action = await trelloClient.addComment(args.cardId, args.text);
  return {
    success: true,
    data: action,
    summary: `Added comment to card.`,
  };
}

/**
 * Edits an existing comment on a Trello card.
 * @param {z.infer<typeof editCommentSchema>} args - The comment action ID and new text.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated comment action data.
 */
export async function editComment(args: z.infer<typeof editCommentSchema>, context: McpContext) {
  context.logger.info({ actionId: args.actionId }, 'Editing comment');
  const action = await trelloClient.editComment(args.actionId, args.text);
  return {
    success: true,
    data: action,
    summary: `Updated comment.`,
  };
}

/**
 * Deletes a comment from a Trello card.
 * @param {z.infer<typeof deleteCommentSchema>} args - The ID of the comment action to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the deletion.
 */
export async function deleteComment(args: z.infer<typeof deleteCommentSchema>, context: McpContext) {
  context.logger.info({ actionId: args.actionId }, 'Deleting comment');
  await trelloClient.deleteComment(args.actionId);
  return {
    success: true,
    data: { id: args.actionId, deleted: true },
    summary: `Deleted comment.`,
  };
}

/**
 * Adds a label to a Trello card.
 * @param {z.infer<typeof addLabelToCardSchema>} args - The card ID and the label ID to add.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated card data.
 */
export async function addLabelToCard(args: z.infer<typeof addLabelToCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, labelId: args.labelId }, 'Adding label to card');
  const card = await trelloClient.addLabelToCard(args.cardId, args.labelId);
  return {
    success: true,
    data: card,
    summary: `Added label to card "${card.name}".`,
  };
}

/**
 * Removes a label from a Trello card.
 * @param {z.infer<typeof removeLabelFromCardSchema>} args - The card ID and the label ID to remove.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the removal.
 */
export async function removeLabelFromCard(args: z.infer<typeof removeLabelFromCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, labelId: args.labelId }, 'Removing label from card');
  await trelloClient.removeLabelFromCard(args.cardId, args.labelId);
  const card = await trelloClient.getCard(args.cardId, { fields: 'name' });
  return {
    success: true,
    data: { cardId: args.cardId, labelId: args.labelId, removed: true },
    summary: `Removed label from card "${card.name}".`,
  };
}

/**
 * Assigns a member to a Trello card.
 * @param {z.infer<typeof assignMemberToCardSchema>} args - The card ID and the member ID to assign.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated card data.
 */
export async function assignMemberToCard(args: z.infer<typeof assignMemberToCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, memberId: args.memberId }, 'Assigning member to card');
  const card = await trelloClient.assignMemberToCard(args.cardId, args.memberId);
  return {
    success: true,
    data: card,
    summary: `Assigned member to card "${card.name}".`,
  };
}

/**
 * Removes a member from a Trello card.
 * @param {z.infer<typeof removeMemberFromCardSchema>} args - The card ID and the member ID to remove.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the removal.
 */
export async function removeMemberFromCard(args: z.infer<typeof removeMemberFromCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, memberId: args.memberId }, 'Removing member from card');
  await trelloClient.removeMemberFromCard(args.cardId, args.memberId);
  const card = await trelloClient.getCard(args.cardId, { fields: 'name' });
  return {
    success: true,
    data: { cardId: args.cardId, memberId: args.memberId, removed: true },
    summary: `Removed member from card "${card.name}".`,
  };
}

/**
 * Adds a URL as an attachment to a Trello card.
 * @param {z.infer<typeof addAttachmentUrlSchema>} args - The card ID and attachment URL.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the new attachment data.
 */
export async function addAttachmentUrl(args: z.infer<typeof addAttachmentUrlSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, url: args.url }, 'Adding URL attachment to card');
  const attachment = await trelloClient.addUrlAttachment(args.cardId, args.url, args.name);
  return {
    success: true,
    data: attachment,
    summary: `Added URL attachment "${attachment.name}" to card.`,
  };
}

/**
 * Removes an attachment from a Trello card.
 * @param {z.infer<typeof removeAttachmentSchema>} args - The card ID and attachment ID to remove.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of the removal.
 */
export async function removeAttachment(args: z.infer<typeof removeAttachmentSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, attachmentId: args.attachmentId }, 'Removing attachment from card');
  await trelloClient.deleteAttachment(args.cardId, args.attachmentId);
  return {
    success: true,
    data: { cardId: args.cardId, attachmentId: args.attachmentId, removed: true },
    summary: `Removed attachment from card.`,
  };
}

/**
 * Retrieves a list of actions (events) for a specific card.
 * @param {z.infer<typeof getCardActionsSchema>} args - The card ID and filtering options.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the list of actions.
 */
export async function getCardActions(args: z.infer<typeof getCardActionsSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, filter: args.filter }, 'Getting card actions');
  const card = await trelloClient.getCard(args.cardId, { actions: args.filter });
  let actions = card.actions || [];
  if (args.limit && actions.length > args.limit) {
    actions = actions.slice(0, args.limit);
  }
  return {
    success: true,
    data: actions,
    summary: `Found ${actions.length} actions for card "${card.name}".`,
  };
}