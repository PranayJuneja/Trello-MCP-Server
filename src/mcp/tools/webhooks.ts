import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const createWebhookSchema = z.object({
  callbackURL: z.string().url().describe('The URL that the webhook should POST information to'),
  idModel: z.string().describe('ID of the model (board, card, list, etc.) to monitor for changes'),
  description: z.string().max(16384).optional().describe('Description to be displayed when retrieving webhook information'),
  active: z.boolean().optional().default(true).describe('Whether the webhook is active and sending POST requests'),
  useToken: z.boolean().optional().default(false).describe('Whether to create webhook using token endpoint'),
});

export const listWebhooksSchema = z.object({
  token: z.string().optional().default('current').describe('Token to list webhooks for'),
  activeOnly: z.boolean().optional().default(false).describe('Only return active webhooks'),
});

export const getWebhookSchema = z.object({
  webhookId: z.string().describe('ID of the webhook to retrieve'),
  includeFields: z.array(z.enum(['active', 'callbackURL', 'description', 'idModel'])).optional().describe('Specific fields to include'),
});

export const updateWebhookSchema = z.object({
  webhookId: z.string().describe('ID of the webhook to update'),
  description: z.string().max(16384).optional().describe('New description for the webhook'),
  callbackURL: z.string().url().optional().describe('New callback URL for the webhook'),
  active: z.boolean().optional().describe('Whether the webhook should be active'),
  useToken: z.boolean().optional().default(false).describe('Whether to update webhook using token endpoint'),
  token: z.string().optional().default('current').describe('Token to use for token-based updates'),
});

export const deleteWebhookSchema = z.object({
  webhookId: z.string().describe('ID of the webhook to delete'),
  useToken: z.boolean().optional().default(false).describe('Whether to delete webhook using token endpoint'),
  token: z.string().optional().default('current').describe('Token to use for token-based deletion'),
});

export const testWebhookSchema = z.object({
  webhookId: z.string().describe('ID of the webhook to test'),
  testPayload: z.object({
    action: z.object({
      type: z.string().describe('Type of action to simulate'),
      data: z.record(z.string(), z.any()).describe('Action data'),
    }),
    model: z.record(z.string(), z.any()).describe('Model data'),
  }).optional().describe('Custom test payload to send'),
});

export const getWebhookEventsSchema = z.object({
  modelId: z.string().describe('ID of the model to get webhook events for'),
  eventTypes: z.array(z.string()).optional().describe('Filter by specific event types'),
  startDate: z.string().optional().describe('Start date for event filtering (ISO string)'),
  endDate: z.string().optional().describe('End date for event filtering (ISO string)'),
  limit: z.number().min(1).max(1000).optional().default(100).describe('Maximum number of events to return'),
});

export const createWebhookEventProcessorSchema = z.object({
  name: z.string().min(1).max(255).describe('Name for the event processor'),
  description: z.string().optional().describe('Description of what the processor does'),
  modelIds: z.array(z.string()).min(1).describe('Model IDs to process events for'),
  eventFilters: z.object({
    actionTypes: z.array(z.string()).optional().describe('Filter by specific action types'),
    modelTypes: z.array(z.string()).optional().describe('Filter by specific model types'),
    memberIds: z.array(z.string()).optional().describe('Filter by specific member IDs'),
    excludeOwnActions: z.boolean().optional().default(true).describe('Exclude actions by the webhook owner'),
  }).optional().describe('Filters to apply to incoming events'),
  processors: z.array(z.object({
    type: z.enum([
      'log_event',
      'send_notification',
      'trigger_automation',
      'update_external_system',
      'store_analytics',
      'create_backup',
      'sync_data',
      'validate_data',
    ]).describe('Type of processing to perform'),
    config: z.record(z.string(), z.any()).optional().describe('Configuration for the processor'),
  })).min(1).max(10).describe('Processing steps to execute for matching events'),
  enabled: z.boolean().optional().default(true).describe('Whether the processor is active'),
});

export const updateWebhookEventProcessorSchema = z.object({
  processorId: z.string().describe('ID of the event processor to update'),
  name: z.string().min(1).max(255).optional().describe('New name for the processor'),
  description: z.string().optional().describe('New description'),
  modelIds: z.array(z.string()).optional().describe('New model IDs to process'),
  eventFilters: z.object({
    actionTypes: z.array(z.string()).optional(),
    modelTypes: z.array(z.string()).optional(),
    memberIds: z.array(z.string()).optional(),
    excludeOwnActions: z.boolean().optional(),
  }).optional().describe('New event filters'),
  processors: z.array(z.object({
    type: z.enum([
      'log_event',
      'send_notification',
      'trigger_automation',
      'update_external_system',
      'store_analytics',
      'create_backup',
      'sync_data',
      'validate_data',
    ]),
    config: z.record(z.string(), z.any()).optional(),
  })).optional().describe('New processing steps'),
  enabled: z.boolean().optional().describe('Whether the processor is active'),
});

