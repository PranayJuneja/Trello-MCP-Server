/**
 * @fileoverview This module implements a sophisticated rate-limiting mechanism for the Trello API
 * using the `bottleneck` library. It ensures that all API requests adhere to Trello's rate limits,
 * preventing 429 "Too Many Requests" errors. It provides a primary rate limiter instance,
 * event listeners for logging and handling rate limit events (like retries and failures),
 * and wrapper functions to easily apply rate limiting with different priorities to API calls.
 */
import Bottleneck from 'bottleneck';
import { logger } from '../utils/logger.js';
import { TrelloHttpError } from './http.js';

// Trello API rate limits documentation:
// - 100 requests per 10 seconds per API key
// - 300 requests per 10 seconds per token
// This implementation conservatively adheres to the API key limit.

const trelloLogger = logger.child({ component: 'TrelloRateLimit' });

/**
 * The core rate limiter instance for all Trello API requests.
 * It is configured to be conservative, allowing a steady flow of requests
 * without hitting the Trello API's hard limits. It includes a buffer and
 * automatic retries with exponential backoff for 429 errors.
 * @type {Bottleneck}
 */
export const trelloRateLimiter = new Bottleneck({
  // Allow 100 requests per 10 seconds, but spread them out for stability.
  maxConcurrent: 5, // Limit to 5 concurrent requests to avoid bursts.
  minTime: 100, // Minimum 100ms between requests, effectively 10 req/sec.
  reservoir: 80, // Start with a buffer of 80 available requests.
  reservoirRefreshAmount: 80, // Refresh 80 requests...
  reservoirRefreshInterval: 10 * 1000, // ...every 10 seconds.
  
  // Configuration for retry delays (not used for custom 429 handling).
  retryDelayOptions: {
    base: 300,
    max: 30000,
  },
});

/**
 * Event listener for failed jobs.
 * This is crucial for handling rate limit errors (HTTP 429). When a 429 error occurs,
 * it logs a warning and schedules a retry with an exponential backoff delay.
 * It will attempt up to 3 retries for rate limit errors. Other errors are not retried.
 */
trelloRateLimiter.on('failed', async (error, jobInfo) => {
  const isRateLimitError = error instanceof TrelloHttpError && error.statusCode === 429;
  
  if (isRateLimitError) {
    trelloLogger.warn({
      retryCount: jobInfo.retryCount,
      options: jobInfo.options,
    }, 'Rate limit hit, retrying...');
    
    // Retry up to 3 times for 429 errors.
    if (jobInfo.retryCount < 3) {
      // Exponential backoff: 1s, 4s, 16s
      const delay = Math.pow(4, jobInfo.retryCount) * 1000;
      return delay;
    }
  }
  
  // Do not retry for other types of errors.
  return null;
});

/**
 * Event listener for when a job is retried.
 * Logs information about the retry attempt, including the count and the error that caused it.
 */
trelloRateLimiter.on('retry', (error, jobInfo) => {
  trelloLogger.info({
    retryCount: jobInfo.retryCount,
    delay: jobInfo.retryCount, // Note: This seems to be logging the retry count, not the delay duration.
    error: (error as any)?.message || String(error),
  }, 'Retrying Trello API request');
});

/**
 * Event listener for when the rate limit reservoir is empty.
 * This indicates that the system is making requests faster than the limit allows,
 * and subsequent requests will be queued.
 */
trelloRateLimiter.on('depleted', () => {
  trelloLogger.warn('Rate limit reservoir depleted, requests will be queued');
});

/**
 * Event listener for dropped requests.
 * This is a critical error, indicating that a request was dropped, likely because
 * the queue is full or the job was configured not to be queued.
 */
trelloRateLimiter.on('dropped', (dropped) => {
  trelloLogger.error({
    dropped,
  }, 'Request dropped due to rate limiting');
});

/**
 * Wraps a Trello API operation with the rate limiter.
 * This function schedules the provided asynchronous operation to be executed
 * according to the rate limiter's rules and the specified priority.
 * @template T The return type of the API operation.
 * @param {() => Promise<T>} operation - The asynchronous function to execute (e.g., a call to `trelloHttp.get`).
 * @param {number} [priority=5] - The priority of the job (1-9, where 9 is the highest).
 * @returns {Promise<T>} A promise that resolves with the result of the operation.
 */
export async function withRateLimit<T>(
  operation: () => Promise<T>,
  priority = 5 // Default priority is 5 (medium).
): Promise<T> {
  return trelloRateLimiter.schedule({ priority }, operation);
}

/**
 * A convenience wrapper for scheduling high-priority operations.
 * Use this for critical, user-facing actions that should be executed as soon as possible.
 * @template T The return type of the API operation.
 * @param {() => Promise<T>} operation - The high-priority asynchronous function to execute.
 * @returns {Promise<T>} A promise that resolves with the result of the operation.
 */
export async function withHighPriorityRateLimit<T>(
  operation: () => Promise<T>
): Promise<T> {
  return withRateLimit(operation, 9); // Priority 9 (highest).
}

/**
 * A convenience wrapper for scheduling low-priority operations.
 * Use this for background tasks, bulk operations, or non-essential requests.
 * @template T The return type of the API operation.
 * @param {() => Promise<T>} operation - The low-priority asynchronous function to execute.
 * @returns {Promise<T>} A promise that resolves with the result of the operation.
 */
export async function withLowPriorityRateLimit<T>(
  operation: () => Promise<T>
): Promise<T> {
  return withRateLimit(operation, 2); // Priority 2 (low).
}
