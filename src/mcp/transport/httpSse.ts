import { Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const transportLogger = logger.child({ component: 'SseTransport' });

export function createSseHandler(mcpServer: Server) {
  return async (req: Request, res: Response) => {
    const requestLogger = req.logger || logger;
    
    // Verify API key if configured; allow open access when MCP_API_KEY is empty
    if (config.MCP_API_KEY && config.MCP_API_KEY.length > 0) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        requestLogger.warn('Missing or invalid authorization header');
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }
      const token = authHeader.substring(7);
      if (token !== config.MCP_API_KEY) {
        requestLogger.warn('Invalid API key');
        return res.status(401).json({ error: 'Invalid API key' });
      }
    } else {
      requestLogger.warn('MCP_API_KEY not set; allowing unauthenticated SSE connection');
    }

    try {
      requestLogger.info('Starting SSE MCP connection');

      // Create SSE transport
      const transport = new SSEServerTransport('/message', res);
      
      // Connect the MCP server to the transport
      await mcpServer.connect(transport);

      requestLogger.info('MCP SSE connection established');

      // Handle client disconnect
      req.on('close', () => {
        requestLogger.info('MCP SSE connection closed');
        transport.close();
      });

      req.on('error', (error) => {
        requestLogger.error({ error: error.message }, 'MCP SSE connection error');
        transport.close();
      });

    } catch (error) {
      requestLogger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to establish MCP SSE connection');
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to establish MCP connection',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  };
}

export function createSseOptionsHandler() {
  return (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.status(204).end();
  };
}