export const deleteWebhookEventProcessorSchema = z.object({
  processorId: z.string().describe('ID of the event processor to delete'),
});

export const listWebhookEventProcessorsSchema = z.object({
  modelId: z.string().optional().describe('Filter by specific model ID'),
  enabled: z.boolean().optional().describe('Filter by enabled/disabled status'),
  processorType: z.string().optional().describe('Filter by processor type'),
});

export const processWebhookEventSchema = z.object({
  processorId: z.string().describe('ID of the event processor to use'),
  event: z.object({
    action: z.object({
      type: z.string(),
      data: z.record(z.string(), z.any()),
      date: z.string().optional(),
      memberCreator: z.record(z.string(), z.any()).optional(),
    }),
    model: z.record(z.string(), z.any()),
  }).describe('Webhook event data to process'),
  dryRun: z.boolean().optional().default(false).describe('Whether to only simulate the processing'),
});

export const getRealTimeSyncStatusSchema = z.object({
  modelIds: z.array(z.string()).optional().describe('Get status for specific models'),
});

export const enableRealTimeSyncSchema = z.object({
  modelId: z.string().describe('Model ID to enable real-time sync for'),
  syncOptions: z.object({
    bidirectional: z.boolean().optional().default(false).describe('Enable bidirectional sync'),
    conflictResolution: z.enum(['local_wins', 'remote_wins', 'manual']).optional().default('remote_wins').describe('How to resolve sync conflicts'),
    batchInterval: z.number().min(1000).max(300000).optional().default(5000).describe('Batch interval in milliseconds'),
    retryAttempts: z.number().min(1).max(10).optional().default(3).describe('Number of retry attempts'),
  }).optional().describe('Synchronization options'),
});

export const disableRealTimeSyncSchema = z.object({
  modelId: z.string().describe('Model ID to disable real-time sync for'),
});

// ===== IN-MEMORY STORAGE =====
// Note: In a production environment, this would be stored in a database
const webhookEventProcessors = new Map<string, any>();
const webhookEvents: any[] = [];
const realTimeSyncStatus = new Map<string, any>();

// ===== TOOL HANDLERS =====

export async function createWebhook(args: z.infer<typeof createWebhookSchema>, context: McpContext) {
  context.logger.info({ 
    callbackURL: args.callbackURL, 
    idModel: args.idModel,
    useToken: args.useToken 
  }, 'Creating webhook');

  try {
    let webhook;
    
    if (args.useToken) {
      webhook = await trelloClient.createTokenWebhook('current', {
        callbackURL: args.callbackURL,
        idModel: args.idModel,
        description: args.description,
      });
    } else {
      webhook = await trelloClient.createWebhook({
        callbackURL: args.callbackURL,
        idModel: args.idModel,
        description: args.description,
        active: args.active,
      });
    }

    return {
      success: true,
      data: webhook,
      summary: `Created webhook ${webhook.id} for model ${args.idModel}`,
    };
  } catch (error: any) {
    context.logger.error({ error, callbackURL: args.callbackURL, idModel: args.idModel }, 'Failed to create webhook');
    throw error;
  }
}

export async function listWebhooks(args: z.infer<typeof listWebhooksSchema>, context: McpContext) {
  context.logger.info({ token: args.token, activeOnly: args.activeOnly }, 'Listing webhooks');

  try {
    const webhooks = await trelloClient.listWebhooks(args.token);
    
    let filteredWebhooks = webhooks;
    if (args.activeOnly) {
      filteredWebhooks = webhooks.filter(webhook => webhook.active);
    }

    // Sort by webhook ID (newer webhooks typically have higher IDs)
    filteredWebhooks.sort((a, b) => b.id.localeCompare(a.id));

    return {
      success: true,
      data: {
        webhooks: filteredWebhooks,
        summary: {
          total: webhooks.length,
          active: webhooks.filter(w => w.active).length,
          inactive: webhooks.filter(w => !w.active).length,
        },
      },
      summary: `Found ${filteredWebhooks.length} webhooks${args.activeOnly ? ' (active only)' : ''}`,
    };
  } catch (error: any) {
    context.logger.error({ error, token: args.token }, 'Failed to list webhooks');
    throw error;
  }
}

