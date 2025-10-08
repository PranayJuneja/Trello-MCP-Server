/**
 * @fileoverview This module provides handlers for receiving and processing Trello webhooks.
 * It includes functionality for validating webhook signatures, handling Trello's initial
 * verification request (HEAD), processing incoming event payloads (POST), and storing
 * a history of events for debugging and analysis.
 */
import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/env.js';

const webhookLogger = logger.child({ component: 'WebhookHandler' });

/**
 * A simple in-memory array to store the history of received webhook events.
 * Note: In a production environment, this should be replaced with a persistent
 * data store like a database (e.g., Redis, PostgreSQL) to prevent data loss on restart
 * and to manage memory usage effectively.
 * @type {WebhookEvent[]}
 */
const webhookEventHistory: WebhookEvent[] = [];

/**
 * Defines the structure of a processed and stored webhook event.
 */
export interface WebhookEvent {
  /** A unique identifier for the stored event. */
  id: string;
  /** The 'action' object from the Trello webhook payload, containing event details. */
  action: {
    id: string;
    type: string;
    date: string;
    memberCreator: any;
    data: any;
  };
  /** The 'model' object from the Trello webhook payload, representing the Trello entity that changed. */
  model: any;
  /** The ISO timestamp when the event was received by the server. */
  receivedAt: string;
  /** The source IP address of the request. */
  sourceIP?: string;
  /** The User-Agent header from the request. */
  userAgent?: string;
}

/**
 * Creates an Express request handler for processing incoming Trello webhooks.
 * This handler validates requests, processes valid events, and manages event history.
 * @returns {Function} An asynchronous Express request handler.
 */
