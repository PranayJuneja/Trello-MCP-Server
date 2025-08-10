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
  updateLabelFieldSchema,
  getLabelUsageSchema,
  bulkUpdateLabelsSchema,
  getCardsWithLabelSchema,
  getLabel,
  getLabelsOnBoard,
  createLabel,
  updateLabel,
  deleteLabel,
  updateLabelField,
  getLabelUsage,
  bulkUpdateLabels,
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
  getAdvancedSearchSchema,
  getSavedSearchesSchema,
  createSavedSearchSchema,
  searchTrello,
  searchBoards,
  searchCards,
  searchMembers,
  getAdvancedSearch,
  getSavedSearches,
  createSavedSearch,
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
  getOrganizationBoardsSchema,
  inviteMemberToOrganizationSchema,
  updateOrganizationMemberSchema,
  removeOrganizationMemberSchema,
  deactivateOrganizationMemberSchema,
  getOrganizationMembershipsSchema,
  getOrganizationMembershipSchema,
  getOrganizationAnalyticsSchema,
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationMembers,
  getOrganizationBoards,
  inviteMemberToOrganization,
  updateOrganizationMember,
  removeOrganizationMember,
  deactivateOrganizationMember,
  getOrganizationMemberships,
  getOrganizationMembership,
  getOrganizationAnalytics,
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
  batchMoveCardsSchema,
  batchAssignMembersSchema,
  batchApplyLabelsSchema,
  archiveAllCardsInListSchema,
  moveAllCardsInListSchema,
  bulkArchiveCardsSchema,
  bulkUnarchiveCardsSchema,
  bulkDeleteCardsSchema,
  batchGetRequests,
  batchCreateCards,
  batchUpdateCards,
  batchMoveCards,
  batchAssignMembers,
  batchApplyLabels,
  archiveAllCardsInList,
  moveAllCardsInList,
  bulkArchiveCards,
  bulkUnarchiveCards,
  bulkDeleteCards,
} from './tools/batch.js';

// Automation tools
import {
  createAutomationRuleSchema,
  updateAutomationRuleSchema,
  deleteAutomationRuleSchema,
  listAutomationRulesSchema,
  getAutomationRuleSchema,
  testAutomationRuleSchema,
  createScheduledActionSchema,
  updateScheduledActionSchema,
  deleteScheduledActionSchema,
  listScheduledActionsSchema,
  executeScheduledActionSchema,
  getAutomationHistorySchema,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  listAutomationRules,
  getAutomationRule,
  testAutomationRule,
  createScheduledAction,
  updateScheduledAction,
  deleteScheduledAction,
  listScheduledActions,
  executeScheduledAction,
  getAutomationHistory,
} from './tools/automation.js';

