import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { logger, requestLoggerMiddleware } from './utils/logger.js';
import { trelloMcpServer } from './mcp/server.js';
import { createSseHandler, createSseOptionsHandler } from './mcp/transport/httpSse.js';
import { registerAllToolsAndResources } from './mcp/registry.js';

const app: express.Application = express();

// Register MCP tools and resources
registerAllToolsAndResources();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);

// Health check endpoint
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

// MCP SSE endpoint
app.options('/mcp/sse', createSseOptionsHandler());
app.get('/mcp/sse', createSseHandler(trelloMcpServer.getServer()));

// Basic info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Trello MCP Server',
    description: 'Model Context Protocol server for Trello integration',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: '/health',
      mcp: '/mcp/sse',
    },
    auth: {
      type: 'Bearer token',
      header: 'Authorization: Bearer <MCP_API_KEY>',
    },
  });
});

// Error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  req.logger?.error({ error: error.message, stack: error.stack }, 'Unhandled error');
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.requestId,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    requestId: req.requestId,
  });
});

// Start server
const server = app.listen(config.PORT, () => {
  logger.info({
    port: config.PORT,
    baseUrl: config.BASE_URL,
    logLevel: config.LOG_LEVEL,
  }, 'Trello MCP Server started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app };