export function createWebhookHandler() {
  return async (req: Request, res: Response) => {
    const requestId = req.requestId || crypto.randomUUID();
    const eventLogger = webhookLogger.child({ requestId });

    try {
      // Log the incoming webhook for traceability.
      eventLogger.info({
        method: req.method,
        url: req.url,
        headers: req.headers,
        sourceIP: req.ip,
        userAgent: req.get('User-Agent'),
      }, 'Webhook received');

      // Handle HEAD requests, which Trello uses for initial webhook verification.
      if (req.method === 'HEAD') {
        eventLogger.info('Responding to Trello webhook verification');
        res.status(200).end();
        return;
      }

      // Ensure the request method is POST for actual event payloads.
      if (req.method !== 'POST') {
        eventLogger.warn({ method: req.method }, 'Invalid webhook method');
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Validate that the content type is application/json.
      if (!req.is('application/json')) {
        eventLogger.warn({ contentType: req.get('Content-Type') }, 'Invalid content type');
        res.status(400).json({ error: 'Content-Type must be application/json' });
        return;
      }

      // If a secret is configured, validate the HMAC signature of the webhook.
      if (config.WEBHOOK_VERIFICATION_SECRET) {
        const providedSignature = req.get('X-Trello-Webhook');
        if (!providedSignature) {
          eventLogger.warn('Missing webhook signature');
          res.status(401).json({ error: 'Missing webhook signature' });
          return;
        }

        try {
          // Trello uses an HMAC-SHA1 signature.
          const raw = JSON.stringify(req.body);
          const hmac = crypto.createHmac('sha1', config.WEBHOOK_VERIFICATION_SECRET);
          hmac.update(raw, 'utf8');
          const expected = hmac.digest('base64');

          if (providedSignature !== expected) {
            eventLogger.warn({ providedSignature, expected }, 'Invalid webhook signature');
            res.status(401).json({ error: 'Invalid webhook signature' });
            return;
          }
        } catch (e) {
          eventLogger.error({ error: (e as Error).message }, 'Signature verification failed');
          res.status(401).json({ error: 'Signature verification failed' });
          return;
        }
      }

      // Validate the payload structure.
      const payload = req.body;
      if (!payload || !payload.action) {
        eventLogger.warn({ payload }, 'Invalid webhook payload');
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
      }

      // Create a standardized event object for internal use.
      const webhookEvent: WebhookEvent = {
        id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action: payload.action,
        model: payload.model,
        receivedAt: new Date().toISOString(),
        sourceIP: req.ip,
        userAgent: req.get('User-Agent'),
      };

      // Store the event and manage history size.
      webhookEventHistory.push(webhookEvent);
      if (webhookEventHistory.length > 1000) {
        webhookEventHistory.splice(0, webhookEventHistory.length - 1000);
      }

      eventLogger.info({
        webhookId: webhookEvent.id,
        actionType: payload.action.type,
        actionId: payload.action.id,
        modelId: payload.model?.id,
        memberCreator: payload.action.memberCreator?.username,
      }, 'Webhook event processed');

      // Pass the event to the main processing logic.
      await processWebhookEvent(webhookEvent, eventLogger);

      // Respond to Trello with a success message.
      res.status(200).json({
        success: true,
        eventId: webhookEvent.id,
        processed: true,
        timestamp: webhookEvent.receivedAt,
      });

    } catch (error: any) {
      eventLogger.error({ error }, 'Webhook processing failed');
      
      // Send a generic error response to avoid leaking internal details.
      res.status(500).json({
        success: false,
        error: 'Internal webhook processing error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Creates an Express request handler for CORS preflight (OPTIONS) requests.
 * @returns {Function} An Express request handler.
 */
export function createWebhookOptionsHandler() {
  return (req: Request, res: Response) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Trello-Webhook',
      'Access-Control-Max-Age': '86400',
    });
    res.status(200).end();
  };
}

/**
 * Contains the core business logic for processing a validated webhook event.
 * This function is designed to be extended with application-specific logic.
 * @param {WebhookEvent} event - The webhook event to process.
 * @param {typeof webhookLogger} logger - A logger instance for this event.
 * @throws {Error} Throws an error if processing fails.
 */
async function processWebhookEvent(event: WebhookEvent, logger: typeof webhookLogger) {
  try {
    logger.debug({
      eventId: event.id,
      actionType: event.action.type,
    }, 'Processing webhook event');

    // Placeholder for business logic:
    // - Trigger automation rules based on the event
    // - Update real-time sync status
    // - Send notifications to other systems
    // - Update analytics dashboards

    const eventCategory = categorizeWebhookEvent(event);
    logger.info({
      eventId: event.id,
      category: eventCategory,
      actionType: event.action.type,
    }, 'Webhook event categorized');

    if (isRealTimeSyncEnabled(event.model?.id)) {
      await handleRealTimeSync(event, logger);
    }

  } catch (error: any) {
    logger.error({
      error,
      eventId: event.id,
      actionType: event.action.type,
    }, 'Failed to process webhook event');
    throw error;
  }
}

/**
 * Categorizes a webhook event based on its action type.
 * @param {WebhookEvent} event - The webhook event.
 * @returns {string} A string representing the event category.
 */
function categorizeWebhookEvent(event: WebhookEvent): string {
  const actionType = event.action.type;
  
  if (actionType.includes('Card')) return 'card_operation';
  if (actionType.includes('List')) return 'list_operation';
  if (actionType.includes('Board')) return 'board_operation';
  if (actionType.includes('Member')) return 'member_operation';
  if (actionType.includes('Comment')) return 'comment_operation';
  if (actionType.includes('Checklist')) return 'checklist_operation';
  if (actionType.includes('Attachment')) return 'attachment_operation';
  return 'other_operation';
}

/**
 * Placeholder function to check if real-time sync is enabled for a given model.
 * In a real application, this would check against a configuration database.
 * @param {string} [modelId] - The ID of the Trello model (e.g., board ID).
 * @returns {boolean} Always returns false in this placeholder implementation.
 */
function isRealTimeSyncEnabled(modelId?: string): boolean {
  // NOTE: This is a placeholder. A real implementation would query a config source.
  return false;
}

/**
 * Placeholder function for handling real-time synchronization logic.
 * @param {WebhookEvent} event - The event that triggered the sync.
 * @param {typeof webhookLogger} logger - A logger instance.
 */
async function handleRealTimeSync(event: WebhookEvent, logger: typeof webhookLogger) {
  try {
    logger.info({
      eventId: event.id,
      modelId: event.model?.id,
      actionType: event.action.type,
    }, 'Handling real-time sync');

    // Placeholder for actual sync logic:
    // - Update local cache/database
    // - Propagate changes to subscribed clients via SSE or WebSockets
    // - Handle potential conflicts

    logger.debug({ eventId: event.id }, 'Real-time sync completed (placeholder)');

  } catch (error: any) {
    logger.error({
      error,
      eventId: event.id,
      modelId: event.model?.id,
    }, 'Real-time sync failed');
    throw error;
  }
}

/**
 * Retrieves the recent history of webhook events.
 * @param {number} [limit=100] - The maximum number of events to return.
 * @returns {WebhookEvent[]} An array of webhook events, sorted from most to least recent.
 */
export function getWebhookEventHistory(limit = 100): WebhookEvent[] {
  return webhookEventHistory
    .slice(-limit)
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

/**
 * Retrieves webhook events related to a specific Trello model (e.g., a board or card).
 * @param {string} modelId - The ID of the Trello model to filter by.
 * @param {number} [limit=100] - The maximum number of events to return.
 * @returns {WebhookEvent[]} An array of matching webhook events, sorted by time.
 */
export function getWebhookEventsByModel(modelId: string, limit = 100): WebhookEvent[] {
  return webhookEventHistory
    .filter(event => 
      event.model?.id === modelId ||
      event.action.data?.board?.id === modelId ||
      event.action.data?.card?.idBoard === modelId
    )
    .slice(-limit)
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

/**
 * Retrieves webhook events of a specific action type.
 * @param {string} actionType - The action type to filter by (e.g., 'updateCard').
 * @param {number} [limit=100] - The maximum number of events to return.
 * @returns {WebhookEvent[]} An array of matching webhook events, sorted by time.
 */
export function getWebhookEventsByAction(actionType: string, limit = 100): WebhookEvent[] {
  return webhookEventHistory
    .filter(event => event.action.type === actionType)
    .slice(-limit)
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}
