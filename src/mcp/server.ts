import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

export interface McpContext {
  requestId: string;
  logger: typeof logger;
}

export class TrelloMcpServer {
  private server: Server;
  private mcpLogger = logger.child({ component: 'McpServer' });

  constructor() {
    this.server = new Server(
      {
        name: 'trello-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

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
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool ${name} failed: ${error instanceof Error ? error.message : String(error)}`
        );
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
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Resource ${uri} read failed: ${error instanceof Error ? error.message : String(error)}`
        );
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

  registerTool(
    name: string,
    description: string,
    inputSchema: any,
    handler: (args: any, context: McpContext) => Promise<any>
  ) {
    this.tools.set(name, { name, description, inputSchema, handler });
    this.mcpLogger.info({ tool: name }, 'Tool registered');
  }

  private getRegisteredTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  private async callTool(name: string, args: any, context: McpContext) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(await tool.handler(args, context), null, 2),
        },
      ],
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

  private getRegisteredResources() {
    return Array.from(this.resources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    }));
  }

  private async readResource(uri: string, context: McpContext) {
    // Find matching resource handler
    for (const [pattern, resource] of this.resources) {
      if (this.matchesUriPattern(uri, pattern)) {
        const data = await resource.handler(uri, context);
        return {
          contents: [
            {
              uri,
              mimeType: resource.mimeType,
              text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
            },
          ],
        };
      }
    }

    throw new McpError(ErrorCode.InvalidRequest, `No handler found for resource: ${uri}`);
  }

  private matchesUriPattern(uri: string, pattern: string): boolean {
    // Simple pattern matching - replace {id} with regex
    const regexPattern = pattern.replace(/\{[^}]+\}/g, '([^/]+)');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(uri);
  }

  getServer(): Server {
    return this.server;
  }
}

// Singleton instance
export const trelloMcpServer = new TrelloMcpServer();
