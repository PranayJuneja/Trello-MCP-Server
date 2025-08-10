import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const batchGetRequestsSchema = z.object({
  urls: z.array(z.string()).min(1).max(10).describe('Array of API routes to batch (max 10). Routes should begin with / and not include API version'),
  timeoutMs: z.number().optional().default(30000).describe('Timeout for batch operation in milliseconds'),
});

export const batchCreateCardsSchema = z.object({
  cards: z.array(z.object({
    name: z.string().min(1).max(16384).describe('Card name'),
    desc: z.string().optional().describe('Card description'),
    idList: z.string().describe('List ID where card should be created'),
    pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().default('bottom').describe('Position in the list'),
    due: z.string().optional().describe('Due date for the card'),
    start: z.string().optional().describe('Start date for the card'),
    dueComplete: z.boolean().optional().default(false).describe('Whether the due date is complete'),
    idMembers: z.array(z.string()).optional().describe('Array of member IDs to assign'),
    idLabels: z.array(z.string()).optional().describe('Array of label IDs to assign'),
    urlSource: z.string().url().optional().describe('URL source for the card'),
    keepFromSource: z.string().optional().describe('Properties to copy from source card'),
  })).min(1).max(20).describe('Array of cards to create (max 20)'),
  continueOnError: z.boolean().optional().default(false).describe('Continue processing if individual card creation fails'),
});

export const batchUpdateCardsSchema = z.object({
  updates: z.array(z.object({
    cardId: z.string().describe('ID of the card to update'),
    updates: z.object({
      name: z.string().min(1).max(16384).optional().describe('New card name'),
      desc: z.string().optional().describe('New card description'),
      closed: z.boolean().optional().describe('Whether to archive the card'),
      idList: z.string().optional().describe('New list ID'),
      pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().describe('New position'),
      due: z.string().optional().describe('New due date'),
      start: z.string().optional().describe('New start date'),
      dueComplete: z.boolean().optional().describe('Whether due date is complete'),
      subscribed: z.boolean().optional().describe('Whether member is subscribed'),
    }).describe('Updates to apply to the card'),
  })).min(1).max(20).describe('Array of card updates (max 20)'),
  continueOnError: z.boolean().optional().default(false).describe('Continue processing if individual update fails'),
});

export const batchMoveCardsSchema = z.object({
  moves: z.array(z.object({
    cardId: z.string().describe('ID of the card to move'),
    idList: z.string().describe('Target list ID'),
    pos: z.union([z.number(), z.enum(['top', 'bottom'])]).optional().default('bottom').describe('Position in target list'),
    idBoard: z.string().optional().describe('Target board ID (if moving to different board)'),
  })).min(1).max(50).describe('Array of card moves (max 50)'),
  continueOnError: z.boolean().optional().default(false).describe('Continue processing if individual move fails'),
});

export const batchAssignMembersSchema = z.object({
  assignments: z.array(z.object({
    cardId: z.string().describe('ID of the card'),
    memberIds: z.array(z.string()).describe('Array of member IDs to assign'),
    action: z.enum(['add', 'remove', 'replace']).describe('Whether to add, remove, or replace members'),
  })).min(1).max(30).describe('Array of member assignments (max 30)'),
  continueOnError: z.boolean().optional().default(false).describe('Continue processing if individual assignment fails'),
});

export const batchApplyLabelsSchema = z.object({
  applications: z.array(z.object({
    cardId: z.string().describe('ID of the card'),
    labelIds: z.array(z.string()).describe('Array of label IDs to apply'),
    action: z.enum(['add', 'remove', 'replace']).describe('Whether to add, remove, or replace labels'),
  })).min(1).max(30).describe('Array of label applications (max 30)'),
  continueOnError: z.boolean().optional().default(false).describe('Continue processing if individual application fails'),
});

export const archiveAllCardsInListSchema = z.object({
  listId: z.string().describe('ID of the list to archive all cards from'),
});

