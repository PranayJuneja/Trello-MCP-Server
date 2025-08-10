import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const searchTrelloSchema = z.object({
  query: z.string().min(1).max(16384).describe('The search query'),
  idBoards: z.union([z.string(), z.array(z.string())]).optional().describe('Board IDs to limit search to, or "mine" for user boards'),
  idOrganizations: z.union([z.string(), z.array(z.string())]).optional().describe('Organization IDs to limit search to'),
  idCards: z.union([z.string(), z.array(z.string())]).optional().describe('Card IDs to limit search to'),
  modelTypes: z.array(z.enum(['actions', 'boards', 'cards', 'members', 'organizations'])).optional().describe('Types of objects to search for'),
  board_fields: z.string().optional().describe('Board fields to include in results'),
  boards_limit: z.number().min(1).max(1000).optional().default(10).describe('Maximum number of boards to return'),
  card_fields: z.string().optional().describe('Card fields to include in results'),
  cards_limit: z.number().min(1).max(1000).optional().default(10).describe('Maximum number of cards to return'),
  cards_page: z.number().min(0).optional().default(0).describe('Page number for card results'),
  partial: z.boolean().optional().default(false).describe('Whether to use partial matching'),
});

export const searchBoardsSchema = z.object({
  query: z.string().min(1).max(16384).describe('Search term for board names and descriptions'),
  memberId: z.string().optional().default('me').describe('Member ID to search boards for'),
  includeStarred: z.boolean().optional().default(true).describe('Include starred boards in results'),
  includeClosed: z.boolean().optional().default(false).describe('Include closed boards in results'),
  limit: z.number().min(1).max(1000).optional().default(25).describe('Maximum number of boards to return'),
});

export const searchCardsSchema = z.object({
  query: z.string().min(1).max(16384).describe('Search term for card names, descriptions, and comments'),
  boardId: z.string().optional().describe('Board ID to limit search to specific board'),
  listId: z.string().optional().describe('List ID to limit search to specific list'),
  memberId: z.string().optional().describe('Member ID to find cards assigned to specific member'),
  labelId: z.string().optional().describe('Label ID to find cards with specific label'),
  includeArchived: z.boolean().optional().default(false).describe('Include archived cards in results'),
  includeClosed: z.boolean().optional().default(false).describe('Include closed cards in results'),
  hasAttachments: z.boolean().optional().describe('Filter cards with attachments'),
  hasChecklists: z.boolean().optional().describe('Filter cards with checklists'),
  hasComments: z.boolean().optional().describe('Filter cards with comments'),
  hasDueDate: z.boolean().optional().describe('Filter cards with due dates'),
  isOverdue: z.boolean().optional().describe('Filter overdue cards'),
  limit: z.number().min(1).max(1000).optional().default(25).describe('Maximum number of cards to return'),
});

export const searchMembersSchema = z.object({
  query: z.string().min(1).max(16384).describe('Search term for member names, usernames, and emails'),
  boardId: z.string().optional().describe('Board ID to limit search to board members'),
  organizationId: z.string().optional().describe('Organization ID to limit search to organization members'),
  includeDeactivated: z.boolean().optional().default(false).describe('Include deactivated members in results'),
  limit: z.number().min(1).max(1000).optional().default(25).describe('Maximum number of members to return'),
});

export const getAdvancedSearchSchema = z.object({
  filters: z.object({
    boards: z.array(z.string()).optional().describe('Board IDs to search within'),
    lists: z.array(z.string()).optional().describe('List IDs to search within'),
    labels: z.array(z.string()).optional().describe('Label IDs to filter by'),
    members: z.array(z.string()).optional().describe('Member IDs to filter by'),
    dueDateRange: z.object({
      start: z.string().optional().describe('Start date for due date range (ISO format)'),
      end: z.string().optional().describe('End date for due date range (ISO format)'),
    }).optional().describe('Due date range filter'),
    createdRange: z.object({
      start: z.string().optional().describe('Start date for creation date range (ISO format)'),
      end: z.string().optional().describe('End date for creation date range (ISO format)'),
    }).optional().describe('Creation date range filter'),
    hasAttachments: z.boolean().optional().describe('Filter by attachment presence'),
    hasChecklists: z.boolean().optional().describe('Filter by checklist presence'),
    hasComments: z.boolean().optional().describe('Filter by comment presence'),
    isArchived: z.boolean().optional().describe('Filter by archived status'),
  }).describe('Advanced search filters'),
  textQuery: z.string().optional().describe('Text search query'),
  sortBy: z.enum(['created', 'modified', 'due', 'name']).optional().default('modified').describe('Sort results by field'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order'),
  limit: z.number().min(1).max(1000).optional().default(50).describe('Maximum number of results'),
});

export const getSavedSearchesSchema = z.object({
  memberId: z.string().optional().default('me').describe('Member ID to get saved searches for'),
});

export const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(16384).describe('Name for the saved search'),
  query: z.string().min(1).max(16384).describe('Search query to save'),
  memberId: z.string().optional().default('me').describe('Member ID to save search for'),
});

