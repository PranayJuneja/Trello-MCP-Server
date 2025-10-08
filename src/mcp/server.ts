/**
 * @fileoverview This module defines the core MCP (Model Context Protocol) server for the Trello integration.
 * It encapsulates the `@modelcontextprotocol/sdk` server, sets up request handlers for standard
 * MCP requests (like listing tools and reading resources), and provides a registry for
 * custom tools and resources specific to Trello.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import crypto from 'crypto';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Defines the context object that is passed to every tool and resource handler.
 * This provides handlers with access to request-specific information, such as a logger
 * with a unique request ID.
 */
export interface McpContext {
  /** A unique identifier for the current request, useful for tracing and logging. */
  requestId: string;
  /** A logger instance pre-configured with the requestId. */
  logger: typeof logger;
}

/**
 * The main class for the Trello MCP Server. It manages the server instance,
 * tool and resource registration, and request handling logic.
 */
export class TrelloMcpServer {
  private server: Server;
  private mcpLogger = logger.child({ component: 'McpServer' });
  private mcpCompat?: McpServer;

  /**
   * Initializes a new instance of the TrelloMcpServer, setting up the
   * underlying MCP server and its request handlers.
   */
  constructor() {
    this.server = new Server(
      {
        name: 'trello-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
          resources: {
            listChanged: true,
          },
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Sets up the default request handlers for the MCP server, such as
   * listing tools/resources and handling tool calls and resource reads.
   * @private
   */
  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.mcpLogger.debug('Listing available tools');
      return {
        tools: this.getRegisteredTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const requestId = crypto.randomUUID();
      const requestLogger = logger.child({ requestId, tool: name });

      try {
        requestLogger.info({ arguments: args }, 'Tool called');
        const result = await this.callTool(name, args, {
          requestId,
          logger: requestLogger,
        });
        requestLogger.info('Tool completed successfully');
        return result;
      } catch (error) {
        requestLogger.error({ error: error instanceof Error ? error.message : String(error) }, 'Tool failed');
        if (error instanceof McpError) throw error;
        throw new McpError(ErrorCode.InternalError, `Tool ${name} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.mcpLogger.debug('Listing available resources');
      return {
        resources: this.getRegisteredResources(),
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const requestId = crypto.randomUUID();
      const requestLogger = logger.child({ requestId, resource: uri });

      try {
        requestLogger.info('Resource requested');
        const result = await this.readResource(uri, {
          requestId,
          logger: requestLogger,
        });
        requestLogger.info('Resource read successfully');
        return result;
      } catch (error) {
        requestLogger.error({ error: error instanceof Error ? error.message : String(error) }, 'Resource read failed');
        if (error instanceof McpError) throw error;
        throw new McpError(ErrorCode.InternalError, `Resource ${uri} read failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  // Tool registry
  private tools = new Map<string, {
    name: string;
    description: string;
    inputSchema: any;
    handler: (args: any, context: McpContext) => Promise<any>;
  }>();

  /**
   * Registers a new tool with the MCP server.
   * @param {string} name - The name of the tool.
   * @param {string} description - A description of what the tool does.
   * @param {any} inputSchema - The Zod schema for the tool's input arguments.
   * @param {(args: any, context: McpContext) => Promise<any>} handler - The asynchronous function that executes the tool's logic.
   */
  registerTool(
    name: string,
    description: string,
    inputSchema: any,
    handler: (args: any, context: McpContext) => Promise<any>
  ) {
    this.tools.set(name, { name, description, inputSchema, handler });
    this.mcpLogger.info({ tool: name }, 'Tool registered');
  }

  /**
   * Retrieves the list of all registered tools, formatted for an MCP `ListTools` response.
   * @private
   * @returns {any[]} An array of tool definition objects.
   */
  private getRegisteredTools() {
    return Array.from(this.tools.values()).map(tool => {
      let inputSchema: any;
      try {
        // Convert Zod schema to JSON schema for client compatibility.
        inputSchema = zodToJsonSchema(tool.inputSchema, { name: tool.name, $refStrategy: 'none' } as any);
      } catch (error) {
        this.mcpLogger.warn({ tool: tool.name, error: (error as Error).message }, 'Failed to convert Zod schema; using permissive schema');
        inputSchema = { type: 'object', additionalProperties: true };
      }
      return {
        name: tool.name,
        description: tool.description,
        input_schema: inputSchema, // MCP protocol expects snake_case
      } as any;
    });
  }

  /**
   * Executes a registered tool by its name.
   * @private
   * @param {string} name - The name of the tool to call.
   * @param {any} args - The arguments to pass to the tool's handler.
   * @param {McpContext} context - The context for this specific tool call.
   * @returns {Promise<any>} A promise that resolves to the tool's result, formatted for an MCP response.
   * @throws {McpError} If the tool is not found.
   */
  private async callTool(name: string, args: any, context: McpContext) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    const result = await tool.handler(args, context);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }

  // Resource registry
  private resources = new Map<string, {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    handler: (uri: string, context: McpContext) => Promise<any>;
  }>();

  /**
   * Registers a new resource handler with the MCP server.
   * @param {string} uriPattern - The URI pattern that this handler will respond to (e.g., `trello:board/{id}`).
   * @param {string} name - A human-readable name for the resource.
   * @param {string} description - A description of the resource.
   * @param {string} mimeType - The MIME type of the resource's content (e.g., `application/json`).
   * @param {(uri: string, context: McpContext) => Promise<any>} handler - The asynchronous function that reads the resource.
   */
  registerResource(
    uriPattern: string,
    name: string,
    description: string,
    mimeType: string,
    handler: (uri: string, context: McpContext) => Promise<any>
  ) {
    this.resources.set(uriPattern, { uri: uriPattern, name, description, mimeType, handler });
    this.mcpLogger.info({ resource: uriPattern }, 'Resource registered');
  }

  /**
   * Retrieves the list of all registered resources, formatted for an MCP `ListResources` response.
   * @private
   * @returns {any[]} An array of resource definition objects.
   */
  private getRegisteredResources() {
    return Array.from(this.resources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    }));
  }

  /**
   * Reads a resource by matching its URI against registered patterns.
   * @private
   * @param {string} uri - The URI of the resource to read.
   * @param {McpContext} context - The context for this specific resource read.
   * @returns {Promise<any>} A promise that resolves to the resource's content, formatted for an MCP response.
   * @throws {McpError} If no handler is found for the given URI.
   */
  private async readResource(uri: string, context: McpContext) {
    for (const [pattern, resource] of this.resources) {
      if (this.matchesUriPattern(uri, pattern)) {
        const data = await resource.handler(uri, context);
        return {
          contents: [{
            uri,
            mimeType: resource.mimeType,
            text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
          }],
        };
      }
    }
    throw new McpError(ErrorCode.InvalidRequest, `No handler found for resource: ${uri}`);
  }

  /**
   * A simple URI pattern matcher that supports placeholders like `{id}`.
   * @private
   * @param {string} uri - The actual URI to test.
   * @param {string} pattern - The pattern to match against.
   * @returns {boolean} True if the URI matches the pattern, false otherwise.
   */
  private matchesUriPattern(uri: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\{[^}]+\}/g, '([^/]+)');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(uri);
  }

  /**
   * Returns the underlying MCP Server instance.
   * @returns {Server} The server instance.
   */
  getServer(): Server {
    return this.server;
  }
}

/**
 * A singleton instance of the TrelloMcpServer, used throughout the application.
 * @type {TrelloMcpServer}
 */
export const trelloMcpServer = new TrelloMcpServer();