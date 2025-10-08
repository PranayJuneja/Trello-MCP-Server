/**
 * @fileoverview Provides a comprehensive, rate-limited client for interacting with the Trello REST API.
 * This module encapsulates all the individual API endpoints into a single `TrelloClient` class,
 * making it easy to perform operations on Trello boards, lists, cards, and more.
 * It leverages the `trelloHttp` module for actual HTTP requests and integrates rate limiting
 * to prevent API abuse.
 */
import { trelloHttp } from './http.js';
import { withRateLimit, withHighPriorityRateLimit, withLowPriorityRateLimit } from './ratelimit.js';
import {
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloLabel,
  TrelloMember,
  TrelloChecklist,
  TrelloCheckItem,
  TrelloAttachment,
  TrelloAction,
  TrelloWebhook,
  TrelloOrganization,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateListRequest,
  UpdateListRequest,
  CreateCardRequest,
  UpdateCardRequest,
  CreateLabelRequest,
  UpdateLabelRequest,
  CreateChecklistRequest,
  CreateCheckItemRequest,
  UpdateCheckItemRequest,
  SearchRequest,
  SearchResponse,
} from './types.js';

/**
 * A client for interacting with the Trello API. Provides methods for all major Trello resources.
 * All methods are rate-limited to comply with Trello's API guidelines.
 */
export class TrelloClient {
  // ===== BOARDS =====
  