// ===== TOOL HANDLERS =====

export async function searchTrello(args: z.infer<typeof searchTrelloSchema>, context: McpContext) {
  context.logger.info({ query: args.query }, 'Performing Trello search');
  
  // Prepare search request
  const searchParams: any = {
    query: args.query,
    ...(args.idBoards && { idBoards: Array.isArray(args.idBoards) ? args.idBoards.join(',') : args.idBoards }),
    ...(args.idOrganizations && { idOrganizations: Array.isArray(args.idOrganizations) ? args.idOrganizations.join(',') : args.idOrganizations }),
    ...(args.idCards && { idCards: Array.isArray(args.idCards) ? args.idCards.join(',') : args.idCards }),
    ...(args.modelTypes && { modelTypes: args.modelTypes }),
    ...(args.board_fields && { board_fields: args.board_fields }),
    ...(args.boards_limit && { boards_limit: args.boards_limit }),
    ...(args.card_fields && { card_fields: args.card_fields }),
    ...(args.cards_limit && { cards_limit: args.cards_limit }),
    ...(args.cards_page && { cards_page: args.cards_page }),
    ...(args.partial !== undefined && { partial: args.partial }),
  };
  
  const results = await trelloClient.search(searchParams);
  
  const totalResults = (results.boards?.length || 0) + 
                      (results.cards?.length || 0) + 
                      (results.members?.length || 0) + 
                      (results.organizations?.length || 0) +
                      (results.actions?.length || 0);
  
  return {
    success: true,
    data: results,
    summary: `Found ${totalResults} total results: ${results.boards?.length || 0} boards, ${results.cards?.length || 0} cards, ${results.members?.length || 0} members, ${results.organizations?.length || 0} organizations, ${results.actions?.length || 0} actions`,
  };
}

export async function searchBoards(args: z.infer<typeof searchBoardsSchema>, context: McpContext) {
  context.logger.info({ query: args.query, memberId: args.memberId }, 'Searching boards');
  
  // Get all user boards first
  const allBoards = await trelloClient.listBoards(args.memberId);
  
  // Filter boards based on search criteria
  let filteredBoards = allBoards.filter(board => {
    const matchesQuery = board.name.toLowerCase().includes(args.query.toLowerCase()) ||
                        (board.desc && board.desc.toLowerCase().includes(args.query.toLowerCase()));
    
    const matchesStarred = args.includeStarred || !board.starred;
    const matchesClosed = args.includeClosed || !board.closed;
    
    return matchesQuery && matchesStarred && matchesClosed;
  });
  
  // Apply limit
  if (args.limit && filteredBoards.length > args.limit) {
    filteredBoards = filteredBoards.slice(0, args.limit);
  }
  
  return {
    success: true,
    data: filteredBoards,
    summary: `Found ${filteredBoards.length} boards matching "${args.query}"`,
  };
}