// Webhook tools
import {
  createWebhookSchema,
  listWebhooksSchema,
  getWebhookSchema,
  updateWebhookSchema,
  deleteWebhookSchema,
  createWebhookEventProcessorSchema,
  updateWebhookEventProcessorSchema,
  deleteWebhookEventProcessorSchema,
  listWebhookEventProcessorsSchema,
  processWebhookEventSchema,
  getRealTimeSyncStatusSchema,
  enableRealTimeSyncSchema,
  disableRealTimeSyncSchema,
  getWebhookEventsSchema,
  createWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  createWebhookEventProcessor,
  updateWebhookEventProcessor,
  deleteWebhookEventProcessor,
  listWebhookEventProcessors,
  processWebhookEvent,
  getRealTimeSyncStatus,
  enableRealTimeSync,
  disableRealTimeSync,
  getWebhookEvents,
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

export function registerAllToolsAndResources() {
  // ===== META/HEALTH TOOLS =====
  trelloMcpServer.registerTool(
    'health_check',
    'Report basic server health and configuration status',
    healthCheckSchema,
    healthCheck
  );

  trelloMcpServer.registerTool(
    'whoami',
    'Return the Trello account associated with the configured credentials',
    whoAmISchema,
    whoAmI
  );
  // ===== BOARD TOOLS =====
  
  trelloMcpServer.registerTool(
    'list_boards',
    'List all boards accessible to the authenticated user',
    listBoardsSchema,
    listBoards
  );
  
  trelloMcpServer.registerTool(
    'get_board',
    'Get detailed information about a specific board',
    getBoardSchema,
    getBoard
  );
  
  trelloMcpServer.registerTool(
    'create_board',
    'Create a new Trello board',
    createBoardSchema,
    createBoard
  );
  
  trelloMcpServer.registerTool(
    'update_board',
    'Update an existing board\'s properties',
    updateBoardSchema,
    updateBoard
  );
  
  trelloMcpServer.registerTool(
    'close_board',
    'Close a board (archive it)',
    closeBoardSchema,
    closeBoard
  );
  
  trelloMcpServer.registerTool(
    'reopen_board',
    'Reopen a closed board',
    reopenBoardSchema,
    reopenBoard
  );
  
  trelloMcpServer.registerTool(
    'delete_board',
    'Permanently delete a board (cannot be undone)',
    deleteBoardSchema,
    deleteBoard
  );
  
  // ===== LIST TOOLS =====
  
  trelloMcpServer.registerTool(
    'list_lists',
    'List all lists on a board',
    listListsSchema,
    listLists
  );
  
  trelloMcpServer.registerTool(
    'get_list',
    'Get detailed information about a specific list',
    getListSchema,
    getList
  );
  
  trelloMcpServer.registerTool(
    'create_list',
    'Create a new list on a board',
    createListSchema,
    createList
  );
  
  trelloMcpServer.registerTool(
    'update_list',
    'Update an existing list\'s properties',
    updateListSchema,
    updateList
  );
  
  trelloMcpServer.registerTool(
    'archive_list',
    'Archive a list (close it)',
    archiveListSchema,
    archiveList
  );
  
  trelloMcpServer.registerTool(
    'unarchive_list',
    'Unarchive a list (reopen it)',
    unarchiveListSchema,
    unarchiveList
  );
  
  trelloMcpServer.registerTool(
    'move_list',
    'Move a list to a different position on the board',
    moveListSchema,
    moveList
  );
  
  trelloMcpServer.registerTool(
    'get_list_cards',
    'Get all cards in a specific list',
    getListCardsSchema,
    getListCards
  );

  // ===== CARD TOOLS =====
  
  trelloMcpServer.registerTool(
    'get_card',
    'Get detailed information about a specific card',
    getCardSchema,
    getCard
  );
  
  trelloMcpServer.registerTool(
    'create_card',
    'Create a new card in a list',
    createCardSchema,
    createCard
  );
  
  trelloMcpServer.registerTool(
    'update_card',
    'Update an existing card\'s properties',
    updateCardSchema,
    updateCard
  );
  
  trelloMcpServer.registerTool(
    'move_card',
    'Move a card to a different list',
    moveCardSchema,
    moveCard
  );
  
  trelloMcpServer.registerTool(
    'archive_card',
    'Archive a card (close it)',
    archiveCardSchema,
    archiveCard
  );
  
  trelloMcpServer.registerTool(
    'unarchive_card',
    'Unarchive a card (reopen it)',
    unarchiveCardSchema,
    unarchiveCard
  );
  
  trelloMcpServer.registerTool(
    'delete_card',
    'Permanently delete a card (cannot be undone)',
    deleteCardSchema,
    deleteCard
  );
  
  trelloMcpServer.registerTool(
    'add_comment',
    'Add a comment to a card',
    addCommentSchema,
    addComment
  );
  
  trelloMcpServer.registerTool(
    'edit_comment',
    'Edit an existing comment on a card',
    editCommentSchema,
    editComment
  );
  
  trelloMcpServer.registerTool(
    'delete_comment',
    'Delete a comment from a card',
    deleteCommentSchema,
    deleteComment
  );
  
  trelloMcpServer.registerTool(
    'add_label_to_card',
    'Add a label to a card',
    addLabelToCardSchema,
    addLabelToCard
  );
  
  trelloMcpServer.registerTool(
    'remove_label_from_card',
    'Remove a label from a card',
    removeLabelFromCardSchema,
    removeLabelFromCard
  );
  
  trelloMcpServer.registerTool(
    'assign_member_to_card',
    'Assign a member to a card',
    assignMemberToCardSchema,
    assignMemberToCard
  );
  
  trelloMcpServer.registerTool(
    'remove_member_from_card',
    'Remove a member from a card',
    removeMemberFromCardSchema,
    removeMemberFromCard
  );
  
  trelloMcpServer.registerTool(
    'add_attachment_url',
    'Add a URL attachment to a card',
    addAttachmentUrlSchema,
    addAttachmentUrl
  );
  
  trelloMcpServer.registerTool(
    'remove_attachment',
    'Remove an attachment from a card',
    removeAttachmentSchema,
    removeAttachment
  );
  
  trelloMcpServer.registerTool(
    'get_card_actions',
    'Get actions/activity history for a card',
    getCardActionsSchema,
    getCardActions
  );

  // ===== CHECKLIST TOOLS =====
  
  trelloMcpServer.registerTool(
    'get_checklist',
    'Get detailed information about a specific checklist',
    getChecklistSchema,
    getChecklist
  );
  
  trelloMcpServer.registerTool(
    'add_checklist',
    'Add a new checklist to a card',
    addChecklistSchema,
    addChecklist
  );
  
  trelloMcpServer.registerTool(
    'update_checklist',
    'Update an existing checklist\'s properties',
    updateChecklistSchema,
    updateChecklist
  );
  
  trelloMcpServer.registerTool(
    'delete_checklist',
    'Delete a checklist from a card',
    deleteChecklistSchema,
    deleteChecklist
  );
  
  trelloMcpServer.registerTool(
    'get_checklists_on_card',
    'Get all checklists on a specific card',
    getChecklistsOnCardSchema,
    getChecklistsOnCard
  );
  
  trelloMcpServer.registerTool(
    'add_checkitem',
    'Add a new item to a checklist',
    addCheckItemSchema,
    addCheckItem
  );
  
  trelloMcpServer.registerTool(
    'update_checkitem',
    'Update an existing checklist item',
    updateCheckItemSchema,
    updateCheckItem
  );
  
  trelloMcpServer.registerTool(
    'delete_checkitem',
    'Delete an item from a checklist',
    deleteCheckItemSchema,
    deleteCheckItem
  );
  
  trelloMcpServer.registerTool(
    'get_checkitems',
    'Get all items in a checklist with optional filtering',
    getCheckItemsSchema,
    getCheckItems
  );
  
  trelloMcpServer.registerTool(
    'get_checkitem',
    'Get detailed information about a specific checklist item',
    getCheckItemSchema,
    getCheckItem
  );

  // ===== LABEL TOOLS =====
  
  trelloMcpServer.registerTool(
    'get_label',
    'Get detailed information about a specific label',
    getLabelSchema,
    getLabel
  );
  
  trelloMcpServer.registerTool(
    'get_labels_on_board',
    'Get all labels on a specific board',
    getLabelsOnBoardSchema,
    getLabelsOnBoard
  );
  
  trelloMcpServer.registerTool(
    'create_label',
    'Create a new label on a board',
    createLabelSchema,
    createLabel
  );
  
  trelloMcpServer.registerTool(
    'update_label',
    'Update an existing label\'s properties',
    updateLabelSchema,
    updateLabel
  );
  
  trelloMcpServer.registerTool(
    'delete_label',
    'Delete a label from a board',
    deleteLabelSchema,
    deleteLabel
  );
  
  trelloMcpServer.registerTool(
    'update_label_field',
    'Update a specific field of a label',
    updateLabelFieldSchema,
    updateLabelField
  );
  
  trelloMcpServer.registerTool(
    'get_label_usage',
    'Get usage statistics and information for a label',
    getLabelUsageSchema,
    getLabelUsage
  );
  
  trelloMcpServer.registerTool(
    'bulk_update_labels',
    'Update multiple labels at once',
    bulkUpdateLabelsSchema,
    bulkUpdateLabels
  );
  
  trelloMcpServer.registerTool(
    'get_cards_with_label',
    'Find all cards that use a specific label',
    getCardsWithLabelSchema,
    getCardsWithLabel
  );

  // ===== SEARCH TOOLS =====
  
  trelloMcpServer.registerTool(
    'search_trello',
    'Perform comprehensive search across Trello boards, cards, members, and organizations',
    searchTrelloSchema,
    searchTrello
  );
  
  trelloMcpServer.registerTool(
    'search_boards',
    'Search for boards by name and description',
    searchBoardsSchema,
    searchBoards
  );
  
  trelloMcpServer.registerTool(
    'search_cards',
    'Search for cards with advanced filtering options',
    searchCardsSchema,
    searchCards
  );
  
  trelloMcpServer.registerTool(
    'search_members',
    'Search for members by name, username, or email',
    searchMembersSchema,
    searchMembers
  );
  
  trelloMcpServer.registerTool(
    'get_advanced_search',
    'Perform advanced search with complex filters and sorting',
    getAdvancedSearchSchema,
    getAdvancedSearch
  );
  
  trelloMcpServer.registerTool(
    'get_saved_searches',
    'Get saved search queries for a member',
    getSavedSearchesSchema,
    getSavedSearches
  );
  
  trelloMcpServer.registerTool(
    'create_saved_search',
    'Create a new saved search query',
    createSavedSearchSchema,
    createSavedSearch
  );

  // ===== ANALYTICS TOOLS =====
  
  trelloMcpServer.registerTool(
    'get_board_analytics',
    'Get comprehensive analytics for a board including member activity and workflow metrics',
    getBoardAnalyticsSchema,
    getBoardAnalytics
  );
  
  trelloMcpServer.registerTool(
    'get_user_activity',
    'Get user activity analytics and productivity metrics',
    getUserActivitySchema,
    getUserActivity
  );
  
  trelloMcpServer.registerTool(
    'get_team_analytics',
    'Get team performance analytics and collaboration metrics',
    getTeamAnalyticsSchema,
    getTeamAnalytics
  );
  
  trelloMcpServer.registerTool(
    'get_workflow_analytics',
    'Get workflow analytics including bottlenecks and cycle time',
    getWorkflowAnalyticsSchema,
    getWorkflowAnalytics
  );
  
  trelloMcpServer.registerTool(
    'get_label_analytics',
    'Get label usage analytics and effectiveness metrics',
    getLabelAnalyticsSchema,
    getLabelAnalytics
  );
  
  trelloMcpServer.registerTool(
    'get_productivity_metrics',
    'Get productivity metrics including velocity, quality, and efficiency',
    getProductivityMetricsSchema,
    getProductivityMetrics
  );

  // ===== ORGANIZATION TOOLS =====
  
  trelloMcpServer.registerTool(
    'get_organizations',
    'Get all organizations for a member with filtering options',
    getOrganizationsSchema,
    getOrganizations
  );
  
  trelloMcpServer.registerTool(
    'get_organization',
    'Get detailed information about a specific organization',
    getOrganizationSchema,
    getOrganization
  );
  
  trelloMcpServer.registerTool(
    'create_organization',
    'Create a new organization workspace',
    createOrganizationSchema,
    createOrganization
  );
  
  trelloMcpServer.registerTool(
    'update_organization',
    'Update organization settings and preferences',
    updateOrganizationSchema,
    updateOrganization
  );
  
  trelloMcpServer.registerTool(
    'delete_organization',
    'Delete an organization workspace',
    deleteOrganizationSchema,
    deleteOrganization
  );
  
  trelloMcpServer.registerTool(
    'get_organization_members',
    'Get all members of an organization with filtering options',
    getOrganizationMembersSchema,
    getOrganizationMembers
  );
  
  trelloMcpServer.registerTool(
    'get_organization_boards',
    'Get all boards in an organization with filtering options',
    getOrganizationBoardsSchema,
    getOrganizationBoards
  );
  
  trelloMcpServer.registerTool(
    'invite_member_to_organization',
    'Invite a new member to an organization',
    inviteMemberToOrganizationSchema,
    inviteMemberToOrganization
  );
  
  trelloMcpServer.registerTool(
    'update_organization_member',
    'Update a member\'s role and permissions in an organization',
    updateOrganizationMemberSchema,
    updateOrganizationMember
  );
  
  trelloMcpServer.registerTool(
    'remove_organization_member',
    'Remove a member from an organization',
    removeOrganizationMemberSchema,
    removeOrganizationMember
  );
  
  trelloMcpServer.registerTool(
    'deactivate_organization_member',
    'Deactivate or reactivate a member in an organization',
    deactivateOrganizationMemberSchema,
    deactivateOrganizationMember
  );
  
  trelloMcpServer.registerTool(
    'get_organization_memberships',
    'Get detailed membership information for an organization',
    getOrganizationMembershipsSchema,
    getOrganizationMemberships
  );
  
  trelloMcpServer.registerTool(
    'get_organization_membership',
    'Get details of a specific membership in an organization',
    getOrganizationMembershipSchema,
    getOrganizationMembership
  );
  
  trelloMcpServer.registerTool(
    'get_organization_analytics',
    'Get comprehensive analytics for an organization including boards, members, and activity',
    getOrganizationAnalyticsSchema,
    getOrganizationAnalytics
  );

  // ===== BATCH TOOLS =====
  
  trelloMcpServer.registerTool(
    'batch_get_requests',
    'Execute multiple GET requests in a single batch API call (up to 10 requests)',
    batchGetRequestsSchema,
    batchGetRequests
  );
  
  trelloMcpServer.registerTool(
    'batch_create_cards',
    'Create multiple cards efficiently in a single operation (up to 20 cards)',
    batchCreateCardsSchema,
    batchCreateCards
  );
  
  trelloMcpServer.registerTool(
    'batch_update_cards',
    'Update multiple cards with different properties (up to 20 cards)',
    batchUpdateCardsSchema,
    batchUpdateCards
  );
  
  trelloMcpServer.registerTool(
    'batch_move_cards',
    'Move multiple cards between lists or boards efficiently (up to 50 cards)',
    batchMoveCardsSchema,
    batchMoveCards
  );
  
  trelloMcpServer.registerTool(
    'batch_assign_members',
    'Assign or remove members from multiple cards (up to 30 operations)',
    batchAssignMembersSchema,
    batchAssignMembers
  );
  
  trelloMcpServer.registerTool(
    'batch_apply_labels',
    'Apply or remove labels from multiple cards (up to 30 operations)',
    batchApplyLabelsSchema,
    batchApplyLabels
  );
  
  trelloMcpServer.registerTool(
    'archive_all_cards_in_list',
    'Archive all cards in a specific list at once',
    archiveAllCardsInListSchema,
    archiveAllCardsInList
  );
  
  trelloMcpServer.registerTool(
    'move_all_cards_in_list',
    'Move all cards from one list to another, optionally to a different board',
    moveAllCardsInListSchema,
    moveAllCardsInList
  );
  
  trelloMcpServer.registerTool(
    'bulk_archive_cards',
    'Archive multiple cards by ID (up to 100 cards)',
    bulkArchiveCardsSchema,
    bulkArchiveCards
  );
  
  trelloMcpServer.registerTool(
    'bulk_unarchive_cards',
    'Unarchive multiple cards by ID (up to 100 cards)',
    bulkUnarchiveCardsSchema,
    bulkUnarchiveCards
  );
  
  trelloMcpServer.registerTool(
    'bulk_delete_cards',
    'Delete multiple cards by ID with confirmation (up to 50 cards)',
    bulkDeleteCardsSchema,
    bulkDeleteCards
  );

  // ===== AUTOMATION TOOLS =====
  
  trelloMcpServer.registerTool(
    'create_automation_rule',
    'Create a new automation rule with triggers and actions',
    createAutomationRuleSchema,
    createAutomationRule
  );
  
  trelloMcpServer.registerTool(
    'update_automation_rule',
    'Update an existing automation rule',
    updateAutomationRuleSchema,
    updateAutomationRule
  );
  
  trelloMcpServer.registerTool(
    'delete_automation_rule',
    'Delete an automation rule',
    deleteAutomationRuleSchema,
    deleteAutomationRule
  );
  
  trelloMcpServer.registerTool(
    'list_automation_rules',
    'List automation rules with optional filtering',
    listAutomationRulesSchema,
    listAutomationRules
  );
  
  trelloMcpServer.registerTool(
    'get_automation_rule',
    'Get details of a specific automation rule',
    getAutomationRuleSchema,
    getAutomationRule
  );
  
  trelloMcpServer.registerTool(
    'test_automation_rule',
    'Test an automation rule against a specific card',
    testAutomationRuleSchema,
    testAutomationRule
  );
  
  trelloMcpServer.registerTool(
    'create_scheduled_action',
    'Create a scheduled action to run at specific times',
    createScheduledActionSchema,
    createScheduledAction
  );
  
  trelloMcpServer.registerTool(
    'update_scheduled_action',
    'Update an existing scheduled action',
    updateScheduledActionSchema,
    updateScheduledAction
  );
  
  trelloMcpServer.registerTool(
    'delete_scheduled_action',
    'Delete a scheduled action',
    deleteScheduledActionSchema,
    deleteScheduledAction
  );
  
  trelloMcpServer.registerTool(
    'list_scheduled_actions',
    'List scheduled actions with optional filtering',
    listScheduledActionsSchema,
    listScheduledActions
  );
  
  trelloMcpServer.registerTool(
    'execute_scheduled_action',
    'Execute a scheduled action immediately',
    executeScheduledActionSchema,
    executeScheduledAction
  );
  
  trelloMcpServer.registerTool(
    'get_automation_history',
    'Get history of automation rule executions',
    getAutomationHistorySchema,
    getAutomationHistory
  );

  // ===== WEBHOOK TOOLS =====
  
  trelloMcpServer.registerTool(
    'create_webhook',
    'Create a new webhook to monitor Trello model changes',
    createWebhookSchema,
    createWebhook
  );
  
  trelloMcpServer.registerTool(
    'list_webhooks',
    'List all webhooks for the current token',
    listWebhooksSchema,
    listWebhooks
  );
  
  trelloMcpServer.registerTool(
    'get_webhook',
    'Get detailed information about a specific webhook',
    getWebhookSchema,
    getWebhook
  );
  
  trelloMcpServer.registerTool(
    'update_webhook',
    'Update webhook configuration (URL, description, active status)',
    updateWebhookSchema,
    updateWebhook
  );
  
  trelloMcpServer.registerTool(
    'delete_webhook',
    'Delete a webhook and stop receiving events',
    deleteWebhookSchema,
    deleteWebhook
  );
  
  trelloMcpServer.registerTool(
    'create_webhook_event_processor',
    'Create a webhook event processor for automated event handling',
    createWebhookEventProcessorSchema,
    createWebhookEventProcessor
  );
  
  trelloMcpServer.registerTool(
    'update_webhook_event_processor',
    'Update existing webhook event processor configuration',
    updateWebhookEventProcessorSchema,
    updateWebhookEventProcessor
  );
  
  trelloMcpServer.registerTool(
    'delete_webhook_event_processor',
    'Delete a webhook event processor',
    deleteWebhookEventProcessorSchema,
    deleteWebhookEventProcessor
  );
  
  trelloMcpServer.registerTool(
    'list_webhook_event_processors',
    'List webhook event processors with filtering options',
    listWebhookEventProcessorsSchema,
    listWebhookEventProcessors
  );
  
  trelloMcpServer.registerTool(
    'process_webhook_event',
    'Process a webhook event through a specific processor',
    processWebhookEventSchema,
    processWebhookEvent
  );
  
  trelloMcpServer.registerTool(
    'get_webhook_events',
    'Get webhook event history for a specific model',
    getWebhookEventsSchema,
    getWebhookEvents
  );
  
  trelloMcpServer.registerTool(
    'enable_real_time_sync',
    'Enable real-time synchronization for a Trello model',
    enableRealTimeSyncSchema,
    enableRealTimeSync
  );
  
  trelloMcpServer.registerTool(
    'disable_real_time_sync',
    'Disable real-time synchronization for a Trello model',
    disableRealTimeSyncSchema,
    disableRealTimeSync
  );
  
  trelloMcpServer.registerTool(
    'get_real_time_sync_status',
    'Get real-time synchronization status for models',
    getRealTimeSyncStatusSchema,
    getRealTimeSyncStatus
  );

  // ===== NOTIFICATIONS TOOLS =====

  trelloMcpServer.registerTool(
    'list_notifications',
    'List notifications for a member with filters and pagination',
    listNotificationsSchema,
    listNotifications
  );

  trelloMcpServer.registerTool(
    'get_notification',
    'Get a single notification by ID',
    getNotificationSchema,
    getNotification
  );

  trelloMcpServer.registerTool(
    'mark_notification_read',
    'Mark a notification as read or unread',
    markNotificationReadSchema,
    markNotificationRead
  );

  trelloMcpServer.registerTool(
    'mark_all_notifications_read',
    'Mark all (or specific) notifications as read/unread',
    markAllNotificationsReadSchema,
    markAllNotificationsRead
  );

  // ===== ACTIVITY TOOLS =====
  trelloMcpServer.registerTool(
    'list_recent_activity',
    'List recent activity (actions) for current member or specific boards',
    listRecentActivitySchema,
    listRecentActivity
  );

  // ===== EXPORT AND REPORTING TOOLS =====

  trelloMcpServer.registerTool(
    'export_board_data',
    'Export comprehensive board data in multiple formats (CSV, JSON, PDF)',
    exportBoardDataSchema,
    exportBoardData
  );

  trelloMcpServer.registerTool(
    'export_user_activity',
    'Export user activity and productivity reports across boards',
    exportUserActivitySchema,
    exportUserActivity
  );

  trelloMcpServer.registerTool(
    'export_organization_data',
    'Export organization-wide data including boards, members, and metrics',
    exportOrganizationDataSchema,
    exportOrganizationData
  );

  trelloMcpServer.registerTool(
    'generate_analytics_report',
    'Generate comprehensive analytics reports with insights and recommendations',
    generateAnalyticsReportSchema,
    generateAnalyticsReport
  );

  trelloMcpServer.registerTool(
    'create_dashboard',
    'Create custom analytics dashboards with configurable widgets',
    createDashboardSchema,
    createDashboard
  );

  trelloMcpServer.registerTool(
    'update_dashboard',
    'Update existing dashboard configuration and widgets',
    updateDashboardSchema,
    updateDashboard
  );

  trelloMcpServer.registerTool(
    'delete_dashboard',
    'Delete custom dashboard and all associated data',
    deleteDashboardSchema,
    deleteDashboard
  );

  trelloMcpServer.registerTool(
    'get_dashboard',
    'Retrieve dashboard configuration and real-time widget data',
    getDashboardSchema,
    getDashboard
  );

  trelloMcpServer.registerTool(
    'list_dashboards',
    'List all available dashboards with filtering options',
    listDashboardsSchema,
    listDashboards
  );

  trelloMcpServer.registerTool(
    'schedule_report',
    'Schedule automated report generation and delivery',
    scheduleReportSchema,
    scheduleReport
  );

  trelloMcpServer.registerTool(
    'update_scheduled_report',
    'Update scheduled report configuration and recipients',
    updateScheduledReportSchema,
    updateScheduledReport
  );

  trelloMcpServer.registerTool(
    'delete_scheduled_report',
    'Delete scheduled report and stop automated delivery',
    deleteScheduledReportSchema,
    deleteScheduledReport
  );

  trelloMcpServer.registerTool(
    'list_scheduled_reports',
    'List all scheduled reports with status and configuration',
    listScheduledReportsSchema,
    listScheduledReports
  );

  trelloMcpServer.registerTool(
    'execute_scheduled_report',
    'Execute scheduled report immediately with optional custom date range',
    executeScheduledReportSchema,
    executeScheduledReport
  );

  trelloMcpServer.registerTool(
    'create_data_visualization',
    'Create advanced data visualizations and charts from Trello data',
    createDataVisualizationSchema,
    createDataVisualization
  );

  // ===== BOARD RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:board/{id}',
    'Board Details',
    'Get comprehensive information about a Trello board including lists, cards, members, and labels',
    'application/json',
    readBoardResource
  );
  
  // ===== LIST RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:list/{id}',
    'List Details',
    'Get comprehensive information about a Trello list including all its cards and activity',
    'application/json',
    readListResource
  );

  // ===== CARD RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:card/{id}',
    'Card Details',
    'Get comprehensive information about a Trello card including description, members, labels, checklists, attachments, and comments',
    'application/json',
    readCardResource
  );

  // ===== CHECKLIST RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:checklist/{id}',
    'Checklist Details',
    'Get comprehensive information about a Trello checklist including all check items, progress tracking, and context',
    'application/json',
    readChecklistResource
  );

  // ===== LABEL RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:label/{id}',
    'Label Details',
    'Get comprehensive information about a Trello label including usage statistics, color visualization, and associated cards',
    'application/json',
    readLabelResource
  );

  // ===== SEARCH RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:search/{query}',
    'Search Results',
    'Get comprehensive search results across boards, cards, members, and organizations with advanced filtering and tips',
    'application/json',
    readSearchResource
  );

  // ===== ORGANIZATION RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:organization/{id}',
    'Organization Details',
    'Get comprehensive information about a Trello organization including boards, members, memberships, settings, and management recommendations',
    'application/json',
    readOrganizationResource
  );

  // ===== WEBHOOK RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:webhook/{id}',
    'Webhook Details',
    'Get comprehensive information about a Trello webhook including monitored model, event types, configuration, and management options',
    'application/json',
    readWebhookResource
  );

  // ===== REPORT RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:report/{type}/{id}',
    'Report Details',
    'Get comprehensive information about reports, dashboards, analytics, exports, and scheduled reports with insights and management options',
    'application/json',
    readReportResource
  );
}
