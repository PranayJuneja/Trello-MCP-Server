# Trello MCP Server

A Model Context Protocol (MCP) server that provides integration with Trello boards, lists, and cards. This server exposes Trello functionality through MCP tools and resources, allowing AI assistants to interact with Trello data.

## Features

### Current Implementation (v1)
- ✅ HTTP/SSE MCP transport
- ✅ Bearer token authentication
- ✅ Rate limiting and error handling
- ✅ Board management tools
- ✅ Board resource provider
- ✅ List management tools
- ✅ List resource provider
- ✅ Card management tools
- ✅ Card resource provider
- ✅ Comment management
- ✅ Label and member assignment
- ✅ Attachment management
- ✅ Checklist management tools
- ✅ Checklist resource provider
- ✅ Check item operations
- ✅ Progress tracking
- ✅ Label management tools
- ✅ Label resource provider
- ✅ Color visualization
- ✅ Usage analytics
- ✅ Search functionality
- ✅ Advanced analytics
- ✅ Productivity metrics
- ✅ Team collaboration insights
- ✅ Organization management
- ✅ Member permission control
- ✅ Enterprise-grade administration
- ✅ Batch operations
- ✅ Automation framework
- ✅ Scheduled actions
- ✅ Webhook integration
- ✅ Real-time event processing
- ✅ Event streaming
- ✅ Advanced reporting and data export
- ✅ Custom dashboard creation
- ✅ Scheduled report automation

### Board Tools
- `list_boards` - List all accessible boards
- `get_board` - Get detailed board information
- `create_board` - Create a new board
- `update_board` - Update board properties
- `close_board` - Close/archive a board
- `reopen_board` - Reopen a closed board
- `delete_board` - Permanently delete a board

### List Tools
- `list_lists` - List all lists on a board
- `get_list` - Get detailed list information
- `create_list` - Create a new list on a board
- `update_list` - Update list properties
- `archive_list` - Archive a list
- `unarchive_list` - Unarchive a list
- `move_list` - Move a list to different position
- `get_list_cards` - Get all cards in a specific list

### Card Tools
- `get_card` - Get detailed card information
- `create_card` - Create a new card in a list
- `update_card` - Update card properties
- `move_card` - Move a card to different list
- `archive_card` - Archive a card
- `unarchive_card` - Unarchive a card
- `delete_card` - Permanently delete a card
- `add_comment` - Add comment to a card
- `edit_comment` - Edit existing comment
- `delete_comment` - Delete a comment
- `add_label_to_card` - Add label to card
- `remove_label_from_card` - Remove label from card
- `assign_member_to_card` - Assign member to card
- `remove_member_from_card` - Remove member from card
- `add_attachment_url` - Add URL attachment to card
- `remove_attachment` - Remove attachment from card
- `get_card_actions` - Get card activity history

### Checklist Tools
- `get_checklist` - Get detailed checklist information
- `add_checklist` - Add new checklist to a card
- `update_checklist` - Update checklist properties
- `delete_checklist` - Delete a checklist
- `get_checklists_on_card` - Get all checklists on a card
- `add_checkitem` - Add new item to checklist
- `update_checkitem` - Update checklist item (mark complete/incomplete, rename, etc.)
- `delete_checkitem` - Delete item from checklist
- `get_checkitems` - Get all items in checklist with filtering
- `get_checkitem` - Get detailed check item information

### Label Tools
- `get_label` - Get detailed label information
- `get_labels_on_board` - Get all labels on a board
- `create_label` - Create new label on a board
- `update_label` - Update label properties (name, color)
- `delete_label` - Delete a label
- `update_label_field` - Update specific label field
- `get_label_usage` - Get label usage statistics and analytics
- `bulk_update_labels` - Update multiple labels simultaneously
- `get_cards_with_label` - Find all cards using a specific label

### Search Tools
- `search_trello` - Comprehensive search across boards, cards, members, and organizations
- `search_boards` - Search boards by name and description with filters
- `search_cards` - Advanced card search with filtering (attachments, due dates, members, etc.)
- `search_members` - Search members by name, username, or email
- `get_advanced_search` - Complex search with filters and sorting
- `get_saved_searches` - Get saved search queries
- `create_saved_search` - Create new saved search queries

### Analytics Tools
- `get_board_analytics` - Comprehensive board analytics and metrics
- `get_user_activity` - User activity analytics and productivity tracking
- `get_team_analytics` - Team performance and collaboration metrics
- `get_workflow_analytics` - Workflow analysis with bottleneck detection
- `get_label_analytics` - Label usage analytics and effectiveness
- `get_productivity_metrics` - Productivity metrics (velocity, quality, efficiency)

