/**
 * @fileoverview This is the main entry point for the Trello MCP (Model Context Protocol) server.
 * It sets up an Express application, configures middleware, defines API endpoints,
 * registers all MCP tools and resources, and handles server startup and graceful shutdown.
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { logger, requestLoggerMiddleware } from './utils/logger.js';
import { trelloMcpServer } from './mcp/server.js';
import { createSseHandler, createSseOptionsHandler, registerSseMessageRoutes } from './mcp/transport/httpSse.js';
import { createWebhookHandler, createWebhookOptionsHandler } from './mcp/transport/webhookHandler.js';
import { registerAllToolsAndResources } from './mcp/registry.js';

/**
 * The main Express application instance.
 * @type {express.Application}
 */
const app: express.Application = express();

// Register all MCP tools and resources with the server.
// This function is called once on startup to populate the server's capabilities.
registerAllToolsAndResources();

// ===== MIDDLEWARE SETUP =====
// Enable CORS for all routes.
app.use(cors());
// Parse incoming JSON requests.
app.use(express.json());
// Add a logger to each request for tracing.
app.use(requestLoggerMiddleware);

// ===== MCP SSE TRANSPORT ROUTES =====
// Register the routes required for the MCP Server-Sent Events (SSE) transport.
// This includes an endpoint for clients to post messages to the server.
registerSseMessageRoutes(app);

// ===== API ENDPOINTS =====

/**
 * Health check endpoint.
 * Provides a simple status check to confirm the server is running and to get basic environment information.
 * @route GET /health
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: {
      node: process.version,
      platform: process.platform,
    },
  });
});

/**
 * MCP Server-Sent Events (SSE) endpoint.
 * This is the main endpoint for establishing a persistent MCP connection.
 * @route GET /mcp/sse
 */
app.options('/mcp/sse', createSseOptionsHandler());
app.get('/mcp/sse', createSseHandler(trelloMcpServer.getServer()));

/**
 * Trello webhook endpoint.
 * This endpoint is responsible for receiving and processing incoming webhooks from Trello.
 * It handles the initial HEAD request for verification and POST requests for event payloads.
 * @route POST /webhooks/trello
 * @route HEAD /webhooks/trello
 */
app.options('/webhooks/trello', createWebhookOptionsHandler());
app.post('/webhooks/trello', createWebhookHandler());
app.head('/webhooks/trello', createWebhookHandler());

/**
 * Root endpoint.
 * Provides basic information about the server and its available endpoints.
 * @route GET /
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Trello MCP Server',
    description: 'Model Context Protocol server for Trello integration',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: '/health',
      mcp: '/mcp/sse',
      webhooks: '/webhooks/trello',
    },
    auth: {
      type: 'Bearer token',
      header: 'Authorization: Bearer <MCP_API_KEY>',
    },
  });
});

// ===== ERROR HANDLING =====

/**
 * Global error handler middleware.
 * Catches any unhandled errors that occur during request processing and sends a generic 500 response.
 */
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  req.logger?.error({ error: error.message, stack: error.stack }, 'Unhandled error');
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.requestId,
  });
});

/**
 * 404 Not Found handler.
 * This middleware is triggered if no other route matches the incoming request.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    requestId: req.requestId,
  });
});

// ===== SERVER STARTUP =====

/**
 * The main HTTP server instance.
 */
const server = app.listen(config.PORT, () => {
  logger.info({
    port: config.PORT,
    baseUrl: config.BASE_URL,
    logLevel: config.LOG_LEVEL,
  }, 'Trello MCP Server started');
});

// ===== GRACEFUL SHUTDOWN =====

/**
 * Handles the SIGTERM signal for graceful shutdown (e.g., from Docker or Kubernetes).
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

/**
 * Handles the SIGINT signal for graceful shutdown (e.g., from Ctrl+C).
 */
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app };
