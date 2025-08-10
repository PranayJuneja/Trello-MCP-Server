import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const listNotificationsSchema = z.object({
  memberId: z.string().optional().default('me').describe('Member ID to list notifications for'),
  unreadOnly: z.boolean().optional().default(false).describe('Only return unread notifications'),
  types: z.array(z.string()).optional().describe('Filter by notification types'),
  limit: z.number().min(1).max(1000).optional().default(100).describe('Max number of notifications'),
  since: z.string().optional().describe('Return notifications since an ISO timestamp'),
  before: z.string().optional().describe('Return notifications before an ISO timestamp'),
});

export const getNotificationSchema = z.object({
  notificationId: z.string().describe('ID of the notification to retrieve'),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().describe('ID of the notification to update'),
  read: z.boolean().optional().default(true).describe('Mark as read (true) or unread (false)'),
});

export const markAllNotificationsReadSchema = z.object({
  read: z.boolean().optional().default(true).describe('Mark all as read (true) or unread (false)'),
  ids: z.array(z.string()).optional().describe('Optional specific notification IDs to update'),
});

// ===== TOOL HANDLERS =====

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

  // Basic summary
  const summary = `Found ${notifications.length} notification(s)` + (args.unreadOnly ? ' (unread only)' : '');

  return {
    success: true,
    data: notifications,
    summary,
  };
}

export async function getNotification(args: z.infer<typeof getNotificationSchema>, context: McpContext) {
  context.logger.info({ notificationId: args.notificationId }, 'Getting notification');
  const notification = await trelloClient.getNotification(args.notificationId);
  return {
    success: true,
    data: notification,
    summary: `Retrieved notification ${args.notificationId}`,
  };
}

export async function markNotificationRead(args: z.infer<typeof markNotificationReadSchema>, context: McpContext) {
  context.logger.info({ notificationId: args.notificationId, read: args.read }, 'Updating notification read state');
  const updated = await trelloClient.markNotificationRead(args.notificationId, !args.read ? true : false);
  return {
    success: true,
    data: updated,
    summary: `Marked notification ${args.notificationId} as ${args.read ? 'read' : 'unread'}`,
  };
}

export async function markAllNotificationsRead(args: z.infer<typeof markAllNotificationsReadSchema>, context: McpContext) {
  context.logger.info({ read: args.read, ids: args.ids?.length }, 'Marking all notifications read/unread');
  const updated = await trelloClient.markAllNotificationsRead(!!args.read, args.ids);
  return {
    success: true,
    data: updated,
    summary: `Marked ${args.ids?.length ? args.ids.length : 'all'} notification(s) as ${args.read ? 'read' : 'unread'}`,
  };
}