### Organization Tools
- `get_organizations` - Get all organizations for a member with filtering options
- `get_organization` - Get detailed information about a specific organization
- `create_organization` - Create a new organization workspace
- `update_organization` - Update organization settings and preferences
- `delete_organization` - Delete an organization workspace
- `get_organization_members` - Get all members of an organization
- `get_organization_boards` - Get all boards in an organization
- `invite_member_to_organization` - Invite new members to organization
- `update_organization_member` - Update member roles and permissions
- `remove_organization_member` - Remove members from organization
- `deactivate_organization_member` - Deactivate/reactivate organization members
- `get_organization_memberships` - Get detailed membership information
- `get_organization_membership` - Get specific membership details
- `get_organization_analytics` - Comprehensive organization analytics

### Batch Operation Tools
- `batch_get_requests` - Execute multiple GET requests in single batch (up to 10)
- `batch_create_cards` - Create multiple cards efficiently (up to 20)
- `batch_update_cards` - Update multiple cards with different properties (up to 20)
- `batch_move_cards` - Move multiple cards between lists/boards (up to 50)
- `batch_assign_members` - Assign/remove members from multiple cards (up to 30)
- `batch_apply_labels` - Apply/remove labels from multiple cards (up to 30)
- `archive_all_cards_in_list` - Archive all cards in a list at once
- `move_all_cards_in_list` - Move all cards between lists/boards
- `bulk_archive_cards` - Archive multiple cards by ID (up to 100)
- `bulk_unarchive_cards` - Unarchive multiple cards by ID (up to 100)
- `bulk_delete_cards` - Delete multiple cards with confirmation (up to 50)

### Automation Tools
- `create_automation_rule` - Create automation rules with triggers and actions
- `update_automation_rule` - Update existing automation rules
- `delete_automation_rule` - Remove automation rules
- `list_automation_rules` - List automation rules with filtering
- `get_automation_rule` - Get automation rule details
- `test_automation_rule` - Test rules against specific cards
- `create_scheduled_action` - Create time-based scheduled actions
- `update_scheduled_action` - Update existing scheduled actions
- `delete_scheduled_action` - Remove scheduled actions
- `list_scheduled_actions` - List scheduled actions with filtering
- `execute_scheduled_action` - Execute scheduled actions immediately
- `get_automation_history` - View automation execution history

### Webhook Tools
- `create_webhook` - Create webhooks to monitor Trello model changes
- `list_webhooks` - List all webhooks for the current token
- `get_webhook` - Get detailed webhook information and configuration
- `update_webhook` - Update webhook configuration (URL, description, active status)
- `delete_webhook` - Delete webhooks and stop receiving events
- `create_webhook_event_processor` - Create automated event handling processors
- `update_webhook_event_processor` - Update event processor configurations
- `delete_webhook_event_processor` - Remove webhook event processors
- `list_webhook_event_processors` - List event processors with filtering
- `process_webhook_event` - Process webhook events through specific processors
- `get_webhook_events` - Get webhook event history for models

### Real-time Integration Tools
- `enable_real_time_sync` - Enable real-time synchronization for models
- `disable_real_time_sync` - Disable real-time synchronization
- `get_real_time_sync_status` - Get synchronization status for models

### Export and Reporting Tools
- `export_board_data` - Export comprehensive board data in multiple formats (CSV, JSON, PDF)
- `export_user_activity` - Export user activity and productivity reports across boards
- `export_organization_data` - Export organization-wide data including boards, members, and metrics
- `generate_analytics_report` - Generate comprehensive analytics reports with insights and recommendations
- `create_dashboard` - Create custom analytics dashboards with configurable widgets
- `update_dashboard` - Update existing dashboard configuration and widgets
- `delete_dashboard` - Delete custom dashboard and all associated data
- `get_dashboard` - Retrieve dashboard configuration and real-time widget data
- `list_dashboards` - List all available dashboards with filtering options
- `schedule_report` - Schedule automated report generation and delivery
- `update_scheduled_report` - Update scheduled report configuration and recipients
- `delete_scheduled_report` - Delete scheduled report and stop automated delivery
- `list_scheduled_reports` - List all scheduled reports with status and configuration
- `execute_scheduled_report` - Execute scheduled report immediately with optional custom date range
- `create_data_visualization` - Create advanced data visualizations and charts from Trello data

