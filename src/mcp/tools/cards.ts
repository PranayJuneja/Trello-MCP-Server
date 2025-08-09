import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const getCardSchema = z.object({
  id: z.string().describe('Card ID to retrieve'),
  includeActions: z.boolean().optional().describe('Whether to include recent actions/comments'),
  includeAttachments: z.boolean().optional().describe('Whether to include attachments'),
  includeMembers: z.boolean().optional().describe('Whether to include member details'),
  includeChecklists: z.boolean().optional().describe('Whether to include checklists and items'),
});

export const createCardSchema = z.object({
  listId: z.string().describe('List ID to create the card in'),
  name: z.string().min(1).max(16384).describe('Name/title of the card'),
  desc: z.string().max(16384).optional().describe('Description of the card'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position of the card (number, "top", or "bottom")'),
  due: z.string().optional().describe('Due date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'),
  start: z.string().optional().describe('Start date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'),
  dueComplete: z.boolean().optional().describe('Whether the due date is marked as complete'),
  idMembers: z.array(z.string()).optional().describe('Array of member IDs to assign to the card'),
  idLabels: z.array(z.string()).optional().describe('Array of label IDs to assign to the card'),
  urlSource: z.string().url().optional().describe('URL to attach to the card'),
});

export const updateCardSchema = z.object({
  id: z.string().describe('Card ID to update'),
  name: z.string().min(1).max(16384).optional().describe('New name/title for the card'),
  desc: z.string().max(16384).optional().describe('New description for the card'),
  closed: z.boolean().optional().describe('Whether the card is archived'),
  idList: z.string().optional().describe('List ID to move the card to'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('New position of the card'),
  due: z.string().optional().describe('Due date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'),
  start: z.string().optional().describe('Start date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'),
  dueComplete: z.boolean().optional().describe('Whether the due date is marked as complete'),
  subscribed: z.boolean().optional().describe('Whether the user is subscribed to the card'),
});

export const moveCardSchema = z.object({
  id: z.string().describe('Card ID to move'),
  listId: z.string().describe('List ID to move the card to'),
  pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('Position in the new list'),
});

export const archiveCardSchema = z.object({
  id: z.string().describe('Card ID to archive'),
});

export const unarchiveCardSchema = z.object({
  id: z.string().describe('Card ID to unarchive'),
});

export const deleteCardSchema = z.object({
  id: z.string().describe('Card ID to delete permanently'),
});

export const addCommentSchema = z.object({
  cardId: z.string().describe('Card ID to add comment to'),
  text: z.string().min(1).max(16384).describe('Comment text'),
});

export const editCommentSchema = z.object({
  actionId: z.string().describe('Comment action ID to edit'),
  text: z.string().min(1).max(16384).describe('New comment text'),
});

export const deleteCommentSchema = z.object({
  actionId: z.string().describe('Comment action ID to delete'),
});

export const addLabelToCardSchema = z.object({
  cardId: z.string().describe('Card ID to add label to'),
  labelId: z.string().describe('Label ID to add'),
});

export const removeLabelFromCardSchema = z.object({
  cardId: z.string().describe('Card ID to remove label from'),
  labelId: z.string().describe('Label ID to remove'),
});

export const assignMemberToCardSchema = z.object({
  cardId: z.string().describe('Card ID to assign member to'),
  memberId: z.string().describe('Member ID to assign'),
});

export const removeMemberFromCardSchema = z.object({
  cardId: z.string().describe('Card ID to remove member from'),
  memberId: z.string().describe('Member ID to remove'),
});

export const addAttachmentUrlSchema = z.object({
  cardId: z.string().describe('Card ID to add attachment to'),
  url: z.string().url().describe('URL to attach'),
  name: z.string().optional().describe('Name for the attachment'),
});

export const removeAttachmentSchema = z.object({
  cardId: z.string().describe('Card ID to remove attachment from'),
  attachmentId: z.string().describe('Attachment ID to remove'),
});

export const getCardActionsSchema = z.object({
  cardId: z.string().describe('Card ID to get actions for'),
  filter: z.string().optional().default('all').describe('Filter for action types (default: all)'),
  limit: z.number().min(1).max(1000).optional().default(50).describe('Maximum number of actions to return'),
});

// ===== TOOL HANDLERS =====

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
    summary: `Retrieved card "${card.name}" from list ${card.idList}`,
  };
}

export async function createCard(args: z.infer<typeof createCardSchema>, context: McpContext) {
  context.logger.info({ listId: args.listId, name: args.name }, 'Creating new card');
  
  const request = {
    name: args.name,
    idList: args.listId,
    ...(args.desc && { desc: args.desc }),
    ...(args.pos !== undefined && { pos: args.pos }),
    ...(args.due && { due: args.due }),
    ...(args.start && { start: args.start }),
    ...(args.dueComplete !== undefined && { dueComplete: args.dueComplete }),
    ...(args.idMembers && { idMembers: args.idMembers }),
    ...(args.idLabels && { idLabels: args.idLabels }),
    ...(args.urlSource && { urlSource: args.urlSource }),
  };
  
  const card = await trelloClient.createCard(request);
  
  return {
    success: true,
    data: card,
    summary: `Created card "${card.name}" with ID ${card.id}`,
  };
}

