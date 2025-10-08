/**
 * @fileoverview This file defines the MCP tools for interacting with Trello notifications.
 * It includes functions for listing notifications and marking them as read or unread.
 * Each tool has a corresponding Zod schema for input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `listNotifications` tool.
 */
export const listNotificationsSchema = z.object({
  memberId: z.string().optional().default('me').describe('The ID of the member to list notifications for (defaults to the current user).'),
  unreadOnly: z.boolean().optional().default(false).describe('Set to true to return only unread notifications.'),
  types: z.array(z.string()).optional().describe('A list of notification types to filter by (e.g., "commentCard", "addMemberToCard").'),
  limit: z.number().min(1).max(1000).optional().default(100).describe('The maximum number of notifications to return.'),
  since: z.string().optional().describe('An ISO 8601 timestamp to fetch notifications created after this date.'),
  before: z.string().optional().describe('An ISO 8601 timestamp to fetch notifications created before this date.'),
});

/**
 * Schema for the `getNotification` tool.
 */
export const getNotificationSchema = z.object({
  notificationId: z.string().describe('The ID of the notification to retrieve.'),
});

/**
 * Schema for the `markNotificationRead` tool.
 */
export const markNotificationReadSchema = z.object({
  notificationId: z.string().describe('The ID of the notification to mark as read.'),
});

/**
 * Schema for the `markAllNotificationsRead` tool.
 */
export const markAllNotificationsReadSchema = z.object({
  read: z.boolean().optional().default(true).describe('This parameter is deprecated and has no effect. All notifications will be marked as read.'),
});

// ===== TOOL HANDLERS =====

/**
 * Lists notifications for a given member with various filtering options.
 * @param {z.infer<typeof listNotificationsSchema>} args - The arguments for listing notifications.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the list of notifications and a summary.
 */
export async function listNotifications(args: z.infer<typeof listNotificationsSchema>, context: McpContext) {
  context.logger.info({ memberId: args.memberId, unreadOnly: args.unreadOnly }, 'Listing notifications');

  const params: any = {
    limit: args.limit,
  };
  if (args.unreadOnly) params.read_filter = 'unread';
  if (args.since) params.since = args.since;
  if (args.before) params.before = args.before;
  if (args.types && args.types.length > 0) params.types = args.types.join(',');

  const notifications = await trelloClient.listNotifications(args.memberId, params);

  const summary = `Found ${notifications.length} notification(s)${args.unreadOnly ? ' (unread only)' : ''}.`;

  return {
    success: true,
    data: notifications,
    summary,
  };
}

/**
 * Retrieves a single notification by its ID.
 * @param {z.infer<typeof getNotificationSchema>} args - The arguments for getting a notification.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the notification data.
 */
export async function getNotification(args: z.infer<typeof getNotificationSchema>, context: McpContext) {
  context.logger.info({ notificationId: args.notificationId }, 'Getting notification');
  const notification = await trelloClient.getNotification(args.notificationId);
  return {
    success: true,
    data: notification,
    summary: `Retrieved notification ${args.notificationId}.`,
  };
}

/**
 * Marks a single notification as read.
 * @param {z.infer<typeof markNotificationReadSchema>} args - The arguments for marking a notification as read.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation.
 */
export async function markNotificationRead(args: z.infer<typeof markNotificationReadSchema>, context: McpContext) {
  context.logger.info({ notificationId: args.notificationId }, 'Marking notification as read');
  const updated = await trelloClient.markNotificationRead(args.notificationId, false); // `unread: false` marks it as read
  return {
    success: true,
    data: updated,
    summary: `Marked notification ${args.notificationId} as read.`,
  };
}

/**
 * Marks all of the user's notifications as read.
 * @param {z.infer<typeof markAllNotificationsReadSchema>} args - The arguments for the operation.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation.
 */
export async function markAllNotificationsRead(args: z.infer<typeof markAllNotificationsReadSchema>, context: McpContext) {
  context.logger.info('Marking all notifications as read');
  const updated = await trelloClient.markAllNotificationsRead(true);
  return {
    success: true,
    data: updated,
    summary: `Marked all notifications as read.`,
  };
}


