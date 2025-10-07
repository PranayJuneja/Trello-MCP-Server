import { Request, Response, Router } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const transportLogger = logger.child({ component: 'SseTransport' });
const MESSAGE_PATH = '/mcp/sse/message';

let currentTransport: SSEServerTransport | null = null;

function getAuthToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.substring(7);
}

function clearCurrentTransport(transport: SSEServerTransport) {
  if (currentTransport === transport) {
    currentTransport = null;
  }
}

export function createSseHandler(mcpServer: Server) {
  return async (req: Request, res: Response) => {
    const requestLogger = req.logger || logger;

    if (config.MCP_API_KEY && config.MCP_API_KEY.length > 0) {
      const token = getAuthToken(req);
      if (!token) {
        requestLogger.warn('Missing or invalid authorization header');
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      if (token !== config.MCP_API_KEY) {
        requestLogger.warn('Invalid API key');
        return res.status(401).json({ error: 'Invalid API key' });
      }
    } else {
      requestLogger.warn('MCP_API_KEY not set; allowing unauthenticated SSE connection');
    }

    try {
      requestLogger.info('Starting SSE MCP connection');

      if (currentTransport) {
        transportLogger.warn('Closing existing MCP SSE transport before creating a new one');
        currentTransport.close();
        currentTransport = null;
      }

      const transport = new SSEServerTransport(MESSAGE_PATH, res);
      await mcpServer.connect(transport);
      currentTransport = transport;

      requestLogger.info('MCP SSE connection established');

      req.on('close', () => {
        requestLogger.info('MCP SSE connection closed');
        clearCurrentTransport(transport);
        transport.close();
      });

      req.on('error', (error) => {
        requestLogger.error({ error: error.message }, 'MCP SSE connection error');
        clearCurrentTransport(transport);
        transport.close();
      });
    } catch (error) {
      requestLogger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Failed to establish MCP SSE connection'
      );

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to establish MCP connection',
          details: error instanceof Error ? error.message : String(error),
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

export function registerSseMessageRoutes(router: Router) {
  router.options(MESSAGE_PATH, (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.status(204).end();
  });

  router.post(MESSAGE_PATH, async (req: Request, res: Response) => {
    if (!currentTransport) {
      transportLogger.warn('Received MCP message without active transport');
      return res.status(400).json({ error: 'MCP transport not initialized' });
    }

    if (config.MCP_API_KEY && config.MCP_API_KEY.length > 0) {
      const token = getAuthToken(req);
      if (!token) {
        transportLogger.warn('Missing or invalid authorization header for MCP message');
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      if (token !== config.MCP_API_KEY) {
        transportLogger.warn('Invalid API key for MCP message');
        return res.status(401).json({ error: 'Invalid API key' });
      }
    }

    try {
      await currentTransport.handlePostMessage(req, res);
    } catch (error) {
      transportLogger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Failed to handle MCP message'
      );

      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to handle MCP message' });
      }
    }
  });
}