export async function getWebhook(args: z.infer<typeof getWebhookSchema>, context: McpContext) {
  context.logger.info({ webhookId: args.webhookId }, 'Getting webhook details');

  try {
    const webhook = await trelloClient.getWebhook(args.webhookId);
    
    let result: any = webhook;
    
    // If specific fields requested, fetch them individually
    if (args.includeFields && args.includeFields.length > 0) {
      const fieldData: any = {};
      
      for (const field of args.includeFields) {
        try {
          fieldData[field] = await trelloClient.getWebhookField(args.webhookId, field);
        } catch (error) {
          context.logger.warn({ field, error }, 'Failed to fetch webhook field');
          fieldData[field] = null;
        }
      }
      
      result = {
        ...webhook,
        fields: fieldData,
      };
    }

    return {
      success: true,
      data: result,
      summary: `Retrieved webhook ${args.webhookId} for model ${webhook.idModel}`,
    };
  } catch (error: any) {
    context.logger.error({ error, webhookId: args.webhookId }, 'Failed to get webhook');
    throw error;
  }
}

export async function updateWebhook(args: z.infer<typeof updateWebhookSchema>, context: McpContext) {
  context.logger.info({ 
    webhookId: args.webhookId,
    useToken: args.useToken 
  }, 'Updating webhook');

  try {
    const updateData: any = {};
    if (args.description !== undefined) updateData.description = args.description;
    if (args.callbackURL !== undefined) updateData.callbackURL = args.callbackURL;
    if (args.active !== undefined) updateData.active = args.active;

    let webhook;
    
    if (args.useToken) {
      webhook = await trelloClient.updateTokenWebhook(args.token, args.webhookId, updateData);
    } else {
      webhook = await trelloClient.updateWebhook(args.webhookId, updateData);
    }

    return {
      success: true,
      data: webhook,
      summary: `Updated webhook ${args.webhookId}`,
    };
  } catch (error: any) {
    context.logger.error({ error, webhookId: args.webhookId }, 'Failed to update webhook');
    throw error;
  }
}

export async function deleteWebhook(args: z.infer<typeof deleteWebhookSchema>, context: McpContext) {
  context.logger.info({ 
    webhookId: args.webhookId,
    useToken: args.useToken 
  }, 'Deleting webhook');

  try {
    if (args.useToken) {
      await trelloClient.deleteTokenWebhook(args.token, args.webhookId);
    } else {
      await trelloClient.deleteWebhook(args.webhookId);
    }

    return {
      success: true,
      data: { deleted: true, id: args.webhookId },
      summary: `Deleted webhook ${args.webhookId}`,
    };
  } catch (error: any) {
    context.logger.error({ error, webhookId: args.webhookId }, 'Failed to delete webhook');
    throw error;
  }
}