export async function updateCard(args: z.infer<typeof updateCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Updating card');
  
  const { id, ...updateData } = args;
  const card = await trelloClient.updateCard(id, updateData);
  
  return {
    success: true,
    data: card,
    summary: `Updated card "${card.name}"`,
  };
}

export async function moveCard(args: z.infer<typeof moveCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id, listId: args.listId }, 'Moving card');
  
  const card = await trelloClient.moveCard(args.id, args.listId, args.pos);
  
  return {
    success: true,
    data: card,
    summary: `Moved card "${card.name}" to list ${args.listId}`,
  };
}

export async function archiveCard(args: z.infer<typeof archiveCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Archiving card');
  
  const card = await trelloClient.archiveCard(args.id);
  
  return {
    success: true,
    data: card,
    summary: `Archived card "${card.name}"`,
  };
}

export async function unarchiveCard(args: z.infer<typeof unarchiveCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Unarchiving card');
  
  const card = await trelloClient.unarchiveCard(args.id);
  
  return {
    success: true,
    data: card,
    summary: `Unarchived card "${card.name}"`,
  };
}

export async function deleteCard(args: z.infer<typeof deleteCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.id }, 'Deleting card permanently');
  
  // Get card name first for summary
  const card = await trelloClient.getCard(args.id, { fields: 'name' });
  await trelloClient.deleteCard(args.id);
  
  return {
    success: true,
    data: { id: args.id, deleted: true },
    summary: `Permanently deleted card "${card.name}"`,
  };
}

export async function addComment(args: z.infer<typeof addCommentSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId }, 'Adding comment to card');
  
  const action = await trelloClient.addComment(args.cardId, args.text);
  
  return {
    success: true,
    data: action,
    summary: `Added comment to card`,
  };
}

export async function editComment(args: z.infer<typeof editCommentSchema>, context: McpContext) {
  context.logger.info({ actionId: args.actionId }, 'Editing comment');
  
  const action = await trelloClient.editComment(args.actionId, args.text);
  
  return {
    success: true,
    data: action,
    summary: `Updated comment`,
  };
}

export async function deleteComment(args: z.infer<typeof deleteCommentSchema>, context: McpContext) {
  context.logger.info({ actionId: args.actionId }, 'Deleting comment');
  
  await trelloClient.deleteComment(args.actionId);
  
  return {
    success: true,
    data: { id: args.actionId, deleted: true },
    summary: `Deleted comment`,
  };
}

export async function addLabelToCard(args: z.infer<typeof addLabelToCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, labelId: args.labelId }, 'Adding label to card');
  
  const card = await trelloClient.addLabelToCard(args.cardId, args.labelId);
  
  return {
    success: true,
    data: card,
    summary: `Added label to card "${card.name}"`,
  };
}

export async function removeLabelFromCard(args: z.infer<typeof removeLabelFromCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, labelId: args.labelId }, 'Removing label from card');
  
  await trelloClient.removeLabelFromCard(args.cardId, args.labelId);
  
  // Get card details for summary
  const card = await trelloClient.getCard(args.cardId, { fields: 'name' });
  
  return {
    success: true,
    data: { cardId: args.cardId, labelId: args.labelId, removed: true },
    summary: `Removed label from card "${card.name}"`,
  };
}

export async function assignMemberToCard(args: z.infer<typeof assignMemberToCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, memberId: args.memberId }, 'Assigning member to card');
  
  const card = await trelloClient.assignMemberToCard(args.cardId, args.memberId);
  
  return {
    success: true,
    data: card,
    summary: `Assigned member to card "${card.name}"`,
  };
}

export async function removeMemberFromCard(args: z.infer<typeof removeMemberFromCardSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, memberId: args.memberId }, 'Removing member from card');
  
  await trelloClient.removeMemberFromCard(args.cardId, args.memberId);
  
  // Get card details for summary
  const card = await trelloClient.getCard(args.cardId, { fields: 'name' });
  
  return {
    success: true,
    data: { cardId: args.cardId, memberId: args.memberId, removed: true },
    summary: `Removed member from card "${card.name}"`,
  };
}

export async function addAttachmentUrl(args: z.infer<typeof addAttachmentUrlSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, url: args.url }, 'Adding URL attachment to card');
  
  const attachment = await trelloClient.addUrlAttachment(args.cardId, args.url, args.name);
  
  return {
    success: true,
    data: attachment,
    summary: `Added URL attachment "${attachment.name}" to card`,
  };
}

export async function removeAttachment(args: z.infer<typeof removeAttachmentSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, attachmentId: args.attachmentId }, 'Removing attachment from card');
  
  await trelloClient.deleteAttachment(args.cardId, args.attachmentId);
  
  return {
    success: true,
    data: { cardId: args.cardId, attachmentId: args.attachmentId, removed: true },
    summary: `Removed attachment from card`,
  };
}

export async function getCardActions(args: z.infer<typeof getCardActionsSchema>, context: McpContext) {
  context.logger.info({ cardId: args.cardId, filter: args.filter }, 'Getting card actions');
  
  const card = await trelloClient.getCard(args.cardId, {
    actions: args.filter,
  });
  
  let actions = card.actions || [];
  
  // Apply limit manually since the API doesn't support actions_limit in this endpoint
  if (args.limit && actions.length > args.limit) {
    actions = actions.slice(0, args.limit);
  }
  
  return {
    success: true,
    data: actions,
    summary: `Found ${actions.length} actions for card "${card.name}"`,
  };
}