### Resources
- `trello:board/{id}` - Comprehensive board information with human-readable summary
- `trello:list/{id}` - Detailed list information with all cards and activity
- `trello:card/{id}` - Rich card details with description, members, labels, checklists, attachments, and comments
- `trello:checklist/{id}` - Detailed checklist with progress tracking, item status, and context
- `trello:label/{id}` - Label details with color visualization, usage analytics, and management suggestions
- `trello:search/{query}` - Comprehensive search results with filtering tips and advanced operators
- `trello:organization/{id}` - Organization details with member management, board oversight, and health recommendations
- `trello:webhook/{id}` - Webhook details with event types, configuration, and management options
- `trello:report/{type}/{id}` - Report details including dashboards, analytics, exports, and scheduled reports with insights and management options

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
      "command": "pnpm",
      "args": [
        "--silent",
        "-C",
        "<path to the project>",
        "mcp:stdio"
      ],
      "env": {
        "TRELLO_KEY": "<trello api key>",
        "TRELLO_TOKEN": "<trello token>",
        "LOG_LEVEL": "info"
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
      "command": "pnpm",
      "args": [
        "--silent",
        "-C",
        "<path to the project>",
        "mcp:stdio"
      ],
      "env": {
        "TRELLO_KEY": "<trello api key>",
        "TRELLO_TOKEN": "<trello token>",
        "LOG_LEVEL": "info"
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

### Phase 5: Lists Tools ✅ Completed
- ✅ `list_lists` - Get lists on a board
- ✅ `create_list` - Create a new list
- ✅ `update_list` - Update list properties
- ✅ `archive_list` - Archive a list
- ✅ `unarchive_list` - Unarchive a list
- ✅ `move_list` - Move lists to different positions
- ✅ `get_list_cards` - Get all cards in a list

### Phase 6: Cards Core Tools ✅ Completed
- ✅ `get_card` - Get detailed card information
- ✅ `create_card` - Create a new card
- ✅ `update_card` - Update card properties
- ✅ `move_card` - Move card between lists
- ✅ `archive_card` - Archive a card
- ✅ `unarchive_card` - Unarchive a card
- ✅ `delete_card` - Permanently delete a card
- ✅ `add_comment` - Add comment to card
- ✅ `edit_comment` - Edit existing comment
- ✅ `delete_comment` - Delete a comment
- ✅ `add_label_to_card` - Add label to card
- ✅ `remove_label_from_card` - Remove label from card
- ✅ `assign_member_to_card` - Assign member to card
- ✅ `remove_member_from_card` - Remove member from card
- ✅ `add_attachment_url` - Add URL attachment
- ✅ `remove_attachment` - Remove attachment
- ✅ `get_card_actions` - Get card activity history

### Phase 7: Checklists and Advanced Card Features ✅ Completed
- ✅ `get_checklist` - Get checklist details
- ✅ `add_checklist` - Add checklist to card
- ✅ `update_checklist` - Update checklist properties
- ✅ `delete_checklist` - Delete entire checklist
- ✅ `get_checklists_on_card` - Get all checklists on card
- ✅ `add_checkitem` - Add item to checklist
- ✅ `update_checkitem` - Update checklist item
- ✅ `delete_checkitem` - Delete checklist item
- ✅ `get_checkitems` - Get items with filtering
- ✅ `get_checkitem` - Get check item details

### Phase 8: Labels Management ✅ Completed
- ✅ `get_label` - Get label details and usage statistics
- ✅ `get_labels_on_board` - List all labels on a board
- ✅ `create_label` - Create new label with color
- ✅ `update_label` - Update label properties (name, color)
- ✅ `delete_label` - Delete a label
- ✅ `update_label_field` - Update specific label field
- ✅ `get_label_usage` - Get usage analytics
- ✅ `bulk_update_labels` - Bulk label operations
- ✅ `get_cards_with_label` - Find cards by label

### Phase 9: Search and Analytics ✅ Completed
- ✅ `search_trello` - Global search across all Trello content
- ✅ `search_boards` - Search boards with advanced filters
- ✅ `search_cards` - Advanced card search with complex filtering
- ✅ `search_members` - Find members by name, username, email
- ✅ `get_advanced_search` - Complex search with operators
- ✅ `get_board_analytics` - Comprehensive board analytics
- ✅ `get_user_activity` - User productivity analytics
- ✅ `get_team_analytics` - Team performance metrics
- ✅ `get_workflow_analytics` - Workflow and bottleneck analysis
- ✅ `get_label_analytics` - Label effectiveness analytics
- ✅ `get_productivity_metrics` - Individual and team productivity

### Phase 10: Organizations and Member Management ✅ Completed
- ✅ `get_organizations` - List user organizations with filtering
- ✅ `get_organization` - Get detailed organization information
- ✅ `create_organization` - Create new organization workspaces
- ✅ `update_organization` - Update organization settings and preferences
- ✅ `delete_organization` - Delete organization workspaces
- ✅ `get_organization_members` - Get organization members with filtering
- ✅ `get_organization_boards` - Get organization boards with filtering
- ✅ `invite_member_to_organization` - Invite members to organizations
- ✅ `update_organization_member` - Update member roles and permissions
- ✅ `remove_organization_member` - Remove members from organizations
- ✅ `deactivate_organization_member` - Deactivate/reactivate members
- ✅ `get_organization_memberships` - Get detailed membership information
- ✅ `get_organization_analytics` - Comprehensive organization analytics

### Phase 11: Batch Operations and Automation ✅ Completed
- ✅ `batch_get_requests` - Execute multiple GET requests in single batch
- ✅ `batch_create_cards` - Create multiple cards efficiently (up to 20)
- ✅ `batch_update_cards` - Update multiple cards with different properties
- ✅ `batch_move_cards` - Move cards between lists/boards in bulk (up to 50)
- ✅ `batch_assign_members` - Assign/remove members from multiple cards
- ✅ `batch_apply_labels` - Apply/remove labels from multiple cards
- ✅ `archive_all_cards_in_list` - Archive all cards in a list at once
- ✅ `move_all_cards_in_list` - Move all cards between lists/boards
- ✅ `bulk_archive_cards` - Archive multiple cards by ID (up to 100)
- ✅ `bulk_unarchive_cards` - Unarchive multiple cards by ID (up to 100)
- ✅ `bulk_delete_cards` - Delete multiple cards with confirmation (up to 50)
- ✅ `create_automation_rule` - Create automation rules with triggers and actions
- ✅ `update_automation_rule` - Update existing automation rules
- ✅ `test_automation_rule` - Test automation rules against specific cards
- ✅ `create_scheduled_action` - Create time-based scheduled actions
- ✅ `execute_scheduled_action` - Execute scheduled actions immediately
- ✅ `get_automation_history` - View automation execution history

### Phase 12: Webhooks and Real-time Integration ✅ Completed
- ✅ `create_webhook` - Create webhooks for real-time board updates
- ✅ `list_webhooks` - List active webhooks with filtering and management
- ✅ `get_webhook` - Get detailed webhook information and configuration
- ✅ `update_webhook` - Update webhook configurations (URL, description, status)
- ✅ `delete_webhook` - Remove webhooks and stop event delivery
- ✅ `create_webhook_event_processor` - Create automated event handling processors
- ✅ `process_webhook_event` - Process webhook events with filtering and automation
- ✅ `get_webhook_events` - Get webhook event history for specific models
- ✅ `enable_real_time_sync` - Enable real-time board synchronization
- ✅ `get_real_time_sync_status` - Monitor synchronization status
- ✅ Webhook endpoint `/webhooks/trello` for receiving Trello events
- ✅ Event streaming and processing infrastructure
- ✅ Real-time event filtering and automation triggers

### Phase 13: Advanced Reporting and Data Export ✅ Completed
- ✅ `export_board_data` - Export board data in multiple formats (CSV, JSON, PDF)
- ✅ `export_user_activity` - Export user activity and productivity reports across boards
- ✅ `export_organization_data` - Export organization-wide data including boards, members, and metrics
- ✅ `generate_analytics_report` - Generate comprehensive analytics reports with insights and recommendations
- ✅ `create_dashboard` - Create custom analytics dashboards with configurable widgets
- ✅ `update_dashboard` - Update existing dashboard configuration and widgets
- ✅ `get_dashboard` - Retrieve dashboard configuration and real-time widget data
- ✅ `list_dashboards` - List all available dashboards with filtering options
- ✅ `schedule_report` - Schedule automated report generation and delivery
- ✅ `update_scheduled_report` - Update scheduled report configuration and recipients
- ✅ `execute_scheduled_report` - Execute scheduled report immediately with custom date ranges
- ✅ `create_data_visualization` - Create advanced data visualizations and charts from Trello data
- ✅ Multi-format export capabilities (CSV, JSON, PDF) with comprehensive data coverage
- ✅ Custom dashboard framework with 8 widget types and real-time data
- ✅ Scheduled report automation with configurable frequency and recipients
- ✅ Advanced analytics with insights, trends, and actionable recommendations
- ✅ Data visualization engine with multiple chart types and formats

### Phase 14: Enterprise Security and Multi-tenancy (Next)
- [ ] OAuth 2.0 multi-user support for enterprise deployment
- [ ] Enterprise SSO integration (SAML, OIDC)
- [ ] Multi-tenant support for service providers
- [ ] Advanced security and compliance features (SOC2, GDPR)
- [ ] Role-based access control (RBAC) for enterprise users
- [ ] Audit logging and compliance reporting
- [ ] Advanced API rate optimization and intelligent caching
- [ ] Enterprise deployment guides and scaling documentation

### Phase 15: Advanced Integration and AI Features
- [ ] AI-powered insights and recommendations
- [ ] Natural language query processing
- [ ] Predictive analytics and forecasting
- [ ] Intelligent automation rule suggestions
- [ ] Advanced workflow optimization
- [ ] Integration with popular CI/CD tools
- [ ] Advanced API gateway and rate limiting
- [ ] Enterprise monitoring and alerting

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
