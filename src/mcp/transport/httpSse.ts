import { Request, Response, Router } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const transportLogger = logger.child({ component: 'SseTransport' });
const MESSAGE_PATH = '/mcp/sse/message';

const transportsBySession = new Map<string, SSEServerTransport>();
let latestSessionId: string | null = null;

function getAuthToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.substring(7);
}

function rememberTransport(transport: SSEServerTransport) {
  const sessionId = transport.sessionId;
  transportsBySession.set(sessionId, transport);
  latestSessionId = sessionId;
  transportLogger.info({ sessionId }, 'Registered MCP SSE transport');
  return sessionId;
}

function clearTransport(transport: SSEServerTransport) {
  const sessionId = transport.sessionId;
  if (transportsBySession.delete(sessionId)) {
    transportLogger.info({ sessionId }, 'Removed MCP SSE transport');
  }
  if (latestSessionId === sessionId) {
    latestSessionId = transportsBySession.size > 0 ? Array.from(transportsBySession.keys()).pop() ?? null : null;
  }
}

function getSessionIdFromRequest(req: Request): string | null {
  const queryId = typeof req.query.sessionId === 'string' ? req.query.sessionId : null;
  if (queryId) {
    return queryId;
  }
  const headerId = req.headers['mcp-session-id'];
  if (Array.isArray(headerId)) {
    return headerId[0] ?? null;
  }
  if (typeof headerId === 'string') {
    return headerId;
  }
  return null;
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

      const transport = new SSEServerTransport(MESSAGE_PATH, res);
      await mcpServer.connect(transport);
      const sessionId = rememberTransport(transport);
      (req as Request & { mcpSessionId?: string }).mcpSessionId = sessionId;

      requestLogger.info({ sessionId }, 'MCP SSE connection established');

      req.on('close', () => {
        requestLogger.info({ sessionId }, 'MCP SSE connection closed');
        clearTransport(transport);
        transport.close();
      });

      req.on('error', (error) => {
        requestLogger.error({ sessionId, error: error.message }, 'MCP SSE connection error');
        clearTransport(transport);
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
    const requestedSessionId = getSessionIdFromRequest(req) ?? latestSessionId;
    if (!requestedSessionId) {
      transportLogger.warn('Received MCP message without a session identifier');
      return res.status(400).json({ error: 'MCP session not initialized' });
    }

    const transport = transportsBySession.get(requestedSessionId);
    if (!transport) {
      transportLogger.warn({ sessionId: requestedSessionId }, 'No active transport for session');
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
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      transportLogger.error(
        { sessionId: requestedSessionId, error: error instanceof Error ? error.message : String(error) },
        'Failed to handle MCP message'
      );

      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to handle MCP message' });
      }
    }
  });
}
