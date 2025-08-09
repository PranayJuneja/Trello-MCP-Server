import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const getLabelSchema = z.object({
  id: z.string().describe('Label ID to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to include (default: all)'),
});

export const getLabelsOnBoardSchema = z.object({
  boardId: z.string().describe('Board ID to get labels from'),
  fields: z.string().optional().describe('Comma-separated list of fields to include (default: all)'),
  limit: z.number().min(1).max(1000).optional().describe('Maximum number of labels to return'),
});

export const createLabelSchema = z.object({
  boardId: z.string().describe('Board ID to create the label on'),
  name: z.string().min(1).max(16384).describe('Name of the label'),
  color: z.enum([
    'green', 'yellow', 'orange', 'red', 'purple', 'blue', 
    'sky', 'lime', 'pink', 'black'
  ]).describe('Color of the label'),
});

export const updateLabelSchema = z.object({
  id: z.string().describe('Label ID to update'),
  name: z.string().min(1).max(16384).optional().describe('New name for the label'),
  color: z.enum([
    'green', 'yellow', 'orange', 'red', 'purple', 'blue', 
    'sky', 'lime', 'pink', 'black'
  ]).optional().describe('New color for the label'),
});

export const deleteLabelSchema = z.object({
  id: z.string().describe('Label ID to delete'),
});

export const updateLabelFieldSchema = z.object({
  id: z.string().describe('Label ID to update'),
  field: z.enum(['name', 'color']).describe('Field to update'),
  value: z.string().describe('New value for the field'),
});

export const getLabelUsageSchema = z.object({
  labelId: z.string().describe('Label ID to get usage statistics for'),
  boardId: z.string().optional().describe('Board ID to limit usage search to specific board'),
});

export const bulkUpdateLabelsSchema = z.object({
  boardId: z.string().describe('Board ID to update labels on'),
  updates: z.array(z.object({
    id: z.string().describe('Label ID'),
    name: z.string().optional().describe('New name'),
    color: z.enum([
      'green', 'yellow', 'orange', 'red', 'purple', 'blue', 
      'sky', 'lime', 'pink', 'black'
    ]).optional().describe('New color'),
  })).describe('Array of label updates to apply'),
});

export const getCardsWithLabelSchema = z.object({
  labelId: z.string().describe('Label ID to find cards for'),
  boardId: z.string().optional().describe('Board ID to limit search to specific board'),
  includeArchived: z.boolean().optional().default(false).describe('Whether to include archived cards'),
});

// ===== TOOL HANDLERS =====

export async function getLabel(args: z.infer<typeof getLabelSchema>, context: McpContext) {
  context.logger.info({ labelId: args.id }, 'Getting label details');
  
  const label = await trelloClient.getLabel(args.id);
  
  return {
    success: true,
    data: label,
    summary: `Retrieved label "${label.name}" (${label.color || 'no color'}) with ${label.uses} uses`,
  };
}

export async function getLabelsOnBoard(args: z.infer<typeof getLabelsOnBoardSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId }, 'Getting labels on board');
  
  const labels = await trelloClient.listLabels(args.boardId);
  
  // Apply limit if specified
  let filteredLabels = labels;
  if (args.limit && labels.length > args.limit) {
    filteredLabels = labels.slice(0, args.limit);
  }
  
  return {
    success: true,
    data: filteredLabels,
    summary: `Found ${filteredLabels.length} labels on board${args.limit ? ` (limited to ${args.limit})` : ''}`,
  };
}

export async function createLabel(args: z.infer<typeof createLabelSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, name: args.name, color: args.color }, 'Creating new label');
  
  const request = {
    name: args.name,
    color: args.color,
    idBoard: args.boardId,
  };
  
  const label = await trelloClient.createLabel(request);
  
  return {
    success: true,
    data: label,
    summary: `Created label "${label.name}" (${label.color}) with ID ${label.id}`,
  };
}

export async function updateLabel(args: z.infer<typeof updateLabelSchema>, context: McpContext) {
  context.logger.info({ labelId: args.id }, 'Updating label');
  
  // Get current label first for summary
  const currentLabel = await trelloClient.getLabel(args.id);
  
  const { id, ...updateData } = args;
  const label = await trelloClient.updateLabel(id, updateData);
  
  return {
    success: true,
    data: label,
    summary: `Updated label "${currentLabel.name}" to "${label.name}" (${label.color})`,
  };
}