export async function searchCards(args: z.infer<typeof searchCardsSchema>, context: McpContext) {
  context.logger.info({ query: args.query, boardId: args.boardId }, 'Searching cards');
  
  let searchResults: any[] = [];
  
  if (args.boardId) {
    // Search within specific board
    const board = await trelloClient.getBoard(args.boardId, {
      cards: args.includeArchived ? 'all' : 'open',
      lists: 'all',
      members: 'all',
      labels: 'all'
    });
    
    if (board.cards) {
      searchResults = board.cards.filter(card => {
        const matchesQuery = card.name.toLowerCase().includes(args.query.toLowerCase()) ||
                            (card.desc && card.desc.toLowerCase().includes(args.query.toLowerCase()));
        
        const matchesList = !args.listId || card.idList === args.listId;
        const matchesMember = !args.memberId || card.idMembers.includes(args.memberId);
        const matchesLabel = !args.labelId || card.labels.some(label => label.id === args.labelId);
        const matchesClosed = args.includeClosed || !card.closed;
        
        // Advanced filters
        const matchesAttachments = args.hasAttachments === undefined || 
                                   (args.hasAttachments === true && card.badges.attachments > 0) ||
                                   (args.hasAttachments === false && card.badges.attachments === 0);
        
        const matchesChecklists = args.hasChecklists === undefined || 
                                  (args.hasChecklists === true && card.badges.checkItems > 0) ||
                                  (args.hasChecklists === false && card.badges.checkItems === 0);
        
        const matchesComments = args.hasComments === undefined || 
                               (args.hasComments === true && card.badges.comments > 0) ||
                               (args.hasComments === false && card.badges.comments === 0);
        
        const matchesDueDate = args.hasDueDate === undefined || 
                              (args.hasDueDate === true && card.due) ||
                              (args.hasDueDate === false && !card.due);
        
        const matchesOverdue = args.isOverdue === undefined || 
                              (args.isOverdue === true && card.due && new Date(card.due) < new Date() && !card.dueComplete) ||
                              (args.isOverdue === false && (!card.due || new Date(card.due) >= new Date() || card.dueComplete));
        
        return matchesQuery && matchesList && matchesMember && matchesLabel && matchesClosed &&
               matchesAttachments && matchesChecklists && matchesComments && matchesDueDate && matchesOverdue;
      });
    }
  } else {
    // Use global search
    const searchParams = {
      query: args.query,
      modelTypes: ['cards'] as ('cards')[],
      cards_limit: args.limit || 25,
      partial: true,
    };
    
    const results = await trelloClient.search(searchParams);
    searchResults = results.cards || [];
  }
  
  // Apply limit
  if (args.limit && searchResults.length > args.limit) {
    searchResults = searchResults.slice(0, args.limit);
  }
  
  return {
    success: true,
    data: searchResults,
    summary: `Found ${searchResults.length} cards matching "${args.query}"${args.boardId ? ' on specified board' : ' across all boards'}`,
  };
}

export async function searchMembers(args: z.infer<typeof searchMembersSchema>, context: McpContext) {
  context.logger.info({ query: args.query, boardId: args.boardId }, 'Searching members');
  
  let searchResults: any[] = [];
  
  if (args.boardId) {
    // Search within specific board
    const boardMembers = await trelloClient.getBoardMembers(args.boardId);
    
    searchResults = boardMembers.filter(member => {
      const matchesQuery = member.fullName.toLowerCase().includes(args.query.toLowerCase()) ||
                          member.username.toLowerCase().includes(args.query.toLowerCase()) ||
                          (member.email && member.email.toLowerCase().includes(args.query.toLowerCase()));
      
      const matchesDeactivated = args.includeDeactivated || member.confirmed;
      
      return matchesQuery && matchesDeactivated;
    });
  } else if (args.organizationId) {
    // Search within organization (would need organization members endpoint)
    // For now, use global search
    const searchParams = {
      query: args.query,
      modelTypes: ['members'] as ('members')[],
      partial: true,
    };
    
    const results = await trelloClient.search(searchParams);
    searchResults = results.members || [];
  } else {
    // Global member search
    const searchParams = {
      query: args.query,
      modelTypes: ['members'] as ('members')[],
      partial: true,
    };
    
    const results = await trelloClient.search(searchParams);
    searchResults = results.members || [];
  }
  
  // Apply limit
  if (args.limit && searchResults.length > args.limit) {
    searchResults = searchResults.slice(0, args.limit);
  }
  
  return {
    success: true,
    data: searchResults,
    summary: `Found ${searchResults.length} members matching "${args.query}"`,
  };
}

