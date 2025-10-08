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

export class TrelloClient {
  // ===== BOARDS =====
  
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

  async listBoards(memberId: string = 'me'): Promise<TrelloBoard[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloBoard[]>(`/members/${memberId}/boards`)
    );
  }

  async createBoard(request: CreateBoardRequest): Promise<TrelloBoard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloBoard>('/boards', null, { params: request })
    );
  }

  async updateBoard(id: string, request: UpdateBoardRequest): Promise<TrelloBoard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloBoard>(`/boards/${id}`, null, { params: request })
    );
  }

  async closeBoard(id: string): Promise<TrelloBoard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloBoard>(`/boards/${id}`, null, { params: { closed: true } })
    );
  }

  async reopenBoard(id: string): Promise<TrelloBoard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloBoard>(`/boards/${id}`, null, { params: { closed: false } })
    );
  }

  async deleteBoard(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/boards/${id}`)
    );
  }

  // ===== LISTS =====

  async listLists(boardId: string, filter: 'all' | 'open' | 'closed' = 'open'): Promise<TrelloList[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloList[]>(`/boards/${boardId}/lists`, { params: { filter } })
    );
  }

  async getList(id: string): Promise<TrelloList> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloList>(`/lists/${id}`)
    );
  }

  async createList(request: CreateListRequest): Promise<TrelloList> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloList>('/lists', null, { params: request })
    );
  }

  async updateList(id: string, request: UpdateListRequest): Promise<TrelloList> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloList>(`/lists/${id}`, null, { params: request })
    );
  }

  async archiveList(id: string): Promise<TrelloList> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloList>(`/lists/${id}`, null, { params: { closed: true } })
    );
  }

  async unarchiveList(id: string): Promise<TrelloList> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloList>(`/lists/${id}`, null, { params: { closed: false } })
    );
  }

  // ===== CARDS =====

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

  async createCard(request: CreateCardRequest): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloCard>('/cards', null, { params: request })
    );
  }

  async updateCard(id: string, request: UpdateCardRequest): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCard>(`/cards/${id}`, null, { params: request })
    );
  }

  async moveCard(id: string, listId: string, position?: number | 'top' | 'bottom'): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCard>(`/cards/${id}`, null, { 
        params: { idList: listId, pos: position } 
      })
    );
  }

  async archiveCard(id: string): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCard>(`/cards/${id}`, null, { params: { closed: true } })
    );
  }

  async unarchiveCard(id: string): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloCard>(`/cards/${id}`, null, { params: { closed: false } })
    );
  }

  async deleteCard(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/cards/${id}`)
    );
  }

  // ===== CARD COMMENTS =====

  async addComment(cardId: string, text: string): Promise<TrelloAction> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloAction>(`/cards/${cardId}/actions/comments`, null, { 
        params: { text } 
      })
    );
  }

  async editComment(actionId: string, text: string): Promise<TrelloAction> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloAction>(`/actions/${actionId}`, null, { params: { text } })
    );
  }

  async deleteComment(actionId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/actions/${actionId}`)
    );
  }

  // ===== CARD LABELS =====

  async addLabelToCard(cardId: string, labelId: string): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloCard>(`/cards/${cardId}/idLabels`, null, { 
        params: { value: labelId } 
      })
    );
  }

  async removeLabelFromCard(cardId: string, labelId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/cards/${cardId}/idLabels/${labelId}`)
    );
  }

  // ===== CARD MEMBERS =====

  async assignMemberToCard(cardId: string, memberId: string): Promise<TrelloCard> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloCard>(`/cards/${cardId}/idMembers`, null, { 
        params: { value: memberId } 
      })
    );
  }

  async removeMemberFromCard(cardId: string, memberId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/cards/${cardId}/idMembers/${memberId}`)
    );
  }

  // ===== LABELS =====

  async listLabels(boardId: string): Promise<TrelloLabel[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloLabel[]>(`/boards/${boardId}/labels`)
    );
  }

  async getLabel(id: string): Promise<TrelloLabel> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloLabel>(`/labels/${id}`)
    );
  }

  async createLabel(request: CreateLabelRequest): Promise<TrelloLabel> {
    return withHighPriorityRateLimit(() =>
      trelloHttp.post<TrelloLabel>('/labels', null, { params: request })
    );
  }

  async updateLabel(id: string, request: UpdateLabelRequest): Promise<TrelloLabel> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put<TrelloLabel>(`/labels/${id}`, null, { params: request })
    );
  }

  async deleteLabel(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/labels/${id}`)
    );
  }

  async updateLabelField(id: string, field: string, value: any): Promise<any> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put(`/labels/${id}/${field}`, null, { params: { value } })
    );
  }

  // ===== CHECKLISTS =====

  async createChecklist(request: CreateChecklistRequest): Promise<TrelloChecklist> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloChecklist>('/checklists', null, { params: request })
    );
  }

  async getChecklist(id: string): Promise<TrelloChecklist> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloChecklist>(`/checklists/${id}`)
    );
  }

  async deleteChecklist(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/checklists/${id}`)
    );
  }

  async updateChecklistField(id: string, field: string, value: any): Promise<any> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.put(`/checklists/${id}/${field}`, null, { params: { value } })
    );
  }

  async getChecklistBoard(id: string): Promise<TrelloBoard> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloBoard>(`/checklists/${id}/board`)
    );
  }

  async getChecklistCard(id: string): Promise<TrelloCard[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloCard[]>(`/checklists/${id}/cards`)
    );
  }

  async addCheckItem(checklistId: string, request: CreateCheckItemRequest): Promise<TrelloCheckItem> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloCheckItem>(`/checklists/${checklistId}/checkItems`, null, { 
        params: request 
      })
    );
  }

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

  async deleteCheckItem(checklistId: string, checkItemId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/checklists/${checklistId}/checkItems/${checkItemId}`)
    );
  }

  // ===== ATTACHMENTS =====

  async addUrlAttachment(cardId: string, url: string, name?: string): Promise<TrelloAttachment> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.post<TrelloAttachment>(`/cards/${cardId}/attachments`, null, { 
        params: { url, name } 
      })
    );
  }

  async deleteAttachment(cardId: string, attachmentId: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/cards/${cardId}/attachments/${attachmentId}`)
    );
  }

  // ===== MEMBERS =====

  async getMember(id: string): Promise<TrelloMember> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloMember>(`/members/${id}`)
    );
  }

  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloMember[]>(`/boards/${boardId}/members`)
    );
  }

  // ===== NOTIFICATIONS =====

  async listNotifications(memberId: string = 'me', options: any = {}): Promise<any[]> {
    return withRateLimit(() =>
      trelloHttp.get<any[]>(`/members/${memberId}/notifications`, { params: options })
    );
  }

  async getNotification(id: string): Promise<any> {
    return withRateLimit(() =>
      trelloHttp.get<any>(`/notifications/${id}`)
    );
  }

  async markNotificationRead(id: string, unread: boolean = false): Promise<any> {
    return withHighPriorityRateLimit(() =>
      trelloHttp.put<any>(`/notifications/${id}/unread`, null, { params: { value: unread ? 'true' : 'false' } })
    );
  }

  async markAllNotificationsRead(read: boolean = true, ids?: string[]): Promise<any> {
    const params: any = { read: read ? 'true' : 'false' };
    if (ids && ids.length > 0) params.ids = ids.join(',');
    return withHighPriorityRateLimit(() =>
      trelloHttp.post<any>(`/notifications/all/read`, null, { params })
    );
  }

  // ===== ACTIONS (RECENT ACTIVITY) =====

  async listMemberActions(memberId: string = 'me', options: any = {}): Promise<any[]> {
    return withRateLimit(() =>
      trelloHttp.get<any[]>(`/members/${memberId}/actions`, { params: options })
    );
  }

  async listBoardActions(boardId: string, options: any = {}): Promise<any[]> {
    return withRateLimit(() =>
      trelloHttp.get<any[]>(`/boards/${boardId}/actions`, { params: options })
    );
  }

  // ===== SEARCH =====

  async search(request: SearchRequest): Promise<SearchResponse> {
    return withLowPriorityRateLimit(() => 
      trelloHttp.get<SearchResponse>('/search', { params: request })
    );
  }

  // ===== BATCH =====

  async batch<T>(urls: string[]): Promise<T[]> {
    return withLowPriorityRateLimit(() => 
      trelloHttp.batch<T>(urls)
    );
  }

  // ===== BULK LIST OPERATIONS =====

  async archiveAllCardsInList(listId: string): Promise<any> {
    return withRateLimit(() =>
      trelloHttp.post<any>(`/lists/${listId}/archiveAllCards`)
    );
  }

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

  async getMemberOrganizations(memberId: string = 'me', options: any = {}): Promise<TrelloOrganization[]> {
    return withRateLimit(() =>
      trelloHttp.get<TrelloOrganization[]>(`/members/${memberId}/organizations`, { params: options })
    );
  }

  async getOrganization(id: string, options: any = {}): Promise<TrelloOrganization> {
    return withRateLimit(() =>
      trelloHttp.get<TrelloOrganization>(`/organizations/${id}`, { params: options })
    );
  }

  async createOrganization(data: any): Promise<TrelloOrganization> {
    return withRateLimit(() =>
      trelloHttp.post<TrelloOrganization>('/organizations', null, { params: data })
    );
  }

  async updateOrganization(id: string, data: any): Promise<TrelloOrganization> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloOrganization>(`/organizations/${id}`, null, { params: data })
    );
  }

  async deleteOrganization(id: string): Promise<void> {
    return withRateLimit(() =>
      trelloHttp.delete(`/organizations/${id}`)
    );
  }

  async getOrganizationMembers(id: string, options: any = {}): Promise<TrelloMember[]> {
    return withRateLimit(() =>
      trelloHttp.get<TrelloMember[]>(`/organizations/${id}/members`, { params: options })
    );
  }

  async getOrganizationBoards(id: string, options: any = {}): Promise<TrelloBoard[]> {
    return withRateLimit(() =>
      trelloHttp.get<TrelloBoard[]>(`/organizations/${id}/boards`, { params: options })
    );
  }

  async inviteMemberToOrganization(id: string, data: any): Promise<TrelloMember> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloMember>(`/organizations/${id}/members`, null, { params: data })
    );
  }

  async updateOrganizationMember(id: string, memberId: string, data: any): Promise<TrelloMember> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloMember>(`/organizations/${id}/members/${memberId}`, null, { params: data })
    );
  }

  async removeOrganizationMember(id: string, memberId: string): Promise<void> {
    return withRateLimit(() =>
      trelloHttp.delete(`/organizations/${id}/members/${memberId}`)
    );
  }

  async deactivateOrganizationMember(id: string, memberId: string, value: boolean): Promise<TrelloMember> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloMember>(`/organizations/${id}/members/${memberId}/deactivated`, null, {
        params: { value: value.toString() }
      })
    );
  }

  async getOrganizationMemberships(id: string, options: any = {}): Promise<any[]> {
    return withRateLimit(() =>
      trelloHttp.get<any[]>(`/organizations/${id}/memberships`, { params: options })
    );
  }

  async getOrganizationMembership(id: string, membershipId: string, options: any = {}): Promise<any> {
    return withRateLimit(() =>
      trelloHttp.get<any>(`/organizations/${id}/memberships/${membershipId}`, { params: options })
    );
  }

  // ===== WEBHOOKS =====

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

  async listWebhooks(token: string = 'current'): Promise<TrelloWebhook[]> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloWebhook[]>(`/tokens/${token}/webhooks`)
    );
  }

  async getWebhook(id: string): Promise<TrelloWebhook> {
    return withRateLimit(() => 
      trelloHttp.get<TrelloWebhook>(`/webhooks/${id}`)
    );
  }

  async updateWebhook(id: string, data: {
    description?: string;
    callbackURL?: string;
    active?: boolean;
  }): Promise<TrelloWebhook> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloWebhook>(`/webhooks/${id}`, null, { params: data })
    );
  }

  async deleteWebhook(id: string): Promise<void> {
    return withHighPriorityRateLimit(() => 
      trelloHttp.delete(`/webhooks/${id}`)
    );
  }

  async createTokenWebhook(token: string = 'current', data: {
    callbackURL: string;
    idModel: string;
    description?: string;
  }): Promise<TrelloWebhook> {
    return withHighPriorityRateLimit(() =>
      trelloHttp.post<TrelloWebhook>(`/tokens/${token}/webhooks`, null, { params: data })
    );
  }

  async updateTokenWebhook(token: string = 'current', webhookId: string, data: {
    description?: string;
    callbackURL?: string;
    active?: boolean;
  }): Promise<TrelloWebhook> {
    return withRateLimit(() =>
      trelloHttp.put<TrelloWebhook>(`/tokens/${token}/webhooks/${webhookId}`, null, { params: data })
    );
  }

  async deleteTokenWebhook(token: string = 'current', webhookId: string): Promise<void> {
    return withHighPriorityRateLimit(() =>
      trelloHttp.delete(`/tokens/${token}/webhooks/${webhookId}`)
    );
  }

  async getWebhookField(id: string, field: 'active' | 'callbackURL' | 'description' | 'idModel'): Promise<any> {
    return withRateLimit(() =>
      trelloHttp.get<any>(`/webhooks/${id}/${field}`)
    );
  }
}

// Singleton instance
export const trelloClient = new TrelloClient();
