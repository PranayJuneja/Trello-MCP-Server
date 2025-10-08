/**
 * @fileoverview This module provides a centralized logging solution for the application using the pino logger.
 * It ensures that all log output is directed to stderr, which is crucial for applications
 * that use stdout for data streaming, such as those implementing the Model Context Protocol (MCP).
 * The module also includes middleware for Express to log incoming requests and attach a request-specific logger to each request object.
 */
import pino from 'pino';
import { config } from '../config/env.js';
import crypto from 'crypto';

/**
 * Main application logger instance.
 * IMPORTANT: In MCP stdio mode, stdout must be reserved for protocol messages.
 * To avoid corrupting the stream, we always log to stderr.
 * @type {pino.Logger}
 */
const logger = pino(
  {
    level: config.LOG_LEVEL,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination(2) // fd 2 = stderr
);

export { logger };

/**
 * Creates a child logger with a request ID attached.
 * This is useful for tracing all log entries related to a specific request.
 * @param {string} requestId - The unique identifier for the request.
 * @returns {pino.Logger} A pino logger instance with the requestId bound.
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// Extend Request interface to include logger and requestId
declare global {
  namespace Express {
    interface Request {
      logger: typeof logger;
      requestId: string;
    }
  }
}

/**
 * Middleware for Express to add a request ID and a logger instance to each request object.
 * It also logs the start and completion of each request, including the method, URL, status code, and duration.
 * @param {any} req - The Express request object.
 * @param {any} res - The Express response object.
 * @param {any} next - The next middleware function in the stack.
 */
export function requestLoggerMiddleware(req: any, res: any, next: any) {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  req.logger = createRequestLogger(requestId);
  
  req.logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
  }, 'Request started');
  
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    req.logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    }, 'Request completed');
  });
  
  next();
}
