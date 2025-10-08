/**
 * @fileoverview This module is the central registry for all MCP (Model Context Protocol)
 * tools and resources for the Trello integration. It imports all tool and resource
 * definitions and their schemas from the `./tools` and `./resources` directories,
 * and then registers them with the main MCP server instance (`trelloMcpServer`).
 * This centralized registration makes it easy to manage and discover all available
 * capabilities of the Trello MCP server.
 */
import { trelloMcpServer } from './server.js';

// Board tools
import {
  listBoardsSchema,
  getBoardSchema,
  createBoardSchema,
  updateBoardSchema,
  closeBoardSchema,
  reopenBoardSchema,
  deleteBoardSchema,
  listBoards,
  getBoard,
  createBoard,
  updateBoard,
  closeBoard,
  reopenBoard,
  deleteBoard,
} from './tools/boards.js';

// Board resources
import { readBoardResource } from './resources/board.js';

// List tools
import {
  listListsSchema,
  getListSchema,
  createListSchema,
  updateListSchema,
  archiveListSchema,
  unarchiveListSchema,
  moveListSchema,
  getListCardsSchema,
  listLists,
  getList,
  createList,
  updateList,
  archiveList,
  unarchiveList,
  moveList,
  getListCards,
} from './tools/lists.js';

// List resources
import { readListResource } from './resources/list.js';

// Card tools
import {
  getCardSchema,
  createCardSchema,
  updateCardSchema,
  moveCardSchema,
  archiveCardSchema,
  unarchiveCardSchema,
  deleteCardSchema,
  addCommentSchema,
  editCommentSchema,
  deleteCommentSchema,
  addLabelToCardSchema,
  removeLabelFromCardSchema,
  assignMemberToCardSchema,
  removeMemberFromCardSchema,
  addAttachmentUrlSchema,
  removeAttachmentSchema,
  getCardActionsSchema,
  getCard,
  createCard,
  updateCard,
  moveCard,
  archiveCard,
  unarchiveCard,
  deleteCard,
  addComment,
  editComment,
  deleteComment,
  addLabelToCard,
  removeLabelFromCard,
  assignMemberToCard,
  removeMemberFromCard,
  addAttachmentUrl,
  removeAttachment,
  getCardActions,
} from './tools/cards.js';

// Card resources
import { readCardResource } from './resources/card.js';

// Checklist tools
import {
  getChecklistSchema,
  addChecklistSchema,
  updateChecklistSchema,
  deleteChecklistSchema,
  getChecklistsOnCardSchema,
  addCheckItemSchema,
  updateCheckItemSchema,
  deleteCheckItemSchema,
  getCheckItemsSchema,
  getCheckItemSchema,
  getChecklist,
  addChecklist,
  updateChecklist,
  deleteChecklist,
  getChecklistsOnCard,
  addCheckItem,
  updateCheckItem,
  deleteCheckItem,
  getCheckItems,
  getCheckItem,
} from './tools/checklists.js';

// Checklist resources
import { readChecklistResource } from './resources/checklist.js';

// Label tools
import {
  getLabelSchema,
  getLabelsOnBoardSchema,
  createLabelSchema,
  updateLabelSchema,
  deleteLabelSchema,
  getCardsWithLabelSchema,
  getLabel,
  getLabelsOnBoard,
  createLabel,
  updateLabel,
  deleteLabel,
  getCardsWithLabel,
} from './tools/labels.js';

// Label resources
import { readLabelResource } from './resources/label.js';

// Search tools
import {
  searchTrelloSchema,
  searchBoardsSchema,
  searchCardsSchema,
  searchMembersSchema,
  searchTrello,
  searchBoards,
  searchCards,
  searchMembers,
} from './tools/search.js';

// Analytics tools
import {
  getBoardAnalyticsSchema,
  getUserActivitySchema,
  getTeamAnalyticsSchema,
  getWorkflowAnalyticsSchema,
  getLabelAnalyticsSchema,
  getProductivityMetricsSchema,
  getBoardAnalytics,
  getUserActivity,
  getTeamAnalytics,
  getWorkflowAnalytics,
  getLabelAnalytics,
  getProductivityMetrics,
} from './tools/analytics.js';

