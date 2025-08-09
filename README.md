# Trello MCP Server

A Model Context Protocol (MCP) server that provides integration with Trello boards, lists, and cards. This server exposes Trello functionality through MCP tools and resources, allowing AI assistants to interact with Trello data.

## Features

### Current Implementation (v1)
- ✅ HTTP/SSE MCP transport
- ✅ Bearer token authentication
- ✅ Rate limiting and error handling
- ✅ Board management tools
- ✅ Board resource provider

### Board Tools
- `list_boards` - List all accessible boards
- `get_board` - Get detailed board information
- `create_board` - Create a new board
- `update_board` - Update board properties
- `close_board` - Close/archive a board
- `reopen_board` - Reopen a closed board
- `delete_board` - Permanently delete a board

### Resources
- `trello:board/{id}` - Comprehensive board information with human-readable summary

## Quick Start

### 1. Prerequisites
- Node.js 18.17+
- Trello API credentials (Key and Token)

### 2. Get Trello Credentials
1. Go to https://trello.com/power-ups/admin
2. Create a new Power-Up or use existing
3. Get your API Key
4. Generate a Token with read/write permissions

### 3. Setup Environment
Create a `.env` file in the project root and fill in your credentials:

```bash
# Server configuration
PORT=8787
BASE_URL=http://localhost:8787
MCP_API_KEY=your-secure-random-key

# Trello configuration
TRELLO_API_BASE=https://api.trello.com/1
TRELLO_KEY=your-trello-api-key
TRELLO_TOKEN=your-trello-token

# Logging
LOG_LEVEL=info
```

### 4. Install and Run
```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Production build
pnpm build
pnpm start
```

### 5. Test Connection
```bash
# Check server health
curl http://localhost:8787/health

# Test MCP connection (replace YOUR_API_KEY)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: text/event-stream" \
  http://localhost:8787/mcp/sse
```

## MCP Client Configuration

### Cursor IDE
Add to your MCP settings:
```json
{
  "mcpServers": {
    "trello": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:8787/mcp/sse",
        "headers": {
          "Authorization": "Bearer YOUR_API_KEY"
        }
      }
    }
  }
}
```

### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "trello": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:8787/mcp/sse",
        "headers": {
          "Authorization": "Bearer YOUR_API_KEY"
        }
      }
    }
  }
}
```

## API Endpoints

- `GET /` - Server information
- `GET /health` - Health check
- `GET /mcp/sse` - MCP Server-Sent Events endpoint (requires Bearer token)

## Architecture

```
src/
├── config/env.ts          # Environment configuration with zod validation
├── utils/logger.ts        # Pino logging setup with request middleware
├── trello/
│   ├── types.ts          # TypeScript definitions for Trello objects
│   ├── http.ts           # HTTP client with auth and error handling
│   ├── ratelimit.ts      # Bottleneck rate limiting
│   └── client.ts         # High-level Trello API client
├── mcp/
│   ├── server.ts         # MCP server with tool/resource registry
│   ├── transport/httpSse.ts  # SSE transport implementation
│   ├── tools/boards.ts   # Board management tools
│   ├── resources/board.ts # Board resource provider
│   └── registry.ts       # Tool and resource registration
└── index.ts              # Express server and application entry point
```

## Development Roadmap

### Phase 5: Lists Tools (Next)
- [ ] `list_lists` - Get lists on a board
- [ ] `create_list` - Create a new list
- [ ] `update_list` - Update list properties
- [ ] `archive_list` - Archive a list
- [ ] `unarchive_list` - Unarchive a list

### Phase 6: Cards Core Tools
- [ ] `create_card` - Create a new card
- [ ] `update_card` - Update card properties
- [ ] `move_card` - Move card between lists
- [ ] `archive_card` - Archive a card
- [ ] `add_comment` - Add comment to card
- [ ] `add_label` - Add label to card
- [ ] `assign_member` - Assign member to card

### Phase 7-14: Advanced Features
- [ ] Checklists and attachments
- [ ] Labels and search
- [ ] Batch operations
- [ ] Webhooks (optional)
- [ ] OAuth 2.0 multi-user support
- [ ] Deployment and documentation

## Error Handling

The server includes comprehensive error handling:
- Trello API errors are normalized and logged
- Rate limiting with exponential backoff
- Request-level logging with unique IDs
- Graceful degradation for network issues

## Rate Limiting

Respects Trello's API limits:
- Max 5 concurrent requests
- 80 requests per 10-second window
- Automatic retry with backoff for 429 errors

## Security

- Bearer token authentication for MCP endpoint
- Trello credentials stored in environment variables
- Request/response logging excludes sensitive data
- CORS enabled for cross-origin requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the existing patterns
4. Test with a real Trello board
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
