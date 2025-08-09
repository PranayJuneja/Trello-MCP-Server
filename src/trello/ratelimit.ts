import Bottleneck from 'bottleneck';
import { logger } from '../utils/logger.js';
import { TrelloHttpError } from './http.js';

// Trello API rate limits:
// - 100 requests per 10 seconds per API key
// - 300 requests per 10 seconds per token
// We'll be conservative and use the API key limit as our baseline

const trelloLogger = logger.child({ component: 'TrelloRateLimit' });

// Create rate limiter for Trello API
export const trelloRateLimiter = new Bottleneck({
  // Allow 100 requests per 10 seconds, but spread them out
  maxConcurrent: 5, // Max 5 concurrent requests
  minTime: 100, // Minimum 100ms between requests
  reservoir: 80, // Start with 80 requests available (buffer)
  reservoirRefreshAmount: 80, // Refresh with 80 requests
  reservoirRefreshInterval: 10 * 1000, // Every 10 seconds
  
  // Retry configuration
  retryDelayOptions: {
    base: 300,
    max: 30000,
  },
});

// Handle rate limit events
trelloRateLimiter.on('failed', async (error, jobInfo) => {
  const isRateLimitError = error instanceof TrelloHttpError && error.statusCode === 429;
  
  if (isRateLimitError) {
    trelloLogger.warn({
      retryCount: jobInfo.retryCount,
      options: jobInfo.options,
    }, 'Rate limit hit, retrying...');
    
    // Return retry delay for 429 errors
    if (jobInfo.retryCount < 3) {
      // Exponential backoff: 1s, 4s, 16s
      const delay = Math.pow(4, jobInfo.retryCount) * 1000;
      return delay;
    }
  }
  
  // Don't retry for other errors
  return null;
});

trelloRateLimiter.on('retry', (error, jobInfo) => {
  trelloLogger.info({
    retryCount: jobInfo.retryCount,
    delay: jobInfo.retryCount,
    error: (error as any)?.message || String(error),
  }, 'Retrying Trello API request');
});

trelloRateLimiter.on('depleted', () => {
  trelloLogger.warn('Rate limit reservoir depleted, requests will be queued');
});

trelloRateLimiter.on('dropped', (dropped) => {
  trelloLogger.error({
    dropped,
  }, 'Request dropped due to rate limiting');
});

// Utility function to wrap API calls with rate limiting
export async function withRateLimit<T>(
  operation: () => Promise<T>,
  priority = 5 // Default priority (1-10, higher = more important)
): Promise<T> {
  return trelloRateLimiter.schedule({ priority }, operation);
}

// High priority wrapper for critical operations
export async function withHighPriorityRateLimit<T>(
  operation: () => Promise<T>
): Promise<T> {
  return withRateLimit(operation, 9);
}

// Low priority wrapper for bulk operations
export async function withLowPriorityRateLimit<T>(
  operation: () => Promise<T>
): Promise<T> {
  return withRateLimit(operation, 2);
}