// Search resources
import { readSearchResource } from './resources/search.js';

// Organization tools
import {
  getOrganizationsSchema,
  getOrganizationSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  deleteOrganizationSchema,
  getOrganizationMembersSchema,
  inviteMemberToOrganizationSchema,
  removeOrganizationMemberSchema,
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationMembers,
  inviteMemberToOrganization,
  removeOrganizationMember,
} from './tools/organizations.js';

// Organization resources
import { readOrganizationResource } from './resources/organization.js';

// Webhook resources
import { readWebhookResource } from './resources/webhook.js';

// Report resources
import { readReportResource } from './resources/report.js';

// Batch tools
import {
  batchGetRequestsSchema,
  batchCreateCardsSchema,
  batchUpdateCardsSchema,
  archiveAllCardsInListSchema,
  moveAllCardsInListSchema,
  batchGetRequests,
  batchCreateCards,
  batchUpdateCards,
  archiveAllCardsInList,
  moveAllCardsInList,
} from './tools/batch.js';

// Automation tools
import {
  createAutomationRuleSchema,
  updateAutomationRuleSchema,
  deleteAutomationRuleSchema,
  listAutomationRulesSchema,
  testAutomationRuleSchema,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  listAutomationRules,
  testAutomationRule,
} from './tools/automation.js';

// Webhook tools
import {
  createWebhookSchema,
  listWebhooksSchema,
  getWebhookSchema,
  updateWebhookSchema,
  deleteWebhookSchema,
  createWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
} from './tools/webhooks.js';

// Export and reporting tools
import {
  exportBoardDataSchema,
  exportUserActivitySchema,
  exportOrganizationDataSchema,
  generateAnalyticsReportSchema,
  createDashboardSchema,
  updateDashboardSchema,
  deleteDashboardSchema,
  getDashboardSchema,
  listDashboardsSchema,
  scheduleReportSchema,
  updateScheduledReportSchema,
  deleteScheduledReportSchema,
  listScheduledReportsSchema,
  executeScheduledReportSchema,
  createDataVisualizationSchema,
  exportBoardData,
  exportUserActivity,
  exportOrganizationData,
  generateAnalyticsReport,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getDashboard,
  listDashboards,
  scheduleReport,
  updateScheduledReport,
  deleteScheduledReport,
  listScheduledReports,
  executeScheduledReport,
  createDataVisualization,
} from './tools/export.js';