  /**
   * Retrieves a specific Trello board by its ID.
   * @param {string} id - The ID of the board to retrieve.
   * @param {object} [options={}] - Optional query parameters to customize the response.
   * @returns {Promise<TrelloBoard>} A promise that resolves to the Trello board object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-get
   */
  async getBoard(
    id: string,
    options: {
      actions?: string;
      boardStars?: string;
      cards?: string;
      card_pluginData?: boolean;
      checklists?: string;
      customFields?: boolean;
      fields?: string;
      labels?: string;
      lists?: string;
      members?: string;
      memberships?: string;
      pluginData?: boolean;
      organization?: boolean;
      organization_pluginData?: boolean;
      myPrefs?: boolean;
      tags?: boolean;
    } = {}
  ): Promise<TrelloBoard> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloBoard>(`/boards/${id}`, { params: options })
    );
  }

  /**
   * Lists all boards for a given member.
   * @param {string} [memberId='me'] - The ID of the member whose boards to list. Defaults to the current user.
   * @returns {Promise<TrelloBoard[]>} A promise that resolves to an array of Trello board objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-members/#api-members-id-boards-get
   */
  async listBoards(memberId: string = 'me'): Promise<TrelloBoard[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloBoard[]>(`/members/${memberId}/boards`)
    );
  }

  /**
   * Creates a new Trello board.
   * @param {CreateBoardRequest} request - The details of the board to create.
   * @returns {Promise<TrelloBoard>} A promise that resolves to the newly created Trello board object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-post
   */
  async createBoard(request: CreateBoardRequest): Promise<TrelloBoard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloBoard>('/boards', null, { params: request })
    );
  }

  /**
   * Updates an existing Trello board.
   * @param {string} id - The ID of the board to update.
   * @param {UpdateBoardRequest} request - The fields of the board to update.
   * @returns {Promise<TrelloBoard>} A promise that resolves to the updated Trello board object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-put
   */
  async updateBoard(id: string, request: UpdateBoardRequest): Promise<TrelloBoard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloBoard>(`/boards/${id}`, null, { params: request })
    );
  }

  /**
   * Closes a Trello board.
   * @param {string} id - The ID of the board to close.
   * @returns {Promise<TrelloBoard>} A promise that resolves to the closed Trello board object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-put
   */
  async closeBoard(id: string): Promise<TrelloBoard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloBoard>(`/boards/${id}`, null, { params: { closed: true } })
    );
  }

  /**
   * Reopens a closed Trello board.
   * @param {string} id - The ID of the board to reopen.
   * @returns {Promise<TrelloBoard>} A promise that resolves to the reopened Trello board object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-put
   */
  async reopenBoard(id: string): Promise<TrelloBoard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloBoard>(`/boards/${id}`, null, { params: { closed: false } })
    );
  }

  /**
   * Deletes a Trello board. This action is permanent.
   * @param {string} id - The ID of the board to delete.
   * @returns {Promise<void>} A promise that resolves when the board is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-delete
   */
  async deleteBoard(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/boards/${id}`)
    );
  }

  // ===== LISTS =====

  /**
   * Lists all lists on a specific board.
   * @param {string} boardId - The ID of the board.
   * @param {'all' | 'open' | 'closed'} [filter='open'] - The filter to apply ('all', 'open', or 'closed').
   * @returns {Promise<TrelloList[]>} A promise that resolves to an array of Trello list objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-lists-get
   */
  async listLists(boardId: string, filter: 'all' | 'open' | 'closed' = 'open'): Promise<TrelloList[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloList[]>(`/boards/${boardId}/lists`, { params: { filter } })
    );
  }

  /**
   * Retrieves a specific Trello list by its ID.
   * @param {string} id - The ID of the list to retrieve.
   * @returns {Promise<TrelloList>} A promise that resolves to the Trello list object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-lists/#api-lists-id-get
   */
  async getList(id: string): Promise<TrelloList> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloList>(`/lists/${id}`)
    );
  }

  /**
   * Creates a new Trello list on a board.
   * @param {CreateListRequest} request - The details of the list to create.
   * @returns {Promise<TrelloList>} A promise that resolves to the newly created Trello list object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-lists/#api-lists-post
   */
  async createList(request: CreateListRequest): Promise<TrelloList> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloList>('/lists', null, { params: request })
    );
  }

  /**
   * Updates an existing Trello list.
   * @param {string} id - The ID of the list to update.
   * @param {UpdateListRequest} request - The fields of the list to update.
   * @returns {Promise<TrelloList>} A promise that resolves to the updated Trello list object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-lists/#api-lists-id-put
   */
  async updateList(id: string, request: UpdateListRequest): Promise<TrelloList> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloList>(`/lists/${id}`, null, { params: request })
    );
  }

  /**
   * Archives a Trello list.
   * @param {string} id - The ID of the list to archive.
   * @returns {Promise<TrelloList>} A promise that resolves to the archived Trello list object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-lists/#api-lists-id-closed-put
   */
  async archiveList(id: string): Promise<TrelloList> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloList>(`/lists/${id}`, null, { params: { closed: true } })
    );
  }

  /**
   * Unarchives a Trello list.
   * @param {string} id - The ID of the list to unarchive.
   * @returns {Promise<TrelloList>} A promise that resolves to the unarchived Trello list object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-lists/#api-lists-id-closed-put
   */
  async unarchiveList(id: string): Promise<TrelloList> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloList>(`/lists/${id}`, null, { params: { closed: false } })
    );
  }

  // ===== CARDS =====

  /**
   * Retrieves a specific Trello card by its ID.
   * @param {string} id - The ID of the card to retrieve.
   * @param {object} [options={}] - Optional query parameters to customize the response.
   * @returns {Promise<TrelloCard>} A promise that resolves to the Trello card object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-get
   */
  async getCard(
    id: string,
    options: {
      actions?: string;
      attachments?: boolean;
      attachment_fields?: string;
      members?: boolean;
      member_fields?: string;
      membersVoted?: boolean;
      memberVoted_fields?: string;
      checkItemStates?: boolean;
      checklists?: string;
      checklist_fields?: string;
      board?: boolean;
      board_fields?: string;
      list?: boolean;
      list_fields?: string;
      pluginData?: boolean;
      stickers?: boolean;
      sticker_fields?: string;
      customFieldItems?: boolean;
      fields?: string;
    } = {}
  ): Promise<TrelloCard> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloCard>(`/cards/${id}`, { params: options })
    );
  }

  /**
   * Creates a new Trello card in a list.
   * @param {CreateCardRequest} request - The details of the card to create.
   * @returns {Promise<TrelloCard>} A promise that resolves to the newly created Trello card object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-post
   */
  async createCard(request: CreateCardRequest): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloCard>('/cards', null, { params: request })
    );
  }

  /**
   * Updates an existing Trello card.
   * @param {string} id - The ID of the card to update.
   * @param {UpdateCardRequest} request - The fields of the card to update.
   * @returns {Promise<TrelloCard>} A promise that resolves to the updated Trello card object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-put
   */
  async updateCard(id: string, request: UpdateCardRequest): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCard>(`/cards/${id}`, null, { params: request })
    );
  }

  /**
   * Moves a Trello card to a different list.
   * @param {string} id - The ID of the card to move.
   * @param {string} listId - The ID of the target list.
   * @param {number | 'top' | 'bottom'} [position] - The position in the new list.
   * @returns {Promise<TrelloCard>} A promise that resolves to the moved Trello card object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-put
   */
  async moveCard(id: string, listId: string, position?: number | 'top' | 'bottom'): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCard>(`/cards/${id}`, null, { 
        params: { idList: listId, pos: position } 
      })
    );
  }

  /**
   * Archives a Trello card.
   * @param {string} id - The ID of the card to archive.
   * @returns {Promise<TrelloCard>} A promise that resolves to the archived Trello card object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-put
   */
  async archiveCard(id: string): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCard>(`/cards/${id}`, null, { params: { closed: true } })
    );
  }

  /**
   * Unarchives a Trello card.
   * @param {string} id - The ID of the card to unarchive.
   * @returns {Promise<TrelloCard>} A promise that resolves to the unarchived Trello card object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-put
   */
  async unarchiveCard(id: string): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCard>(`/cards/${id}`, null, { params: { closed: false } })
    );
  }

  /**
   * Deletes a Trello card. This action is permanent.
   * @param {string} id - The ID of the card to delete.
   * @returns {Promise<void>} A promise that resolves when the card is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-delete
   */
  async deleteCard(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/cards/${id}`)
    );
  }

  // ===== CARD COMMENTS =====

  /**
   * Adds a comment to a Trello card.
   * @param {string} cardId - The ID of the card to add the comment to.
   * @param {string} text - The text of the comment.
   * @returns {Promise<TrelloAction>} A promise that resolves to the action object for the new comment.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-actions-comments-post
   */
  async addComment(cardId: string, text: string): Promise<TrelloAction> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloAction>(`/cards/${cardId}/actions/comments`, null, { 
        params: { text } 
      })
    );
  }

  /**
   * Edits an existing comment on a Trello card.
   * @param {string} actionId - The ID of the comment action to edit.
   * @param {string} text - The new text for the comment.
   * @returns {Promise<TrelloAction>} A promise that resolves to the updated action object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-actions/#api-actions-id-put
   */
  async editComment(actionId: string, text: string): Promise<TrelloAction> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloAction>(`/actions/${actionId}`, null, { params: { text } })
    );
  }

  /**
   * Deletes a comment from a Trello card.
   * @param {string} actionId - The ID of the comment action to delete.
   * @returns {Promise<void>} A promise that resolves when the comment is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-actions/#api-actions-id-delete
   */
  async deleteComment(actionId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/actions/${actionId}`)
    );
  }

  // ===== CARD LABELS =====

  /**
   * Adds a label to a Trello card.
   * @param {string} cardId - The ID of the card.
   * @param {string} labelId - The ID of the label to add.
   * @returns {Promise<TrelloCard>} A promise that resolves to the updated card object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-idlabels-post
   */
  async addLabelToCard(cardId: string, labelId: string): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloCard>(`/cards/${cardId}/idLabels`, null, { 
        params: { value: labelId } 
      })
    );
  }

  /**
   * Removes a label from a Trello card.
   * @param {string} cardId - The ID of the card.
   * @param {string} labelId - The ID of the label to remove.
   * @returns {Promise<void>} A promise that resolves when the label is removed.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-idlabels-idlabel-delete
   */
  async removeLabelFromCard(cardId: string, labelId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/cards/${cardId}/idLabels/${labelId}`)
    );
  }

  // ===== CARD MEMBERS =====

  /**
   * Assigns a member to a Trello card.
   * @param {string} cardId - The ID of the card.
   * @param {string} memberId - The ID of the member to assign.
   * @returns {Promise<TrelloCard>} A promise that resolves to the updated card object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-idmembers-post
   */
  async assignMemberToCard(cardId: string, memberId: string): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloCard>(`/cards/${cardId}/idMembers`, null, { 
        params: { value: memberId } 
      })
    );
  }

  /**
   * Removes a member from a Trello card.
   * @param {string} cardId - The ID of the card.
   * @param {string} memberId - The ID of the member to remove.
   * @returns {Promise<void>} A promise that resolves when the member is removed.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-idmembers-idmember-delete
   */
  async removeMemberFromCard(cardId: string, memberId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/cards/${cardId}/idMembers/${memberId}`)
    );
  }

  // ===== LABELS =====

  /**
   * Lists all labels for a given board.
   * @param {string} boardId - The ID of the board.
   * @returns {Promise<TrelloLabel[]>} A promise that resolves to an array of Trello label objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-labels-get
   */
  async listLabels(boardId: string): Promise<TrelloLabel[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloLabel[]>(`/boards/${boardId}/labels`)
    );
  }

  /**
   * Retrieves a specific Trello label by its ID.
   * @param {string} id - The ID of the label to retrieve.
   * @returns {Promise<TrelloLabel>} A promise that resolves to the Trello label object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-labels/#api-labels-id-get
   */
  async getLabel(id: string): Promise<TrelloLabel> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloLabel>(`/labels/${id}`)
    );
  }

  /**
   * Creates a new Trello label on a board.
   * @param {CreateLabelRequest} request - The details of the label to create.
   * @returns {Promise<TrelloLabel>} A promise that resolves to the newly created Trello label object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-labels/#api-labels-post
   */
  async createLabel(request: CreateLabelRequest): Promise<TrelloLabel> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloLabel>(`/boards/${request.idBoard}/labels`, null, { 
        params: { name: request.name, color: request.color } 
      })
    );
  }

  /**
   * Updates an existing Trello label.
   * @param {string} id - The ID of the label to update.
   * @param {UpdateLabelRequest} request - The fields of the label to update.
   * @returns {Promise<TrelloLabel>} A promise that resolves to the updated Trello label object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-labels/#api-labels-id-put
   */
  async updateLabel(id: string, request: UpdateLabelRequest): Promise<TrelloLabel> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloLabel>(`/labels/${id}`, null, { params: request })
    );
  }

  /**
   * Deletes a Trello label.
   * @param {string} id - The ID of the label to delete.
   * @returns {Promise<void>} A promise that resolves when the label is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-labels/#api-labels-id-delete
   */
  async deleteLabel(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/labels/${id}`)
    );
  }

  /**
   * Updates a specific field on a Trello label.
   * @param {string} id - The ID of the label.
   * @param {string} field - The field to update (e.g., 'name', 'color').
   * @param {any} value - The new value for the field.
   * @returns {Promise<any>} A promise that resolves to the API response.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-labels/#api-labels-id-field-put
   */
  async updateLabelField(id: string, field: string, value: any): Promise<any> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put(`/labels/${id}/${field}`, null, { params: { value } })
    );
  }

  // ===== CHECKLISTS =====

  /**
   * Creates a new checklist on a card.
   * @param {CreateChecklistRequest} request - The details of the checklist to create.
   * @returns {Promise<TrelloChecklist>} A promise that resolves to the newly created checklist object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-checklists/#api-checklists-post
   */
  async createChecklist(request: CreateChecklistRequest): Promise<TrelloChecklist> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloChecklist>('/checklists', null, { params: request })
    );
  }

  /**
   * Retrieves a specific checklist by its ID.
   * @param {string} id - The ID of the checklist.
   * @returns {Promise<TrelloChecklist>} A promise that resolves to the checklist object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-checklists/#api-checklists-id-get
   */
  async getChecklist(id: string): Promise<TrelloChecklist> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloChecklist>(`/checklists/${id}`)
    );
  }

  /**
   * Deletes a checklist.
   * @param {string} id - The ID of the checklist to delete.
   * @returns {Promise<void>} A promise that resolves when the checklist is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-checklists/#api-checklists-id-delete
   */
  async deleteChecklist(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/checklists/${id}`)
    );
  }

  /**
   * Updates a specific field on a checklist.
   * @param {string} id - The ID of the checklist.
   * @param {string} field - The field to update (e.g., 'name', 'pos').
   * @param {any} value - The new value for the field.
   * @returns {Promise<any>} A promise that resolves to the API response.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-checklists/#api-checklists-id-put
   */
  async updateChecklistField(id: string, field: string, value: any): Promise<any> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put(`/checklists/${id}/${field}`, null, { params: { value } })
    );
  }

  /**
   * Retrieves the board that a checklist belongs to.
   * @param {string} id - The ID of the checklist.
   * @returns {Promise<TrelloBoard>} A promise that resolves to the board object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-checklists/#api-checklists-id-board-get
   */
  async getChecklistBoard(id: string): Promise<TrelloBoard> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloBoard>(`/checklists/${id}/board`)
    );
  }

  /**
   * Retrieves the card(s) that a checklist belongs to.
   * @param {string} id - The ID of the checklist.
   * @returns {Promise<TrelloCard[]>} A promise that resolves to an array of card objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-checklists/#api-checklists-id-cards-get
   */
  async getChecklistCard(id: string): Promise<TrelloCard[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloCard[]>(`/checklists/${id}/cards`)
    );
  }

  /**
   * Adds a new check item to a checklist.
   * @param {string} checklistId - The ID of the checklist.
   * @param {CreateCheckItemRequest} request - The details of the check item to create.
   * @returns {Promise<TrelloCheckItem>} A promise that resolves to the newly created check item object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-checklists/#api-checklists-id-checkitems-post
   */
  async addCheckItem(checklistId: string, request: CreateCheckItemRequest): Promise<TrelloCheckItem> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloCheckItem>(`/checklists/${checklistId}/checkItems`, null, { 
        params: request 
      })
    );
  }

  /**
   * Updates an existing check item in a checklist.
   * @param {string} cardId - The ID of the card containing the checklist.
   * @param {string} checklistId - The ID of the checklist.
   * @param {string} checkItemId - The ID of the check item to update.
   * @param {UpdateCheckItemRequest} request - The fields of the check item to update.
   * @returns {Promise<TrelloCheckItem>} A promise that resolves to the updated check item object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-idcard-checklist-idchecklist-checkitem-idcheckitem-put
   */
  async updateCheckItem(
    cardId: string, 
    checklistId: string, 
    checkItemId: string, 
    request: UpdateCheckItemRequest
  ): Promise<TrelloCheckItem> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCheckItem>(
        `/cards/${cardId}/checklist/${checklistId}/checkItem/${checkItemId}`, 
        null, 
        { params: request }
      )
    );
  }

  /**
   * Deletes a check item from a checklist.
   * @param {string} checklistId - The ID of the checklist.
   * @param {string} checkItemId - The ID of the check item to delete.
   * @returns {Promise<void>} A promise that resolves when the check item is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-checklists/#api-checklists-idchecklist-checkitems-idcheckitem-delete
   */
  async deleteCheckItem(checklistId: string, checkItemId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/checklists/${checklistId}/checkItems/${checkItemId}`)
    );
  }

  // ===== ATTACHMENTS =====

  /**
   * Adds a URL attachment to a card.
   * @param {string} cardId - The ID of the card.
   * @param {string} url - The URL to attach.
   * @param {string} [name] - The name of the attachment.
   * @returns {Promise<TrelloAttachment>} A promise that resolves to the created attachment object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-attachments-post
   */
  async addUrlAttachment(cardId: string, url: string, name?: string): Promise<TrelloAttachment> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloAttachment>(`/cards/${cardId}/attachments`, null, { 
        params: { url, name } 
      })
    );
  }

  /**
   * Deletes an attachment from a card.
   * @param {string} cardId - The ID of the card.
   * @param {string} attachmentId - The ID of the attachment to delete.
   * @returns {Promise<void>} A promise that resolves when the attachment is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/#api-cards-id-attachments-idattachment-delete
   */
  async deleteAttachment(cardId: string, attachmentId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/cards/${cardId}/attachments/${attachmentId}`)
    );
  }

  // ===== MEMBERS =====

  /**
   * Retrieves information about a Trello member.
   * @param {string} id - The ID or username of the member.
   * @returns {Promise<TrelloMember>} A promise that resolves to the member object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-members/#api-members-id-get
   */
  async getMember(id: string): Promise<TrelloMember> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloMember>(`/members/${id}`)
    );
  }

  /**
   * Retrieves all members of a Trello board.
   * @param {string} boardId - The ID of the board.
   * @returns {Promise<TrelloMember[]>} A promise that resolves to an array of member objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-members-get
   */
  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloMember[]>(`/boards/${boardId}/members`)
    );
  }

  // ===== NOTIFICATIONS =====

  /**
   * Lists notifications for a member.
   * @param {string} [memberId='me'] - The ID of the member. Defaults to the current user.
   * @param {any} [options={}] - Optional query parameters to filter notifications.
   * @returns {Promise<any[]>} A promise that resolves to an array of notification objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-members/#api-members-id-notifications-get
   */
  async listNotifications(memberId: string = 'me', options: any = {}): Promise<any[]> {
    return withRateLimit(() =>
      trelloHttp.get<any[]>(`/members/${memberId}/notifications`, { params: options })
    );
  }

  /**
   * Retrieves a specific notification.
   * @param {string} id - The ID of the notification.
   * @returns {Promise<any>} A promise that resolves to the notification object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-notifications/#api-notifications-id-get
   */
  async getNotification(id: string): Promise<any> {
    return withRateLimit(() =>
      trelloHttp.get<any>(`/notifications/${id}`)
    );
  }

  /**
   * Marks a notification as read or unread.
   * @param {string} id - The ID of the notification.
   * @param {boolean} [unread=false] - Set to true to mark as unread, false to mark as read.
   * @returns {Promise<any>} A promise that resolves to the API response.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-notifications/#api-notifications-id-unread-put
   */
  async markNotificationRead(id: string, unread: boolean = false): Promise<any> {
    return withHighPriorityRateLimit(() =>
      trelloHttp.put<any>(`/notifications/${id}/unread`, null, { params: { value: unread ? 'true' : 'false' } })
    );
  }

  /**
   * Marks all notifications as read.
   * @param {boolean} [read=true] - Set to true to mark as read, false to mark as unread.
   * @param {string[]} [ids] - An array of notification IDs to mark. If not provided, all notifications are marked.
   * @returns {Promise<any>} A promise that resolves to the API response.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-notifications/#api-notifications-all-read-post
   */
  async markAllNotificationsRead(read: boolean = true, ids?: string[]): Promise<any> {
    const params: any = { read: read ? 'true' : 'false' };
    if (ids && ids.length > 0) params.ids = ids.join(',');
    return withHighPriorityRateLimit(() =>
      trelloHttp.post<any>(`/notifications/all/read`, null, { params })
    );
  }

  // ===== ACTIONS (RECENT ACTIVITY) =====

  /**
   * Lists the actions (activity log) for a member.
   * @param {string} [memberId='me'] - The ID of the member. Defaults to the current user.
   * @param {any} [options={}] - Optional query parameters to filter actions.
   * @returns {Promise<any[]>} A promise that resolves to an array of action objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-members/#api-members-id-actions-get
   */
  async listMemberActions(memberId: string = 'me', options: any = {}): Promise<any[]> {
    return withRateLimit(() =>
      trelloHttp.get<any[]>(`/members/${memberId}/actions`, { params: options })
    );
  }

  /**
   * Lists the actions (activity log) for a board.
   * @param {string} boardId - The ID of the board.
   * @param {any} [options={}] - Optional query parameters to filter actions.
   * @returns {Promise<any[]>} A promise that resolves to an array of action objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-id-actions-get
   */
  async listBoardActions(boardId: string, options: any = {}): Promise<any[]> {
    return withRateLimit(() =>
      trelloHttp.get<any[]>(`/boards/${boardId}/actions`, { params: options })
    );
  }

  // ===== SEARCH =====

  /**
   * Performs a search query in Trello.
   * @param {SearchRequest} request - The search request parameters.
   * @returns {Promise<SearchResponse>} A promise that resolves to the search results.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-search/#api-search-get
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    return withLowPriorityRateLimit(() => 
      trelloHttp.get<SearchResponse>('/search', { params: request })
    );
  }

  // ===== BATCH =====

  /**
   * Executes multiple GET requests in a single batch operation.
   * @param {string[]} urls - An array of API URLs (relative to the base Trello API URL) to request.
   * @returns {Promise<T[]>} A promise that resolves to an array of responses.
   * @template T The expected type of the response objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-batch/#api-batch-get
   */
  async batch<T>(urls: string[]): Promise<T[]> {
    return withLowPriorityRateLimit(() => 
      trelloHttp.batch<T>(urls)
    );
  }

  // ===== BULK LIST OPERATIONS =====

  /**
   * Archives all cards in a list.
   * @param {string} listId - The ID of the list.
   * @returns {Promise<any>} A promise that resolves to the API response.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-lists/#api-lists-id-archiveallcards-post
   */
  async archiveAllCardsInList(listId: string): Promise<any> {
    return withRateLimit(() =>
      trelloHttp.post<any>(`/lists/${listId}/archiveAllCards`)
    );
  }

  /**
   * Moves all cards from one list to another.
   * @param {string} sourceListId - The ID of the list to move cards from.
   * @param {string} targetListId - The ID of the list to move cards to.
   * @param {string} [targetBoardId] - The ID of the board containing the target list. Required if moving between boards.
   * @returns {Promise<any>} A promise that resolves to the API response.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-lists/#api-lists-id-moveallcards-post
   */
  async moveAllCardsInList(sourceListId: string, targetListId: string, targetBoardId?: string): Promise<any> {
    const params: any = { idList: targetListId };
    if (targetBoardId) {
      params.idBoard = targetBoardId;
    }
    
    return withRateLimit(() =>
      trelloHttp.post<any>(`/lists/${sourceListId}/moveAllCards`, null, { params })
    );
  }

  // ===== ORGANIZATIONS =====

  /**
   * Retrieves all organizations for a member.
   * @param {string} [memberId='me'] - The ID of the member. Defaults to the current user.
   * @param {any} [options={}] - Optional query parameters.
   * @returns {Promise<TrelloOrganization[]>} A promise that resolves to an array of organization objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-members/#api-members-id-organizations-get
   */
  async getMemberOrganizations(memberId: string = 'me', options: any = {}): Promise<TrelloOrganization[]> {
    return withRateLimit(() =>
      trelloHttp.get<TrelloOrganization[]>(`/members/${memberId}/organizations`, { params: options })
    );
  }

  /**
   * Retrieves a specific organization by its ID.
   * @param {string} id - The ID of the organization.
   * @param {any} [options={}] - Optional query parameters.
   * @returns {Promise<TrelloOrganization>} A promise that resolves to the organization object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-get
   */
  async getOrganization(id: string, options: any = {}): Promise<TrelloOrganization> {
    return withRateLimit(() =>
      trelloHttp.get<TrelloOrganization>(`/organizations/${id}`, { params: options })
    );
  }

  /**
   * Creates a new organization.
   * @param {any} data - The details of the organization to create.
   * @returns {Promise<TrelloOrganization>} A promise that resolves to the newly created organization object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-post
   */
  async createOrganization(data: any): Promise<TrelloOrganization> {
    return withRateLimit(() =>
      trelloHttp.post<TrelloOrganization>('/organizations', null, { params: data })
    );
  }

  /**
   * Updates an existing organization.
   * @param {string} id - The ID of the organization to update.
   * @param {any} data - The fields to update.
   * @returns {Promise<TrelloOrganization>} A promise that resolves to the updated organization object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-put
   */
  async updateOrganization(id: string, data: any): Promise<TrelloOrganization> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloOrganization>(`/organizations/${id}`, null, { params: data })
    );
  }

  /**
   * Deletes an organization.
   * @param {string} id - The ID of the organization to delete.
   * @returns {Promise<void>} A promise that resolves when the organization is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-delete
   */
  async deleteOrganization(id: string): Promise<void> {
    return withRateLimit(() =>
      trelloHttp.delete(`/organizations/${id}`)
    );
  }

  /**
   * Retrieves all members of an organization.
   * @param {string} id - The ID of the organization.
   * @param {any} [options={}] - Optional query parameters.
   * @returns {Promise<TrelloMember[]>} A promise that resolves to an array of member objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-members-get
   */
  async getOrganizationMembers(id: string, options: any = {}): Promise<TrelloMember[]> {
    return withRateLimit(() =>
      trelloHttp.get<TrelloMember[]>(`/organizations/${id}/members`, { params: options })
    );
  }

  /**
   * Retrieves all boards in an organization.
   * @param {string} id - The ID of the organization.
   * @param {any} [options={}] - Optional query parameters.
   * @returns {Promise<TrelloBoard[]>} A promise that resolves to an array of board objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-boards-get
   */
  async getOrganizationBoards(id: string, options: any = {}): Promise<TrelloBoard[]> {
    return withRateLimit(() =>
      trelloHttp.get<TrelloBoard[]>(`/organizations/${id}/boards`, { params: options })
    );
  }

  /**
   * Invites a member to an organization.
   * @param {string} id - The ID of the organization.
   * @param {any} data - The invitation details (e.g., email, fullName).
   * @returns {Promise<TrelloMember>} A promise that resolves to the updated member object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-members-put
   */
  async inviteMemberToOrganization(id: string, data: any): Promise<TrelloMember> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloMember>(`/organizations/${id}/members`, null, { params: data })
    );
  }

  /**
   * Updates a member's role within an organization.
   * @param {string} id - The ID of the organization.
   * @param {string} memberId - The ID of the member to update.
   * @param {any} data - The fields to update (e.g., type).
   * @returns {Promise<TrelloMember>} A promise that resolves to the updated member object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-members-idmember-put
   */
  async updateOrganizationMember(id: string, memberId: string, data: any): Promise<TrelloMember> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloMember>(`/organizations/${id}/members/${memberId}`, null, { params: data })
    );
  }

  /**
   * Removes a member from an organization.
   * @param {string} id - The ID of the organization.
   * @param {string} memberId - The ID of the member to remove.
   * @returns {Promise<void>} A promise that resolves when the member is removed.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-members-idmember-delete
   */
  async removeOrganizationMember(id: string, memberId: string): Promise<void> {
    return withRateLimit(() =>
      trelloHttp.delete(`/organizations/${id}/members/${memberId}`)
    );
  }

  /**
   * Deactivates a member in an organization.
   * @param {string} id - The ID of the organization.
   * @param {string} memberId - The ID of the member to deactivate.
   * @param {boolean} value - Set to true to deactivate, false to reactivate.
   * @returns {Promise<TrelloMember>} A promise that resolves to the updated member object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-members-idmember-deactivated-put
   */
  async deactivateOrganizationMember(id: string, memberId: string, value: boolean): Promise<TrelloMember> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloMember>(`/organizations/${id}/members/${memberId}/deactivated`, null, {
        params: { value: value.toString() }
      })
    );
  }

  /**
   * Retrieves all memberships of an organization.
   * @param {string} id - The ID of the organization.
   * @param {any} [options={}] - Optional query parameters.
   * @returns {Promise<any[]>} A promise that resolves to an array of membership objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-memberships-get
   */
  async getOrganizationMemberships(id: string, options: any = {}): Promise<any[]> {
    return withRateLimit(() =>
      trelloHttp.get<any[]>(`/organizations/${id}/memberships`, { params: options })
    );
  }

  /**
   * Retrieves a specific membership of an organization.
   * @param {string} id - The ID of the organization.
   * @param {string} membershipId - The ID of the membership.
   * @param {any} [options={}] - Optional query parameters.
   * @returns {Promise<any>} A promise that resolves to the membership object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-organizations/#api-organizations-id-memberships-idmembership-get
   */
  async getOrganizationMembership(id: string, membershipId: string, options: any = {}): Promise<any> {
    return withRateLimit(() =>
      trelloHttp.get<any>(`/organizations/${id}/memberships/${membershipId}`, { params: options })
    );
  }

  // ===== WEBHOOKS =====

  /**
   * Creates a new webhook.
   * @param {object} data - The details of the webhook to create.
   * @param {string} data.callbackURL - The URL that Trello will POST to.
   * @param {string} data.idModel - The ID of the model (board, list, card, etc.) to watch.
   * @param {string} [data.description] - A description for the webhook.
   * @param {boolean} [data.active] - Whether the webhook is active.
   * @returns {Promise<TrelloWebhook>} A promise that resolves to the created webhook object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-webhooks/#api-webhooks-post
   */
  async createWebhook(data: {
    callbackURL: string;
    idModel: string;
    description?: string;
    active?: boolean;
  }): Promise<TrelloWebhook> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloWebhook>('/webhooks', null, { params: data })
    );
  }

  /**
   * Lists all webhooks created by the current user's token.
   * @param {string} [token='current'] - The token to list webhooks for. Defaults to the one used for the request.
   * @returns {Promise<TrelloWebhook[]>} A promise that resolves to an array of webhook objects.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-tokens/#api-tokens-token-webhooks-get
   */
  async listWebhooks(token: string = 'current'): Promise<TrelloWebhook[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloWebhook[]>(`/tokens/${token}/webhooks`)
    );
  }

  /**
   * Retrieves a specific webhook by its ID.
   * @param {string} id - The ID of the webhook.
   * @returns {Promise<TrelloWebhook>} A promise that resolves to the webhook object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-webhooks/#api-webhooks-id-get
   */
  async getWebhook(id: string): Promise<TrelloWebhook> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloWebhook>(`/webhooks/${id}`)
    );
  }

  /**
   * Updates an existing webhook.
   * @param {string} id - The ID of the webhook to update.
   * @param {object} data - The fields to update.
   * @returns {Promise<TrelloWebhook>} A promise that resolves to the updated webhook object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-webhooks/#api-webhooks-id-put
   */
  async updateWebhook(id: string, data: {
    description?: string;
    callbackURL?: string;
    active?: boolean;
  }): Promise<TrelloWebhook> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloWebhook>(`/webhooks/${id}`, null, { params: data })
    );
  }

  /**
   * Deletes a webhook.
   * @param {string} id - The ID of the webhook to delete.
   * @returns {Promise<void>} A promise that resolves when the webhook is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-webhooks/#api-webhooks-id-delete
   */
  async deleteWebhook(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/webhooks/${id}`)
    );
  }

  /**
   * Creates a webhook associated with a specific token.
   * @param {string} [token='current'] - The token to associate the webhook with.
   * @param {object} data - The details of the webhook.
   * @returns {Promise<TrelloWebhook>} A promise that resolves to the created webhook object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-tokens/#api-tokens-token-webhooks-post
   */
  async createTokenWebhook(token: string = 'current', data: {
    callbackURL: string;
    idModel: string;
    description?: string;
  }): Promise<TrelloWebhook> {
    return withHighPriorityRateLimit(() =>
      trelloHttp.post<TrelloWebhook>(`/tokens/${token}/webhooks`, null, { params: data })
    );
  }

  /**
   * Updates a webhook associated with a specific token.
   * @param {string} [token='current'] - The token associated with the webhook.
   * @param {string} webhookId - The ID of the webhook to update.
   * @param {object} data - The fields to update.
   * @returns {Promise<TrelloWebhook>} A promise that resolves to the updated webhook object.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-tokens/#api-tokens-token-webhooks-idwebhook-put
   */
  async updateTokenWebhook(token: string = 'current', webhookId: string, data: {
    description?: string;
    callbackURL?: string;
    active?: boolean;
  }): Promise<TrelloWebhook> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloWebhook>(`/tokens/${token}/webhooks/${webhookId}`, null, { params: data })
    );
  }

  /**
   * Deletes a webhook associated with a specific token.
   * @param {string} [token='current'] - The token associated with the webhook.
   * @param {string} webhookId - The ID of the webhook to delete.
   * @returns {Promise<void>} A promise that resolves when the webhook is deleted.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-tokens/#api-tokens-token-webhooks-idwebhook-delete
   */
  async deleteTokenWebhook(token: string = 'current', webhookId: string): Promise<void> {
    return withHighPriorityRateLimit(() =>
      trelloHttp.delete(`/tokens/${token}/webhooks/${webhookId}`)
    );
  }

  /**
   * Retrieves a specific field from a webhook object.
   * @param {string} id - The ID of the webhook.
   * @param {'active' | 'callbackURL' | 'description' | 'idModel'} field - The field to retrieve.
   * @returns {Promise<any>} A promise that resolves to the value of the field.
   * @see https://developer.atlassian.com/cloud/trello/rest/api-group-webhooks/#api-webhooks-id-field-get
   */
  async getWebhookField(id: string, field: 'active' | 'callbackURL' | 'description' | 'idModel'): Promise<any> {
    return withRateLimit(() =>
      trelloHttp.get<any>(`/webhooks/${id}/${field}`)
    );
  }
}

/**
 * A singleton instance of the TrelloClient, allowing for a single, shared client throughout the application.
 * @type {TrelloClient}
 */
export const trelloClient = new TrelloClient();