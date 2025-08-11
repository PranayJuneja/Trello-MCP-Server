import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
// Some dotenv versions may print to stdout; redirect any such output to stderr during config
const originalConsoleLog = console.log;
try {
  // Route any console.log used by dotenv to stderr to avoid corrupting MCP stdio
  // eslint-disable-next-line no-console
  (console as any).log = (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  };
  dotenv.config();
} finally {
  // Restore console.log
  // eslint-disable-next-line no-console
  (console as any).log = originalConsoleLog;
}

const envSchema = z.object({
  // Server configuration
  PORT: z.string().default('8787').transform(Number),
  BASE_URL: z.string().default('http://localhost:8787'),
  // Make MCP_API_KEY optional to allow stdio usage without auth
  MCP_API_KEY: z.string().default(''),
  
  // Trello configuration (PAT mode for v1)
  TRELLO_API_BASE: z.string().default('https://api.trello.com/1'),
  // Make Trello credentials optional for startup; API calls will fail if unset
  TRELLO_KEY: z.string().default(''),
  TRELLO_TOKEN: z.string().default(''),
  
  // Optional OAuth configuration (for v2)
  TRELLO_CLIENT_ID: z.string().optional(),
  TRELLO_CLIENT_SECRET: z.string().optional(),
  TRELLO_REDIRECT_URI: z.string().optional(),
  
  // Optional webhook configuration
  TRELLO_WEBHOOK_CALLBACK_URL: z.string().optional(),
  WEBHOOK_VERIFICATION_SECRET: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  
  // Optional database (for v2 OAuth)
  DATABASE_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

export { config };