// Notifications tools
import {
  listNotificationsSchema,
  getNotificationSchema,
  markNotificationReadSchema,
  markAllNotificationsReadSchema,
  listNotifications,
  getNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from './tools/notifications.js';
// Activity tools
import {
  listRecentActivitySchema,
  listRecentActivity,
} from './tools/activity.js';
// Health tools (meta)
import { healthCheckSchema, healthCheck, whoAmISchema, whoAmI } from './tools/health.js';

/**
 * Registers all available Trello tools and resources with the MCP server.
 * This function is called once during server initialization to populate the
 * server's capabilities.
 */
export function registerAllToolsAndResources() {
  // ===== META/HEALTH TOOLS =====
  trelloMcpServer.registerTool('health_check', 'Report basic server health and configuration status.', healthCheckSchema, healthCheck);
  trelloMcpServer.registerTool('whoami', "Return the Trello account associated with the configured credentials.", whoAmISchema, whoAmI);

  // ===== BOARD TOOLS =====
  trelloMcpServer.registerTool('list_boards', 'List all boards accessible to the authenticated user.', listBoardsSchema, listBoards);
  trelloMcpServer.registerTool('get_board', 'Get detailed information about a specific board.', getBoardSchema, getBoard);
  trelloMcpServer.registerTool('create_board', 'Create a new Trello board.', createBoardSchema, createBoard);
  trelloMcpServer.registerTool('update_board', "Update an existing board's properties.", updateBoardSchema, updateBoard);
  trelloMcpServer.registerTool('close_board', 'Close (archive) a board.', closeBoardSchema, closeBoard);
  trelloMcpServer.registerTool('reopen_board', 'Reopen a closed board.', reopenBoardSchema, reopenBoard);
  trelloMcpServer.registerTool('delete_board', 'Permanently delete a board.', deleteBoardSchema, deleteBoard);

  // ===== LIST TOOLS =====
  trelloMcpServer.registerTool('list_lists', 'List all lists on a board.', listListsSchema, listLists);
  trelloMcpServer.registerTool('get_list', 'Get detailed information about a specific list.', getListSchema, getList);
  trelloMcpServer.registerTool('create_list', 'Create a new list on a board.', createListSchema, createList);
  trelloMcpServer.registerTool('update_list', "Update an existing list's properties.", updateListSchema, updateList);
  trelloMcpServer.registerTool('archive_list', 'Archive (close) a list.', archiveListSchema, archiveList);
  trelloMcpServer.registerTool('unarchive_list', 'Unarchive (reopen) a list.', unarchiveListSchema, unarchiveList);
  trelloMcpServer.registerTool('move_list', 'Move a list to a different position on the board.', moveListSchema, moveList);
  trelloMcpServer.registerTool('get_list_cards', 'Get all cards in a specific list.', getListCardsSchema, getListCards);

  // ===== CARD TOOLS =====
  trelloMcpServer.registerTool('get_card', 'Get detailed information about a specific card.', getCardSchema, getCard);
  trelloMcpServer.registerTool('create_card', 'Create a new card in a list.', createCardSchema, createCard);
  trelloMcpServer.registerTool('update_card', "Update an existing card's properties.", updateCardSchema, updateCard);
  trelloMcpServer.registerTool('move_card', 'Move a card to a different list.', moveCardSchema, moveCard);
  trelloMcpServer.registerTool('archive_card', 'Archive (close) a card.', archiveCardSchema, archiveCard);
  trelloMcpServer.registerTool('unarchive_card', 'Unarchive (reopen) a card.', unarchiveCardSchema, unarchiveCard);
  trelloMcpServer.registerTool('delete_card', 'Permanently delete a card.', deleteCardSchema, deleteCard);
  trelloMcpServer.registerTool('add_comment', 'Add a comment to a card.', addCommentSchema, addComment);
  trelloMcpServer.registerTool('edit_comment', 'Edit an existing comment on a card.', editCommentSchema, editComment);
  trelloMcpServer.registerTool('delete_comment', 'Delete a comment from a card.', deleteCommentSchema, deleteComment);
  trelloMcpServer.registerTool('add_label_to_card', 'Add a label to a card.', addLabelToCardSchema, addLabelToCard);
  trelloMcpServer.registerTool('remove_label_from_card', 'Remove a label from a card.', removeLabelFromCardSchema, removeLabelFromCard);
  trelloMcpServer.registerTool('assign_member_to_card', 'Assign a member to a card.', assignMemberToCardSchema, assignMemberToCard);
  trelloMcpServer.registerTool('remove_member_from_card', 'Remove a member from a card.', removeMemberFromCardSchema, removeMemberFromCard);
  trelloMcpServer.registerTool('add_attachment_url', 'Add a URL as an attachment to a card.', addAttachmentUrlSchema, addAttachmentUrl);
  trelloMcpServer.registerTool('remove_attachment', 'Remove an attachment from a card.', removeAttachmentSchema, removeAttachment);
  trelloMcpServer.registerTool('get_card_actions', 'Get the activity history for a card.', getCardActionsSchema, getCardActions);

  // ===== CHECKLIST TOOLS =====
  trelloMcpServer.registerTool('get_checklist', 'Get detailed information about a specific checklist.', getChecklistSchema, getChecklist);
  trelloMcpServer.registerTool('add_checklist', 'Add a new checklist to a card.', addChecklistSchema, addChecklist);
  trelloMcpServer.registerTool('update_checklist', "Update an existing checklist's properties.", updateChecklistSchema, updateChecklist);
  trelloMcpServer.registerTool('delete_checklist', 'Delete a checklist from a card.', deleteChecklistSchema, deleteChecklist);
  trelloMcpServer.registerTool('get_checklists_on_card', 'Get all checklists on a specific card.', getChecklistsOnCardSchema, getChecklistsOnCard);
  trelloMcpServer.registerTool('add_checkitem', 'Add a new item to a checklist.', addCheckItemSchema, addCheckItem);
  trelloMcpServer.registerTool('update_checkitem', 'Update an existing checklist item.', updateCheckItemSchema, updateCheckItem);
  trelloMcpServer.registerTool('delete_checkitem', 'Delete an item from a checklist.', deleteCheckItemSchema, deleteCheckItem);
  trelloMcpServer.registerTool('get_checkitems', 'Get all items in a checklist.', getCheckItemsSchema, getCheckItems);
  trelloMcpServer.registerTool('get_checkitem', 'Get details for a specific checklist item.', getCheckItemSchema, getCheckItem);

  // ===== LABEL TOOLS =====
  trelloMcpServer.registerTool('get_label', 'Get detailed information about a specific label.', getLabelSchema, getLabel);
  trelloMcpServer.registerTool('get_labels_on_board', 'Get all labels on a specific board.', getLabelsOnBoardSchema, getLabelsOnBoard);
  trelloMcpServer.registerTool('create_label', 'Create a new label on a board.', createLabelSchema, createLabel);
  trelloMcpServer.registerTool('update_label', "Update an existing label's properties.", updateLabelSchema, updateLabel);
  trelloMcpServer.registerTool('delete_label', 'Delete a label.', deleteLabelSchema, deleteLabel);
  trelloMcpServer.registerTool('get_cards_with_label', 'Find all cards that have a specific label.', getCardsWithLabelSchema, getCardsWithLabel);

  // ===== SEARCH TOOLS =====
  trelloMcpServer.registerTool('search_trello', 'Perform a comprehensive search across Trello.', searchTrelloSchema, searchTrello);
  trelloMcpServer.registerTool('search_boards', 'Search for boards by name or description.', searchBoardsSchema, searchBoards);
  trelloMcpServer.registerTool('search_cards', 'Search for cards with advanced filtering.', searchCardsSchema, searchCards);
  trelloMcpServer.registerTool('search_members', 'Search for members by name, username, or email.', searchMembersSchema, searchMembers);

  // ===== ANALYTICS TOOLS =====
  trelloMcpServer.registerTool('get_board_analytics', 'Get comprehensive analytics for a board.', getBoardAnalyticsSchema, getBoardAnalytics);
  trelloMcpServer.registerTool('get_user_activity', 'Get user activity analytics.', getUserActivitySchema, getUserActivity);
  trelloMcpServer.registerTool('get_team_analytics', 'Get team performance analytics.', getTeamAnalyticsSchema, getTeamAnalytics);
  trelloMcpServer.registerTool('get_workflow_analytics', 'Analyze a board\'s workflow.', getWorkflowAnalyticsSchema, getWorkflowAnalytics);
  trelloMcpServer.registerTool('get_label_analytics', 'Analyze label usage on a board.', getLabelAnalyticsSchema, getLabelAnalytics);
  trelloMcpServer.registerTool('get_productivity_metrics', 'Get productivity metrics for a board or user.', getProductivityMetricsSchema, getProductivityMetrics);

  // ===== ORGANIZATION TOOLS =====
  trelloMcpServer.registerTool('get_organizations', 'Get all organizations for a member.', getOrganizationsSchema, getOrganizations);
  trelloMcpServer.registerTool('get_organization', 'Get detailed information about an organization.', getOrganizationSchema, getOrganization);
  trelloMcpServer.registerTool('create_organization', 'Create a new organization (Workspace).', createOrganizationSchema, createOrganization);
  trelloMcpServer.registerTool('update_organization', 'Update an organization\'s settings.', updateOrganizationSchema, updateOrganization);
  trelloMcpServer.registerTool('delete_organization', 'Delete an organization.', deleteOrganizationSchema, deleteOrganization);
  trelloMcpServer.registerTool('get_organization_members', 'Get all members of an organization.', getOrganizationMembersSchema, getOrganizationMembers);
  trelloMcpServer.registerTool('invite_member_to_organization', 'Invite a new member to an organization.', inviteMemberToOrganizationSchema, inviteMemberToOrganization);
  trelloMcpServer.registerTool('remove_member_from_organization', 'Remove a member from an organization.', removeOrganizationMemberSchema, removeOrganizationMember);

  // ===== BATCH TOOLS =====
  trelloMcpServer.registerTool('batch_get_requests', 'Execute multiple GET requests in a single batch call.', batchGetRequestsSchema, batchGetRequests);
  trelloMcpServer.registerTool('batch_create_cards', 'Create multiple cards in a single operation.', batchCreateCardsSchema, batchCreateCards);
  trelloMcpServer.registerTool('batch_update_cards', 'Update multiple cards in a single operation.', batchUpdateCardsSchema, batchUpdateCards);
  trelloMcpServer.registerTool('archive_all_cards_in_list', 'Archive all cards in a specific list.', archiveAllCardsInListSchema, archiveAllCardsInList);
  trelloMcpServer.registerTool('move_all_cards_in_list', 'Move all cards from one list to another.', moveAllCardsInListSchema, moveAllCardsInList);

  // ===== AUTOMATION TOOLS =====
  trelloMcpServer.registerTool('create_automation_rule', 'Create a new automation rule.', createAutomationRuleSchema, createAutomationRule);
  trelloMcpServer.registerTool('update_automation_rule', 'Update an existing automation rule.', updateAutomationRuleSchema, updateAutomationRule);
  trelloMcpServer.registerTool('delete_automation_rule', 'Delete an automation rule.', deleteAutomationRuleSchema, deleteAutomationRule);
  trelloMcpServer.registerTool('list_automation_rules', 'List automation rules.', listAutomationRulesSchema, listAutomationRules);
  trelloMcpServer.registerTool('test_automation_rule', 'Test an automation rule against a card.', testAutomationRuleSchema, testAutomationRule);

  // ===== WEBHOOK TOOLS =====
  trelloMcpServer.registerTool('create_webhook', 'Create a new webhook.', createWebhookSchema, createWebhook);
  trelloMcpServer.registerTool('list_webhooks', 'List all webhooks for the current token.', listWebhooksSchema, listWebhooks);
  trelloMcpServer.registerTool('get_webhook', 'Get details about a specific webhook.', getWebhookSchema, getWebhook);
  trelloMcpServer.registerTool('update_webhook', 'Update a webhook\'s configuration.', updateWebhookSchema, updateWebhook);
  trelloMcpServer.registerTool('delete_webhook', 'Delete a webhook.', deleteWebhookSchema, deleteWebhook);

  // ===== EXPORT AND REPORTING TOOLS =====
  trelloMcpServer.registerTool('export_board_data', 'Export board data to various formats.', exportBoardDataSchema, exportBoardData);
  trelloMcpServer.registerTool('export_user_activity', 'Export a user\'s activity report.', exportUserActivitySchema, exportUserActivity);
  trelloMcpServer.registerTool('export_organization_data', 'Export organization-wide data.', exportOrganizationDataSchema, exportOrganizationData);
  trelloMcpServer.registerTool('generate_analytics_report', 'Generate a comprehensive analytics report.', generateAnalyticsReportSchema, generateAnalyticsReport);
  trelloMcpServer.registerTool('create_dashboard', 'Create a custom analytics dashboard.', createDashboardSchema, createDashboard);
  trelloMcpServer.registerTool('update_dashboard', 'Update a custom dashboard.', updateDashboardSchema, updateDashboard);
  trelloMcpServer.registerTool('delete_dashboard', 'Delete a custom dashboard.', deleteDashboardSchema, deleteDashboard);
  trelloMcpServer.registerTool('get_dashboard', 'Retrieve a dashboard.', getDashboardSchema, getDashboard);
  trelloMcpServer.registerTool('list_dashboards', 'List all available dashboards.', listDashboardsSchema, listDashboards);
  trelloMcpServer.registerTool('schedule_report', 'Schedule automated report generation.', scheduleReportSchema, scheduleReport);
  trelloMcpServer.registerTool('update_scheduled_report', 'Update a scheduled report.', updateScheduledReportSchema, updateScheduledReport);
  trelloMcpServer.registerTool('delete_scheduled_report', 'Delete a scheduled report.', deleteScheduledReportSchema, deleteScheduledReport);
  trelloMcpServer.registerTool('list_scheduled_reports', 'List all scheduled reports.', listScheduledReportsSchema, listScheduledReports);
  trelloMcpServer.registerTool('execute_scheduled_report', 'Execute a scheduled report immediately.', executeScheduledReportSchema, executeScheduledReport);
  trelloMcpServer.registerTool('create_data_visualization', 'Create advanced data visualizations.', createDataVisualizationSchema, createDataVisualization);

  // ===== NOTIFICATIONS TOOLS =====
  trelloMcpServer.registerTool('list_notifications', 'List notifications for a member.', listNotificationsSchema, listNotifications);
  trelloMcpServer.registerTool('get_notification', 'Get a single notification by ID.', getNotificationSchema, getNotification);
  trelloMcpServer.registerTool('mark_notification_read', 'Mark a notification as read.', markNotificationReadSchema, markNotificationRead);
  trelloMcpServer.registerTool('mark_all_notifications_read', 'Mark all notifications as read.', markAllNotificationsReadSchema, markAllNotificationsRead);

  // ===== ACTIVITY TOOLS =====
  trelloMcpServer.registerTool('list_recent_activity', 'List recent activity for a user or board.', listRecentActivitySchema, listRecentActivity);

  // ===== BOARD RESOURCES =====
  trelloMcpServer.registerResource('trello:board/{id}', 'Board Details', 'Get comprehensive information about a Trello board.', 'application/json', readBoardResource);
  
  // ===== LIST RESOURCES =====
  trelloMcpServer.registerResource('trello:list/{id}', 'List Details', 'Get comprehensive information about a Trello list.', 'application/json', readListResource);

  // ===== CARD RESOURCES =====
  trelloMcpServer.registerResource('trello:card/{id}', 'Card Details', 'Get comprehensive information about a Trello card.', 'application/json', readCardResource);

  // ===== CHECKLIST RESOURCES =====
  trelloMcpServer.registerResource('trello:checklist/{id}', 'Checklist Details', 'Get comprehensive information about a Trello checklist.', 'application/json', readChecklistResource);

  // ===== LABEL RESOURCES =====
  trelloMcpServer.registerResource('trello:label/{id}', 'Label Details', 'Get comprehensive information about a Trello label.', 'application/json', readLabelResource);

  // ===== SEARCH RESOURCES =====
  trelloMcpServer.registerResource('trello:search/{query}', 'Search Results', 'Get search results from across Trello.', 'application/json', readSearchResource);

  // ===== ORGANIZATION RESOURCES =====
  trelloMcpServer.registerResource('trello:organization/{id}', 'Organization Details', 'Get comprehensive information about a Trello organization.', 'application/json', readOrganizationResource);

  // ===== WEBHOOK RESOURCES =====
  trelloMcpServer.registerResource('trello:webhook/{id}', 'Webhook Details', 'Get comprehensive information about a Trello webhook.', 'application/json', readWebhookResource);

  // ===== REPORT RESOURCES =====
  trelloMcpServer.registerResource('trello:report/{type}/{id}', 'Report Details', 'Get details about various types of reports.', 'application/json', readReportResource);
}