import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';
import { trelloMcpServer } from '../mcp/server.js';
import { registerAllToolsAndResources } from '../mcp/registry.js';

// Initialize and run the MCP server over stdio for clients like Claude Desktop
async function main(): Promise<void> {
  try {
    // Create an SDK McpServer for maximum client compatibility and attach it first
    const mcp = new McpServer({ name: 'trello-mcp-compat', version: '1.0.0' });
    trelloMcpServer.attachMcpCompat(mcp);

    // Now ensure all tools/resources are registered (so they get mirrored to the compat server)
    registerAllToolsAndResources();

    // Get the underlying MCP server instance (kept for SSE/HTTP usage only)
    // const server = trelloMcpServer.getServer();

    // Create stdio transport and connect ONLY the SDK McpServer to avoid double-start
    const transport = new StdioServerTransport();
    await mcp.connect(transport);
    // Important: do not log to stdout in stdio mode. Logger is already configured to stderr.
    logger.info('MCP stdio server connected');

    // Graceful shutdown signals (best-effort in stdio mode)
    const shutdown = () => {
      try {
        transport.close();
      } catch {}
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep the process alive while the stdio transport is active
    // to avoid the host seeing an unexpected disconnect
    await new Promise(() => {});
  } catch (error) {
    // Write to stderr so Claude Desktop logs capture details
    const message = (error as any)?.message || String(error);
    logger.error({ error: message }, 'Failed to start MCP stdio server');
    // Non-zero exit to signal startup failure
    process.exit(1);
  }
}

// Start
void main();


