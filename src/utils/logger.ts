import pino from 'pino';
import { config } from '../config/env.js';
import crypto from 'crypto';

// IMPORTANT: In MCP stdio mode, stdout must be reserved for protocol messages.
// To avoid corrupting the stream, we always log to stderr.
const logger = pino(
  {
    level: config.LOG_LEVEL,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination(2) // fd 2 = stderr
);

export { logger };

// Create a child logger with request context
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

// Middleware to add request ID and logger to Express requests
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
