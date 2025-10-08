/**
 * @fileoverview This module is responsible for loading, validating, and exporting
 * environment variables for the application. It uses `dotenv` to load variables
 * from a `.env` file and `zod` to enforce a schema, ensuring that all necessary
 * configuration is present and correctly typed.
 */
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from `.env` file.
// A temporary redirection of `console.log` to `console.error` is used to prevent
// `dotenv` from potentially corrupting the stdout stream, which is reserved for MCP messages.
const originalConsoleLog = console.log;
try {
  // eslint-disable-next-line no-console
  (console as any).log = (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  };
  dotenv.config();
} finally {
  // eslint-disable-next-line no-console
  (console as any).log = originalConsoleLog;
}

/**
 * Zod schema for validating the application's environment variables.
 * It defines the expected type, default values, and transformations for each variable.
 */
const envSchema = z.object({
  // Server configuration
  /** The port on which the server will listen. */
  PORT: z.string().default('8787').transform(Number),
  /** The base URL of the server, used for constructing callback URLs. */
  BASE_URL: z.string().default('http://localhost:8787'),
  /** The API key required for authenticating with the MCP server's endpoints. Optional for local development. */
  MCP_API_KEY: z.string().default(''),
  
  // Trello configuration (PAT mode for v1)
  /** The base URL for the Trello API. */
  TRELLO_API_BASE: z.string().default('https://api.trello.com/1'),
  /** The Trello API key. Required for making API calls. */
  TRELLO_KEY: z.string().default(''),
  /** The Trello API token (user-generated). Required for making API calls. */
  TRELLO_TOKEN: z.string().default(''),
  
  // Optional OAuth configuration (for v2)
  /** The client ID for Trello OAuth 2.0. */
  TRELLO_CLIENT_ID: z.string().optional(),
  /** The client secret for Trello OAuth 2.0. */
  TRELLO_CLIENT_SECRET: z.string().optional(),
  /** The redirect URI for the Trello OAuth 2.0 flow. */
  TRELLO_REDIRECT_URI: z.string().optional(),
  
  // Optional webhook configuration
  /** The callback URL for Trello webhooks to post to. */
  TRELLO_WEBHOOK_CALLBACK_URL: z.string().optional(),
  /** A secret used to verify the authenticity of incoming Trello webhooks. */
  WEBHOOK_VERIFICATION_SECRET: z.string().optional(),
  
  // Logging
  /** The minimum level of logs to output. */
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  
  // Optional database (for v2 OAuth)
  /** The connection URL for the database (e.g., for storing OAuth tokens). */
  DATABASE_URL: z.string().optional(),
  /** A secret key for encrypting sensitive data in the database. */
  ENCRYPTION_KEY: z.string().optional(),
});

/**
 * The inferred TypeScript type from the `envSchema`.
 * Provides strong typing for the application's configuration object.
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * The application's configuration object.
 * It is populated by parsing `process.env` against the `envSchema`.
 * The application will exit if the environment variables do not match the schema.
 * @type {EnvConfig}
 */
let config: EnvConfig;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

export { config };
