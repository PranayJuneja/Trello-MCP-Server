/**
 * @fileoverview This file defines a suite of tools for performing batch and bulk operations in Trello.
 * These tools are designed to improve efficiency by combining multiple individual actions into
 * a single tool call, reducing the number of round trips to the Trello API.
 * Each tool includes a Zod schema for robust input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for executing multiple GET requests in a single batch call.
 */
export const batchGetRequestsSchema = z.object({
  urls: z.array(z.string()).min(1).max(10).describe('An array of up to 10 API routes to fetch. Routes must start with a `/`.'),
});

/**
 * Schema for creating multiple cards in a single operation.
 */
export const batchCreateCardsSchema = z.object({
  cards: z.array(z.object({
    name: z.string().min(1).describe('The name of the card to create.'),
    idList: z.string().describe('The ID of the list where the card should be created.'),
    desc: z.string().optional().describe('A description for the card.'),
    idMembers: z.array(z.string()).optional().describe('An array of member IDs to assign to the card.'),
    idLabels: z.array(z.string()).optional().describe('An array of label IDs to apply to the card.'),
  })).min(1).max(20).describe('An array of up to 20 card objects to create.'),
  continueOnError: z.boolean().optional().default(false).describe('If true, continues processing even if one card creation fails.'),
});

/**
 * Schema for updating multiple cards in a single operation.
 */
export const batchUpdateCardsSchema = z.object({
  updates: z.array(z.object({
    cardId: z.string().describe('The ID of the card to update.'),
    updates: z.object({
      name: z.string().optional().describe('A new name for the card.'),
      desc: z.string().optional().describe('A new description for the card.'),
      closed: z.boolean().optional().describe('Set to true to archive the card.'),
      idList: z.string().optional().describe('The ID of a new list to move the card to.'),
    }).describe('The update payload for the card.'),
  })).min(1).max(20).describe('An array of up to 20 card updates.'),
  continueOnError: z.boolean().optional().default(false).describe('If true, continues processing even if one card update fails.'),
});

/**
 * Schema for archiving all cards in a specific list.
 */
export const archiveAllCardsInListSchema = z.object({
  listId: z.string().describe('The ID of the list from which to archive all cards.'),
});

/**
 * Schema for moving all cards from one list to another.
 */
export const moveAllCardsInListSchema = z.object({
  sourceListId: z.string().describe('The ID of the list to move cards from.'),
  targetListId: z.string().describe('The ID of the list to move cards to.'),
  targetBoardId: z.string().optional().describe('Required if moving cards to a different board.'),
});

// ===== TOOL HANDLERS =====

/**
 * Executes a batch of GET requests to the Trello API.
 * @param {z.infer<typeof batchGetRequestsSchema>} args - The URLs to fetch.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the results of the batch request.
 */
export async function batchGetRequests(args: z.infer<typeof batchGetRequestsSchema>, context: McpContext) {
  context.logger.info({ urlCount: args.urls.length }, 'Executing batch GET requests');
  const invalidUrls = args.urls.filter(url => !url.startsWith('/'));
  if (invalidUrls.length > 0) {
    throw new Error(`Invalid URL format. URLs must start with '/': ${invalidUrls.join(', ')}`);
  }
  const results = await trelloClient.batch<any>(args.urls);
  return {
    success: true,
    data: results,
    summary: `Executed ${args.urls.length} batch requests.`,
  };
}

/**
 * Creates multiple Trello cards in a batch operation.
 * @param {z.infer<typeof batchCreateCardsSchema>} args - The details of the cards to create.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the results of the creation process.
 */
export async function batchCreateCards(args: z.infer<typeof batchCreateCardsSchema>, context: McpContext) {
  context.logger.info({ cardCount: args.cards.length }, 'Creating multiple cards in batch');
  const results = [];
  for (const cardData of args.cards) {
    try {
      const card = await trelloClient.createCard(cardData);
      results.push({ success: true, cardId: card.id, name: card.name });
    } catch (error: any) {
      results.push({ success: false, name: cardData.name, error: error.message });
      if (!args.continueOnError) {
        throw new Error(`Failed to create card "${cardData.name}": ${error.message}`);
      }
    }
  }
  const successCount = results.filter(r => r.success).length;
  return {
    success: successCount > 0,
    data: results,
    summary: `Successfully created ${successCount} out of ${args.cards.length} cards.`,
  };
}

/**
 * Updates multiple Trello cards in a batch operation.
 * @param {z.infer<typeof batchUpdateCardsSchema>} args - The card updates to perform.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the results of the update process.
 */
export async function batchUpdateCards(args: z.infer<typeof batchUpdateCardsSchema>, context: McpContext) {
  context.logger.info({ updateCount: args.updates.length }, 'Updating multiple cards in batch');
  const results = [];
  for (const update of args.updates) {
    try {
      await trelloClient.updateCard(update.cardId, update.updates);
      results.push({ success: true, cardId: update.cardId });
    } catch (error: any) {
      results.push({ success: false, cardId: update.cardId, error: error.message });
      if (!args.continueOnError) {
        throw new Error(`Failed to update card "${update.cardId}": ${error.message}`);
      }
    }
  }
  const successCount = results.filter(r => r.success).length;
  return {
    success: successCount > 0,
    data: results,
    summary: `Successfully updated ${successCount} out of ${args.updates.length} cards.`,
  };
}

/**
 * Archives all cards currently in a specified list.
 * @param {z.infer<typeof archiveAllCardsInListSchema>} args - The ID of the list.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
export async function archiveAllCardsInList(args: z.infer<typeof archiveAllCardsInListSchema>, context: McpContext) {
  context.logger.info({ listId: args.listId }, 'Archiving all cards in list');
  await trelloClient.archiveAllCardsInList(args.listId);
  return {
    success: true,
    summary: `Successfully initiated archival of all cards in list ${args.listId}.`,
  };
}

/**
 * Moves all cards from a source list to a target list.
 * @param {z.infer<typeof moveAllCardsInListSchema>} args - The source and target list IDs.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a success message.
 */
export async function moveAllCardsInList(args: z.infer<typeof moveAllCardsInListSchema>, context: McpContext) {
  context.logger.info({ from: args.sourceListId, to: args.targetListId }, 'Moving all cards between lists');
  await trelloClient.moveAllCardsInList(args.sourceListId, args.targetListId, args.targetBoardId);
  return {
    success: true,
    summary: `Successfully initiated moving all cards from list ${args.sourceListId} to ${args.targetListId}.`,
  };
}
