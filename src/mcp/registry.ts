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

export function registerAllToolsAndResources() {
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
}
