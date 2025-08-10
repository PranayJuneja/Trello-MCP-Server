import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/env.js';

const webhookLogger = logger.child({ component: 'WebhookHandler' });

// In-memory storage for webhook events (in production, use a database)
const webhookEventHistory: any[] = [];

export interface WebhookEvent {
  id: string;
  action: {
    id: string;
    type: string;
    date: string;
    memberCreator: any;
    data: any;
  };
  model: any;
  receivedAt: string;
  sourceIP?: string;
  userAgent?: string;
}

export function createWebhookHandler() {
  return async (req: Request, res: Response) => {
    const requestId = req.requestId || crypto.randomUUID();
    const eventLogger = webhookLogger.child({ requestId });

    try {
      // Log the incoming webhook
      eventLogger.info({
        method: req.method,
        url: req.url,
        headers: req.headers,
        sourceIP: req.ip,
        userAgent: req.get('User-Agent'),
      }, 'Webhook received');

      // Handle HEAD requests (Trello verification)
      if (req.method === 'HEAD') {
        eventLogger.info('Responding to Trello webhook verification');
        res.status(200).end();
        return;
      }

      // Validate request method
      if (req.method !== 'POST') {
        eventLogger.warn({ method: req.method }, 'Invalid webhook method');
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Validate content type
      if (!req.is('application/json')) {
        eventLogger.warn({ contentType: req.get('Content-Type') }, 'Invalid content type');
        res.status(400).json({ error: 'Content-Type must be application/json' });
        return;
      }

      // Validate webhook signature (HMAC of raw body with secret), if configured
      if (config.WEBHOOK_VERIFICATION_SECRET) {
        const providedSignature = req.get('X-Trello-Webhook');
        if (!providedSignature) {
          eventLogger.warn('Missing webhook signature');
          res.status(401).json({ error: 'Missing webhook signature' });
          return;
        }

        try {
          // Compute HMAC SHA1 of the raw body string using secret (Trello sends SHA1)
          // Note: We depend on express.json() already parsed body; we re-stringify deterministically.
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

      // Parse webhook payload
      const payload = req.body;
      if (!payload || !payload.action) {
        eventLogger.warn({ payload }, 'Invalid webhook payload');
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
      }

      // Create webhook event
      const webhookEvent: WebhookEvent = {
        id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action: payload.action,
        model: payload.model,
        receivedAt: new Date().toISOString(),
        sourceIP: req.ip,
        userAgent: req.get('User-Agent'),
      };

      // Store event in history
      webhookEventHistory.push(webhookEvent);
      
      // Keep only last 1000 events to prevent memory issues
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

      // Process the webhook event
      await processWebhookEvent(webhookEvent, eventLogger);

      // Respond with success
      res.status(200).json({
        success: true,
        eventId: webhookEvent.id,
        processed: true,
        timestamp: webhookEvent.receivedAt,
      });

    } catch (error: any) {
      eventLogger.error({ error }, 'Webhook processing failed');
      
      // Respond with error but don't leak internal details
      res.status(500).json({
        success: false,
        error: 'Internal webhook processing error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

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

async function processWebhookEvent(event: WebhookEvent, logger: typeof webhookLogger) {
  try {
    // Log event details
    logger.debug({
      eventId: event.id,
      actionType: event.action.type,
      actionData: event.action.data,
      model: event.model,
    }, 'Processing webhook event');

    // Here you could:
    // 1. Trigger automation rules based on the event
    // 2. Update real-time sync status
    // 3. Send notifications
    // 4. Update analytics
    // 5. Forward to external systems

    // Example: Basic event categorization
    const eventCategory = categorizeWebhookEvent(event);
    logger.info({
      eventId: event.id,
      category: eventCategory,
      actionType: event.action.type,
    }, 'Webhook event categorized');

    // Example: Update real-time sync if enabled
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

function categorizeWebhookEvent(event: WebhookEvent): string {
  const actionType = event.action.type;
  
  if (actionType.includes('Card')) {
    return 'card_operation';
  } else if (actionType.includes('List')) {
    return 'list_operation';
  } else if (actionType.includes('Board')) {
    return 'board_operation';
  } else if (actionType.includes('Member')) {
    return 'member_operation';
  } else if (actionType.includes('Comment')) {
    return 'comment_operation';
  } else if (actionType.includes('Checklist')) {
    return 'checklist_operation';
  } else if (actionType.includes('Attachment')) {
    return 'attachment_operation';
  } else {
    return 'other_operation';
  }
}

function isRealTimeSyncEnabled(modelId?: string): boolean {
  // This would check against stored real-time sync configuration
  // For now, return false as a placeholder
  return false;
}

async function handleRealTimeSync(event: WebhookEvent, logger: typeof webhookLogger) {
  try {
    logger.info({
      eventId: event.id,
      modelId: event.model?.id,
      actionType: event.action.type,
    }, 'Handling real-time sync');

    // Here you would implement actual sync logic:
    // 1. Update local cache/database
    // 2. Propagate changes to subscribed clients
    // 3. Handle conflict resolution
    // 4. Update sync status

    // Placeholder implementation
    const syncResult = {
      synced: true,
      modelId: event.model?.id,
      actionType: event.action.type,
      timestamp: new Date().toISOString(),
    };

    logger.debug({ syncResult }, 'Real-time sync completed');

  } catch (error: any) {
    logger.error({
      error,
      eventId: event.id,
      modelId: event.model?.id,
    }, 'Real-time sync failed');
    throw error;
  }
}

// Export function to get webhook event history
export function getWebhookEventHistory(limit = 100): WebhookEvent[] {
  return webhookEventHistory
    .slice(-limit)
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

// Export function to get webhook events by model ID
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

// Export function to get webhook events by action type
export function getWebhookEventsByAction(actionType: string, limit = 100): WebhookEvent[] {
  return webhookEventHistory
    .filter(event => event.action.type === actionType)
    .slice(-limit)
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}