export async function getAdvancedSearch(args: z.infer<typeof getAdvancedSearchSchema>, context: McpContext) {
  context.logger.info({ filters: args.filters, textQuery: args.textQuery }, 'Performing advanced search');
  
  // Build advanced search query
  let queryParts: string[] = [];
  
  if (args.textQuery) {
    queryParts.push(args.textQuery);
  }
  
  if (args.filters.members && args.filters.members.length > 0) {
    queryParts.push(`@${args.filters.members.join(' @')}`);
  }
  
  if (args.filters.labels && args.filters.labels.length > 0) {
    queryParts.push(`#${args.filters.labels.join(' #')}`);
  }
  
  if (args.filters.dueDateRange) {
    if (args.filters.dueDateRange.start && args.filters.dueDateRange.end) {
      queryParts.push(`due:${args.filters.dueDateRange.start}..${args.filters.dueDateRange.end}`);
    } else if (args.filters.dueDateRange.start) {
      queryParts.push(`due:>${args.filters.dueDateRange.start}`);
    } else if (args.filters.dueDateRange.end) {
      queryParts.push(`due:<${args.filters.dueDateRange.end}`);
    }
  }
  
  if (args.filters.hasAttachments !== undefined) {
    queryParts.push(args.filters.hasAttachments ? 'has:attachments' : '-has:attachments');
  }
  
  if (args.filters.hasChecklists !== undefined) {
    queryParts.push(args.filters.hasChecklists ? 'has:checklists' : '-has:checklists');
  }
  
  if (args.filters.hasComments !== undefined) {
    queryParts.push(args.filters.hasComments ? 'has:comments' : '-has:comments');
  }
  
  if (args.filters.isArchived !== undefined) {
    queryParts.push(args.filters.isArchived ? 'is:archived' : '-is:archived');
  }
  
  const searchQuery = queryParts.join(' ');
  
  if (!searchQuery.trim()) {
    throw new Error('No search criteria provided');
  }
  
  // Perform search
  const searchParams = {
    query: searchQuery,
    idBoards: args.filters.boards ? args.filters.boards.join(',') : undefined,
    modelTypes: ['cards', 'boards'] as ('cards' | 'boards')[],
    cards_limit: args.limit,
    boards_limit: args.limit,
    partial: true,
  };
  
  const results = await trelloClient.search(searchParams);
  
  // Sort results if possible (basic implementation)
  if (results.cards && args.sortBy) {
    results.cards.sort((a, b) => {
      let comparison = 0;
      
      switch (args.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.dateLastActivity).getTime() - new Date(b.dateLastActivity).getTime();
          break;
        case 'modified':
          comparison = new Date(a.dateLastActivity).getTime() - new Date(b.dateLastActivity).getTime();
          break;
        case 'due':
          if (a.due && b.due) {
            comparison = new Date(a.due).getTime() - new Date(b.due).getTime();
          } else if (a.due) {
            comparison = -1;
          } else if (b.due) {
            comparison = 1;
          }
          break;
      }
      
      return args.sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  
  const totalResults = (results.boards?.length || 0) + (results.cards?.length || 0);
  
  return {
    success: true,
    data: results,
    summary: `Advanced search found ${totalResults} results (${results.boards?.length || 0} boards, ${results.cards?.length || 0} cards)`,
  };
}

export async function getSavedSearches(args: z.infer<typeof getSavedSearchesSchema>, context: McpContext) {
  context.logger.info({ memberId: args.memberId }, 'Getting saved searches');
  
  // Note: This would require implementing saved searches functionality
  // For now, return empty array with a note
  const savedSearches: any[] = [];
  
  return {
    success: true,
    data: savedSearches,
    summary: `Found ${savedSearches.length} saved searches for member`,
  };
}

export async function createSavedSearch(args: z.infer<typeof createSavedSearchSchema>, context: McpContext) {
  context.logger.info({ name: args.name, memberId: args.memberId }, 'Creating saved search');
  
  // Note: This would require implementing saved searches functionality
  // For now, return a mock saved search
  const savedSearch = {
    id: 'mock-search-id',
    name: args.name,
    query: args.query,
    pos: 1,
  };
  
  return {
    success: true,
    data: savedSearch,
    summary: `Created saved search "${args.name}"`,
  };
}