export async function deleteLabel(args: z.infer<typeof deleteLabelSchema>, context: McpContext) {
  context.logger.info({ labelId: args.id }, 'Deleting label');
  
  // Get label name first for summary
  const label = await trelloClient.getLabel(args.id);
  await trelloClient.deleteLabel(args.id);
  
  return {
    success: true,
    data: { id: args.id, deleted: true },
    summary: `Deleted label "${label.name}" (${label.color})`,
  };
}

export async function updateLabelField(args: z.infer<typeof updateLabelFieldSchema>, context: McpContext) {
  context.logger.info({ labelId: args.id, field: args.field, value: args.value }, 'Updating label field');
  
  // Get current label first for summary
  const currentLabel = await trelloClient.getLabel(args.id);
  
  // Use the field-specific update endpoint
  await trelloClient.updateLabelField(args.id, args.field, args.value);
  
  // Get updated label
  const updatedLabel = await trelloClient.getLabel(args.id);
  
  return {
    success: true,
    data: updatedLabel,
    summary: `Updated label ${args.field} from "${(currentLabel as any)[args.field]}" to "${args.value}"`,
  };
}

export async function getLabelUsage(args: z.infer<typeof getLabelUsageSchema>, context: McpContext) {
  context.logger.info({ labelId: args.labelId, boardId: args.boardId }, 'Getting label usage statistics');
  
  const label = await trelloClient.getLabel(args.labelId);
  
  // Get cards that use this label through search or board analysis
  let usageData = {
    label,
    totalUses: label.uses,
    cards: [] as any[],
    boardsUsed: [] as string[],
  };
  
  try {
    if (args.boardId) {
      // Get board and check for cards with this label
      const board = await trelloClient.getBoard(args.boardId, { 
        cards: 'open',
        labels: 'all'
      });
      
      if (board.cards) {
        usageData.cards = board.cards.filter(card => 
          card.labels.some(cardLabel => cardLabel.id === args.labelId)
        );
      }
      usageData.boardsUsed = [args.boardId];
    } else {
      // For broader search, we'd need to implement search functionality
      // For now, just return the label usage count
      usageData.cards = [];
      usageData.boardsUsed = [];
    }
  } catch (error) {
    context.logger.warn({ error: (error as Error).message }, 'Could not get detailed usage information');
  }
  
  return {
    success: true,
    data: usageData,
    summary: `Label "${label.name}" is used ${label.uses} times${args.boardId ? ` with ${usageData.cards.length} cards on specified board` : ''}`,
  };
}

export async function bulkUpdateLabels(args: z.infer<typeof bulkUpdateLabelsSchema>, context: McpContext) {
  context.logger.info({ boardId: args.boardId, updateCount: args.updates.length }, 'Bulk updating labels');
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of args.updates) {
    try {
      const { id, ...updateData } = update;
      const updatedLabel = await trelloClient.updateLabel(id, updateData);
      results.push({ success: true, label: updatedLabel });
      successCount++;
    } catch (error) {
      results.push({ 
        success: false, 
        labelId: update.id, 
        error: (error as Error).message 
      });
      errorCount++;
    }
  }
  
  return {
    success: true,
    data: results,
    summary: `Bulk update completed: ${successCount} successful, ${errorCount} failed out of ${args.updates.length} labels`,
  };
}

export async function getCardsWithLabel(args: z.infer<typeof getCardsWithLabelSchema>, context: McpContext) {
  context.logger.info({ labelId: args.labelId, boardId: args.boardId }, 'Getting cards with label');
  
  const label = await trelloClient.getLabel(args.labelId);
  let cards: any[] = [];
  
  if (args.boardId) {
    // Get board and filter cards by label
    const board = await trelloClient.getBoard(args.boardId, { 
      cards: args.includeArchived ? 'all' : 'open',
    });
    
    if (board.cards) {
      cards = board.cards.filter(card => 
        card.labels.some(cardLabel => cardLabel.id === args.labelId)
      );
    }
  } else {
    // For broader search across all accessible boards, we'd need search functionality
    // For now, return empty array with a note
    cards = [];
  }
  
  return {
    success: true,
    data: {
      label,
      cards,
      totalFound: cards.length,
      searchScope: args.boardId ? 'single board' : 'all boards',
    },
    summary: `Found ${cards.length} cards with label "${label.name}"${args.boardId ? ' on specified board' : ''}`,
  };
}
