/**
 * @fileoverview This module handles the HTTP Server-Sent Events (SSE) transport layer for the Model Context Protocol (MCP) server.
 * It is responsible for establishing and managing SSE connections, handling authentication, and routing messages
 * between the client (e.g., a web UI) and the core MCP server logic. It supports multiple concurrent sessions.
 */
import { Request, Response, Router } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const transportLogger = logger.child({ component: 'SseTransport' });
/** The endpoint path for clients to POST MCP messages to the server. */
const MESSAGE_PATH = '/mcp/sse/message';

/** A map to store active SSE transport instances, keyed by their unique session ID. */
const transportsBySession = new Map<string, SSEServerTransport>();
/** The session ID of the most recently created transport, used as a fallback if a client doesn't specify one. */
let latestSessionId: string | null = null;

/**
 * Extracts a Bearer token from the Authorization header of a request.
 * @param {Request} req - The Express request object.
 * @returns {string | null} The extracted token, or null if the header is missing or invalid.
 */
function getAuthToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.substring(7);
}

/**
 * Registers a new SSE transport instance, storing it in the session map.
 * @param {SSEServerTransport} transport - The transport instance to remember.
 * @returns {string} The session ID of the registered transport.
 */
function rememberTransport(transport: SSEServerTransport): string {
  const sessionId = transport.sessionId;
  transportsBySession.set(sessionId, transport);
  latestSessionId = sessionId;
  transportLogger.info({ sessionId }, 'Registered MCP SSE transport');
  return sessionId;
}

/**
 * Removes an SSE transport instance from the session map upon disconnection.
 * @param {SSEServerTransport} transport - The transport instance to clear.
 */
function clearTransport(transport: SSEServerTransport) {
  const sessionId = transport.sessionId;
  if (transportsBySession.delete(sessionId)) {
    transportLogger.info({ sessionId }, 'Removed MCP SSE transport');
  }
  if (latestSessionId === sessionId) {
    latestSessionId = transportsBySession.size > 0 ? Array.from(transportsBySession.keys()).pop() ?? null : null;
  }
}

/**
 * Retrieves the session ID from an incoming request.
 * It checks the 'sessionId' query parameter first, then the 'mcp-session-id' header.
 * @param {Request} req - The Express request object.
 * @returns {string | null} The found session ID, or null if not present.
 */
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

/**
 * Creates an Express request handler for establishing an MCP SSE connection.
 * This handler manages the entire lifecycle of an SSE connection, including
 * authentication, transport creation, and cleanup on closure or error.
 * @param {Server} mcpServer - The core MCP server instance to connect the transport to.
 * @returns An Express request handler function.
 */
export function createSseHandler(mcpServer: Server) {
  return async (req: Request, res: Response) => {
    const requestLogger = req.logger || logger;

    // Authenticate the request if an API key is configured.
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

      // Create and connect the transport.
      const transport = new SSEServerTransport(MESSAGE_PATH, res);
      await mcpServer.connect(transport);
      const sessionId = rememberTransport(transport);
      (req as Request & { mcpSessionId?: string }).mcpSessionId = sessionId;

      requestLogger.info({ sessionId }, 'MCP SSE connection established');

      // Set up cleanup handlers for when the client disconnects.
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

/**
 * Creates an Express request handler for CORS preflight (OPTIONS) requests to the SSE endpoint.
 * @returns An Express request handler function.
 */
export function createSseOptionsHandler() {
  return (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.status(204).end();
  };
}

/**
 * Registers the routes required for handling incoming MCP messages over HTTP.
 * This includes a POST endpoint for the messages themselves and an OPTIONS endpoint for CORS.
 * @param {Router} router - The Express router to register the routes on.
 */
export function registerSseMessageRoutes(router: Router) {
  // CORS preflight handler for the message endpoint.
  router.options(MESSAGE_PATH, (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.status(204).end();
  });

  // Main handler for receiving MCP messages from the client.
  router.post(MESSAGE_PATH, async (req: Request, res: Response) => {
    // Identify the target session and transport.
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

    // Authenticate the message if an API key is configured.
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

    // Pass the message to the transport for processing.
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