export const moveAllCardsInListSchema = z.object({
  sourceListId: z.string().describe('ID of the source list'),
  targetListId: z.string().describe('ID of the target list'),
  targetBoardId: z.string().optional().describe('ID of the target board (if moving to different board)'),
});

export const bulkArchiveCardsSchema = z.object({
  cardIds: z.array(z.string()).min(1).max(100).describe('Array of card IDs to archive (max 100)'),
  continueOnError: z.boolean().optional().default(false).describe('Continue processing if individual archive fails'),
});

export const bulkUnarchiveCardsSchema = z.object({
  cardIds: z.array(z.string()).min(1).max(100).describe('Array of card IDs to unarchive (max 100)'),
  continueOnError: z.boolean().optional().default(false).describe('Continue processing if individual unarchive fails'),
});

export const bulkDeleteCardsSchema = z.object({
  cardIds: z.array(z.string()).min(1).max(50).describe('Array of card IDs to delete (max 50)'),
  continueOnError: z.boolean().optional().default(false).describe('Continue processing if individual delete fails'),
  requireConfirmation: z.boolean().optional().default(true).describe('Require explicit confirmation for deletion'),
});

// ===== TOOL HANDLERS =====

export async function batchGetRequests(args: z.infer<typeof batchGetRequestsSchema>, context: McpContext) {
  context.logger.info({ urlCount: args.urls.length }, 'Executing batch GET requests');
  
  // Validate URLs format
  const invalidUrls = args.urls.filter(url => !url.startsWith('/'));
  if (invalidUrls.length > 0) {
    throw new Error(`Invalid URL format. URLs must start with '/': ${invalidUrls.join(', ')}`);
  }
  
  const startTime = Date.now();
  
  try {
    const results = await Promise.race([
      trelloClient.batch<any>(args.urls),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Batch request timeout')), args.timeoutMs)
      )
    ]);
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      data: {
        results,
        metadata: {
          requestCount: args.urls.length,
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      summary: `Executed ${args.urls.length} batch requests in ${duration}ms`,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    context.logger.error({ error, duration }, 'Batch request failed');
    throw error;
  }
}

export async function batchCreateCards(args: z.infer<typeof batchCreateCardsSchema>, context: McpContext) {
  context.logger.info({ cardCount: args.cards.length }, 'Creating multiple cards');
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < args.cards.length; i++) {
    const cardData = args.cards[i];
    if (!cardData) continue;
    
    try {
      const card = await trelloClient.createCard(cardData);
      results.push({
        index: i,
        success: true,
        card,
        name: cardData.name,
      });
      context.logger.debug({ cardName: cardData.name, cardId: card.id }, 'Card created successfully');
    } catch (error: any) {
      const errorInfo = {
        index: i,
        success: false,
        error: error.message,
        cardName: cardData.name,
      };
      errors.push(errorInfo);
      results.push(errorInfo);
      
      context.logger.error({ error, cardName: cardData.name }, 'Failed to create card');
      
      if (!args.continueOnError) {
        throw new Error(`Failed to create card "${cardData.name}": ${error.message}`);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = errors.length;
  
  return {
    success: failureCount === 0 || args.continueOnError,
    data: {
      results,
      summary: {
        total: args.cards.length,
        successful: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    summary: `Created ${successCount}/${args.cards.length} cards${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
  };
}

export async function batchUpdateCards(args: z.infer<typeof batchUpdateCardsSchema>, context: McpContext) {
  context.logger.info({ updateCount: args.updates.length }, 'Updating multiple cards');
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < args.updates.length; i++) {
    const updateData = args.updates[i];
    if (!updateData) continue;
    
    try {
      const card = await trelloClient.updateCard(updateData.cardId, updateData.updates);
      results.push({
        index: i,
        success: true,
        card,
        cardId: updateData.cardId,
      });
      context.logger.debug({ cardId: updateData.cardId }, 'Card updated successfully');
    } catch (error: any) {
      const errorInfo = {
        index: i,
        success: false,
        error: error.message,
        cardId: updateData.cardId,
      };
      errors.push(errorInfo);
      results.push(errorInfo);
      
      context.logger.error({ error, cardId: updateData.cardId }, 'Failed to update card');
      
      if (!args.continueOnError) {
        throw new Error(`Failed to update card ${updateData.cardId}: ${error.message}`);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = errors.length;
  
  return {
    success: failureCount === 0 || args.continueOnError,
    data: {
      results,
      summary: {
        total: args.updates.length,
        successful: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    summary: `Updated ${successCount}/${args.updates.length} cards${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
  };
}

export async function batchMoveCards(args: z.infer<typeof batchMoveCardsSchema>, context: McpContext) {
  context.logger.info({ moveCount: args.moves.length }, 'Moving multiple cards');
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < args.moves.length; i++) {
    const moveData = args.moves[i];
    if (!moveData) continue;
    
    try {
      const card = await trelloClient.moveCard(
        moveData.cardId, 
        moveData.idList, 
        moveData.pos
      );
      
      // If moving to a different board, update that too
      if (moveData.idBoard) {
        await trelloClient.updateCard(moveData.cardId, { idBoard: moveData.idBoard });
      }
      
      results.push({
        index: i,
        success: true,
        card,
        cardId: moveData.cardId,
        targetList: moveData.idList,
        targetBoard: moveData.idBoard,
      });
      context.logger.debug({ cardId: moveData.cardId, targetList: moveData.idList }, 'Card moved successfully');
    } catch (error: any) {
      const errorInfo = {
        index: i,
        success: false,
        error: error.message,
        cardId: moveData.cardId,
        targetList: moveData.idList,
      };
      errors.push(errorInfo);
      results.push(errorInfo);
      
      context.logger.error({ error, cardId: moveData.cardId }, 'Failed to move card');
      
      if (!args.continueOnError) {
        throw new Error(`Failed to move card ${moveData.cardId}: ${error.message}`);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = errors.length;
  
  return {
    success: failureCount === 0 || args.continueOnError,
    data: {
      results,
      summary: {
        total: args.moves.length,
        successful: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    summary: `Moved ${successCount}/${args.moves.length} cards${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
  };
}

export async function batchAssignMembers(args: z.infer<typeof batchAssignMembersSchema>, context: McpContext) {
  context.logger.info({ assignmentCount: args.assignments.length }, 'Batch assigning members to cards');
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < args.assignments.length; i++) {
    const assignment = args.assignments[i];
    if (!assignment) continue;
    
    try {
      let card;
      
      if (assignment.action === 'replace') {
        // First get current members, remove all, then add new ones
        const currentCard = await trelloClient.getCard(assignment.cardId);
        
        // Remove current members
        for (const memberId of currentCard.idMembers || []) {
          await trelloClient.removeMemberFromCard(assignment.cardId, memberId);
        }
        
        // Add new members
        for (const memberId of assignment.memberIds) {
          card = await trelloClient.assignMemberToCard(assignment.cardId, memberId);
        }
      } else if (assignment.action === 'add') {
        // Add each member
        for (const memberId of assignment.memberIds) {
          card = await trelloClient.assignMemberToCard(assignment.cardId, memberId);
        }
      } else if (assignment.action === 'remove') {
        // Remove each member
        for (const memberId of assignment.memberIds) {
          await trelloClient.removeMemberFromCard(assignment.cardId, memberId);
        }
        card = await trelloClient.getCard(assignment.cardId);
      }
      
      results.push({
        index: i,
        success: true,
        card,
        cardId: assignment.cardId,
        action: assignment.action,
        memberIds: assignment.memberIds,
      });
      context.logger.debug({ cardId: assignment.cardId, action: assignment.action }, 'Member assignment successful');
    } catch (error: any) {
      const errorInfo = {
        index: i,
        success: false,
        error: error.message,
        cardId: assignment.cardId,
        action: assignment.action,
        memberIds: assignment.memberIds,
      };
      errors.push(errorInfo);
      results.push(errorInfo);
      
      context.logger.error({ error, cardId: assignment.cardId }, 'Failed to assign members');
      
      if (!args.continueOnError) {
        throw new Error(`Failed to ${assignment.action} members on card ${assignment.cardId}: ${error.message}`);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = errors.length;
  
  return {
    success: failureCount === 0 || args.continueOnError,
    data: {
      results,
      summary: {
        total: args.assignments.length,
        successful: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    summary: `Processed ${successCount}/${args.assignments.length} member assignments${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
  };
}

export async function batchApplyLabels(args: z.infer<typeof batchApplyLabelsSchema>, context: McpContext) {
  context.logger.info({ applicationCount: args.applications.length }, 'Batch applying labels to cards');
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < args.applications.length; i++) {
    const application = args.applications[i];
    if (!application) continue;
    
    try {
      let card;
      
      if (application.action === 'replace') {
        // First get current labels, remove all, then add new ones
        const currentCard = await trelloClient.getCard(application.cardId);
        
        // Remove current labels
        for (const label of currentCard.labels || []) {
          await trelloClient.removeLabelFromCard(application.cardId, label.id);
        }
        
        // Add new labels
        for (const labelId of application.labelIds) {
          card = await trelloClient.addLabelToCard(application.cardId, labelId);
        }
      } else if (application.action === 'add') {
        // Add each label
        for (const labelId of application.labelIds) {
          card = await trelloClient.addLabelToCard(application.cardId, labelId);
        }
      } else if (application.action === 'remove') {
        // Remove each label
        for (const labelId of application.labelIds) {
          await trelloClient.removeLabelFromCard(application.cardId, labelId);
        }
        card = await trelloClient.getCard(application.cardId);
      }
      
      results.push({
        index: i,
        success: true,
        card,
        cardId: application.cardId,
        action: application.action,
        labelIds: application.labelIds,
      });
      context.logger.debug({ cardId: application.cardId, action: application.action }, 'Label application successful');
    } catch (error: any) {
      const errorInfo = {
        index: i,
        success: false,
        error: error.message,
        cardId: application.cardId,
        action: application.action,
        labelIds: application.labelIds,
      };
      errors.push(errorInfo);
      results.push(errorInfo);
      
      context.logger.error({ error, cardId: application.cardId }, 'Failed to apply labels');
      
      if (!args.continueOnError) {
        throw new Error(`Failed to ${application.action} labels on card ${application.cardId}: ${error.message}`);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = errors.length;
  
  return {
    success: failureCount === 0 || args.continueOnError,
    data: {
      results,
      summary: {
        total: args.applications.length,
        successful: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    summary: `Processed ${successCount}/${args.applications.length} label applications${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
  };
}

export async function archiveAllCardsInList(args: z.infer<typeof archiveAllCardsInListSchema>, context: McpContext) {
  context.logger.info({ listId: args.listId }, 'Archiving all cards in list');
  
  const result = await trelloClient.archiveAllCardsInList(args.listId);
  
  return {
    success: true,
    data: result,
    summary: `Archived all cards in list ${args.listId}`,
  };
}

export async function moveAllCardsInList(args: z.infer<typeof moveAllCardsInListSchema>, context: McpContext) {
  context.logger.info({ 
    sourceListId: args.sourceListId, 
    targetListId: args.targetListId,
    targetBoardId: args.targetBoardId 
  }, 'Moving all cards between lists');
  
  const result = await trelloClient.moveAllCardsInList(
    args.sourceListId, 
    args.targetListId, 
    args.targetBoardId
  );
  
  const destination = args.targetBoardId 
    ? `list ${args.targetListId} on board ${args.targetBoardId}`
    : `list ${args.targetListId}`;
  
  return {
    success: true,
    data: result,
    summary: `Moved all cards from list ${args.sourceListId} to ${destination}`,
  };
}

export async function bulkArchiveCards(args: z.infer<typeof bulkArchiveCardsSchema>, context: McpContext) {
  context.logger.info({ cardCount: args.cardIds.length }, 'Bulk archiving cards');
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < args.cardIds.length; i++) {
    const cardId = args.cardIds[i];
    if (!cardId) continue;
    
    try {
      const card = await trelloClient.archiveCard(cardId);
      results.push({
        index: i,
        success: true,
        card,
        cardId,
      });
      context.logger.debug({ cardId }, 'Card archived successfully');
    } catch (error: any) {
      const errorInfo = {
        index: i,
        success: false,
        error: error.message,
        cardId,
      };
      errors.push(errorInfo);
      results.push(errorInfo);
      
      context.logger.error({ error, cardId }, 'Failed to archive card');
      
      if (!args.continueOnError) {
        throw new Error(`Failed to archive card ${cardId}: ${error.message}`);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = errors.length;
  
  return {
    success: failureCount === 0 || args.continueOnError,
    data: {
      results,
      summary: {
        total: args.cardIds.length,
        successful: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    summary: `Archived ${successCount}/${args.cardIds.length} cards${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
  };
}

export async function bulkUnarchiveCards(args: z.infer<typeof bulkUnarchiveCardsSchema>, context: McpContext) {
  context.logger.info({ cardCount: args.cardIds.length }, 'Bulk unarchiving cards');
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < args.cardIds.length; i++) {
    const cardId = args.cardIds[i];
    if (!cardId) continue;
    
    try {
      const card = await trelloClient.unarchiveCard(cardId);
      results.push({
        index: i,
        success: true,
        card,
        cardId,
      });
      context.logger.debug({ cardId }, 'Card unarchived successfully');
    } catch (error: any) {
      const errorInfo = {
        index: i,
        success: false,
        error: error.message,
        cardId,
      };
      errors.push(errorInfo);
      results.push(errorInfo);
      
      context.logger.error({ error, cardId }, 'Failed to unarchive card');
      
      if (!args.continueOnError) {
        throw new Error(`Failed to unarchive card ${cardId}: ${error.message}`);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = errors.length;
  
  return {
    success: failureCount === 0 || args.continueOnError,
    data: {
      results,
      summary: {
        total: args.cardIds.length,
        successful: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    summary: `Unarchived ${successCount}/${args.cardIds.length} cards${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
  };
}

export async function bulkDeleteCards(args: z.infer<typeof bulkDeleteCardsSchema>, context: McpContext) {
  context.logger.info({ cardCount: args.cardIds.length }, 'Bulk deleting cards');
  
  if (args.requireConfirmation) {
    context.logger.warn({ cardCount: args.cardIds.length }, 'Bulk card deletion requires explicit confirmation');
    throw new Error(`Bulk deletion of ${args.cardIds.length} cards requires explicit confirmation. Set requireConfirmation=false to proceed.`);
  }
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = 0; i < args.cardIds.length; i++) {
    const cardId = args.cardIds[i];
    if (!cardId) continue;
    
    try {
      await trelloClient.deleteCard(cardId);
      results.push({
        index: i,
        success: true,
        cardId,
        deleted: true,
      });
      context.logger.debug({ cardId }, 'Card deleted successfully');
    } catch (error: any) {
      const errorInfo = {
        index: i,
        success: false,
        error: error.message,
        cardId,
      };
      errors.push(errorInfo);
      results.push(errorInfo);
      
      context.logger.error({ error, cardId }, 'Failed to delete card');
      
      if (!args.continueOnError) {
        throw new Error(`Failed to delete card ${cardId}: ${error.message}`);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = errors.length;
  
  return {
    success: failureCount === 0 || args.continueOnError,
    data: {
      results,
      summary: {
        total: args.cardIds.length,
        successful: successCount,
        failed: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    },
    summary: `Deleted ${successCount}/${args.cardIds.length} cards${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
  };
}