export async function createWebhookEventProcessor(args: z.infer<typeof createWebhookEventProcessorSchema>, context: McpContext) {
  context.logger.info({ name: args.name, modelIds: args.modelIds }, 'Creating webhook event processor');

  const processorId = `processor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const processor = {
    id: processorId,
    ...args,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    processedCount: 0,
    lastProcessed: null,
  };

  webhookEventProcessors.set(processorId, processor);

  return {
    success: true,
    data: processor,
    summary: `Created webhook event processor "${args.name}" for ${args.modelIds.length} models`,
  };
}

export async function updateWebhookEventProcessor(args: z.infer<typeof updateWebhookEventProcessorSchema>, context: McpContext) {
  context.logger.info({ processorId: args.processorId }, 'Updating webhook event processor');

  const processor = webhookEventProcessors.get(args.processorId);
  if (!processor) {
    throw new Error(`Webhook event processor ${args.processorId} not found`);
  }

  const updatedProcessor = {
    ...processor,
    ...args,
    id: args.processorId, // Preserve original ID
    updatedAt: new Date().toISOString(),
  };

  webhookEventProcessors.set(args.processorId, updatedProcessor);

  return {
    success: true,
    data: updatedProcessor,
    summary: `Updated webhook event processor ${args.processorId}`,
  };
}

export async function deleteWebhookEventProcessor(args: z.infer<typeof deleteWebhookEventProcessorSchema>, context: McpContext) {
  context.logger.info({ processorId: args.processorId }, 'Deleting webhook event processor');

  const processor = webhookEventProcessors.get(args.processorId);
  if (!processor) {
    throw new Error(`Webhook event processor ${args.processorId} not found`);
  }

  webhookEventProcessors.delete(args.processorId);

  return {
    success: true,
    data: { deleted: true, id: args.processorId },
    summary: `Deleted webhook event processor ${args.processorId}`,
  };
}

export async function listWebhookEventProcessors(args: z.infer<typeof listWebhookEventProcessorsSchema>, context: McpContext) {
  context.logger.info(args, 'Listing webhook event processors');

  let processors = Array.from(webhookEventProcessors.values());

  if (args.modelId) {
    processors = processors.filter(processor => 
      processor.modelIds.includes(args.modelId)
    );
  }

  if (args.enabled !== undefined) {
    processors = processors.filter(processor => processor.enabled === args.enabled);
  }

  if (args.processorType) {
    processors = processors.filter(processor => 
      processor.processors.some((p: any) => p.type === args.processorType)
    );
  }

  // Sort by creation date (most recent first)
  processors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    success: true,
    data: processors,
    summary: `Found ${processors.length} webhook event processors`,
  };
}

export async function processWebhookEvent(args: z.infer<typeof processWebhookEventSchema>, context: McpContext) {
  context.logger.info({ 
    processorId: args.processorId,
    actionType: args.event.action.type,
    dryRun: args.dryRun 
  }, 'Processing webhook event');

  const processor = webhookEventProcessors.get(args.processorId);
  if (!processor) {
    throw new Error(`Webhook event processor ${args.processorId} not found`);
  }

  if (!processor.enabled) {
    throw new Error(`Webhook event processor ${args.processorId} is disabled`);
  }

  // Check if event matches filters
  if (processor.eventFilters) {
    const filters = processor.eventFilters;
    
    if (filters.actionTypes && !filters.actionTypes.includes(args.event.action.type)) {
      return {
        success: true,
        data: { filtered: true, reason: 'Action type not in filter' },
        summary: `Event filtered out by action type filter`,
      };
    }
    
    if (filters.excludeOwnActions && args.event.action.memberCreator?.id === 'webhook_owner') {
      return {
        success: true,
        data: { filtered: true, reason: 'Own action excluded' },
        summary: `Event filtered out as own action`,
      };
    }
  }

  // Process each processor step
  const results = [];
  
  for (const processorStep of processor.processors) {
    try {
      if (args.dryRun) {
        results.push({
          type: processorStep.type,
          config: processorStep.config,
          simulated: true,
          description: getProcessorDescription(processorStep),
        });
      } else {
        const result = await executeProcessor(processorStep, args.event, context);
        results.push({
          type: processorStep.type,
          config: processorStep.config,
          executed: true,
          result,
        });
      }
    } catch (error: any) {
      results.push({
        type: processorStep.type,
        config: processorStep.config,
        executed: false,
        error: error.message,
      });
    }
  }

  // Update processor tracking
  if (!args.dryRun) {
    processor.lastProcessed = new Date().toISOString();
    processor.processedCount = (processor.processedCount || 0) + 1;
    webhookEventProcessors.set(args.processorId, processor);
    
    // Store event in history
    webhookEvents.push({
      processorId: args.processorId,
      event: args.event,
      results,
      timestamp: new Date().toISOString(),
    });
    
    // Keep only last 1000 events
    if (webhookEvents.length > 1000) {
      webhookEvents.splice(0, webhookEvents.length - 1000);
    }
  }

  return {
    success: true,
    data: {
      processor: processor.name,
      actionType: args.event.action.type,
      results,
      dryRun: args.dryRun,
    },
    summary: `${args.dryRun ? 'Simulated' : 'Processed'} webhook event with ${results.length} processor steps`,
  };
}

export async function enableRealTimeSync(args: z.infer<typeof enableRealTimeSyncSchema>, context: McpContext) {
  context.logger.info({ modelId: args.modelId }, 'Enabling real-time sync');

  const syncConfig = {
    modelId: args.modelId,
    enabled: true,
    ...args.syncOptions,
    enabledAt: new Date().toISOString(),
    lastSync: null,
    syncCount: 0,
  };

  realTimeSyncStatus.set(args.modelId, syncConfig);

  return {
    success: true,
    data: syncConfig,
    summary: `Enabled real-time sync for model ${args.modelId}`,
  };
}

export async function disableRealTimeSync(args: z.infer<typeof disableRealTimeSyncSchema>, context: McpContext) {
  context.logger.info({ modelId: args.modelId }, 'Disabling real-time sync');

  const syncConfig = realTimeSyncStatus.get(args.modelId);
  if (!syncConfig) {
    throw new Error(`Real-time sync not found for model ${args.modelId}`);
  }

  syncConfig.enabled = false;
  syncConfig.disabledAt = new Date().toISOString();
  realTimeSyncStatus.set(args.modelId, syncConfig);

  return {
    success: true,
    data: syncConfig,
    summary: `Disabled real-time sync for model ${args.modelId}`,
  };
}

export async function getRealTimeSyncStatus(args: z.infer<typeof getRealTimeSyncStatusSchema>, context: McpContext) {
  context.logger.info({ modelIds: args.modelIds }, 'Getting real-time sync status');

  let syncStatuses = Array.from(realTimeSyncStatus.values());

  if (args.modelIds && args.modelIds.length > 0) {
    syncStatuses = syncStatuses.filter(status => args.modelIds!.includes(status.modelId));
  }

  // Sort by enabled status and last sync time
  syncStatuses.sort((a, b) => {
    if (a.enabled !== b.enabled) {
      return b.enabled ? 1 : -1; // Enabled first
    }
    return new Date(b.lastSync || 0).getTime() - new Date(a.lastSync || 0).getTime();
  });

  const summary = {
    total: syncStatuses.length,
    enabled: syncStatuses.filter(s => s.enabled).length,
    disabled: syncStatuses.filter(s => !s.enabled).length,
  };

  return {
    success: true,
    data: {
      syncStatuses,
      summary,
    },
    summary: `Found ${syncStatuses.length} real-time sync configurations`,
  };
}

export async function getWebhookEvents(args: z.infer<typeof getWebhookEventsSchema>, context: McpContext) {
  context.logger.info({ modelId: args.modelId }, 'Getting webhook events');

  let events = [...webhookEvents];

  // Filter by model ID
  events = events.filter(event => 
    event.event.model.id === args.modelId || 
    event.event.action.data?.board?.id === args.modelId ||
    event.event.action.data?.card?.idBoard === args.modelId
  );

  // Filter by event types
  if (args.eventTypes && args.eventTypes.length > 0) {
    events = events.filter(event => args.eventTypes!.includes(event.event.action.type));
  }

  // Filter by date range
  if (args.startDate) {
    const startDate = new Date(args.startDate);
    events = events.filter(event => new Date(event.timestamp) >= startDate);
  }

  if (args.endDate) {
    const endDate = new Date(args.endDate);
    events = events.filter(event => new Date(event.timestamp) <= endDate);
  }

  // Sort by timestamp (most recent first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply limit
  events = events.slice(0, args.limit);

  return {
    success: true,
    data: events,
    summary: `Retrieved ${events.length} webhook events for model ${args.modelId}`,
  };
}

// ===== HELPER FUNCTIONS =====

function getProcessorDescription(processor: any): string {
  switch (processor.type) {
    case 'log_event':
      return 'Log event to system logs';
    case 'send_notification':
      return 'Send notification to configured recipients';
    case 'trigger_automation':
      return 'Trigger automation rule execution';
    case 'update_external_system':
      return 'Update external system with event data';
    case 'store_analytics':
      return 'Store event data for analytics';
    case 'create_backup':
      return 'Create backup of affected data';
    case 'sync_data':
      return 'Synchronize data with external systems';
    case 'validate_data':
      return 'Validate data integrity';
    default:
      return `Execute ${processor.type}`;
  }
}

async function executeProcessor(processor: any, event: any, context: McpContext): Promise<any> {
  context.logger.debug({ processorType: processor.type }, 'Executing processor');

  switch (processor.type) {
    case 'log_event':
      context.logger.info({ event }, 'Webhook event logged');
      return { logged: true, timestamp: new Date().toISOString() };

    case 'send_notification':
      // Simulate notification sending
      return { 
        notified: true, 
        recipients: processor.config?.recipients || ['admin'],
        message: `Trello event: ${event.action.type}`,
      };

    case 'trigger_automation':
      // Simulate automation trigger
      return { 
        triggered: true, 
        automationId: processor.config?.automationId || 'default',
        context: event.action.type,
      };

    case 'store_analytics':
      // Simulate analytics storage
      return { 
        stored: true, 
        analyticsId: `analytics_${Date.now()}`,
        eventType: event.action.type,
      };

    default:
      return { 
        executed: true, 
        type: processor.type,
        timestamp: new Date().toISOString(),
      };
  }
}
