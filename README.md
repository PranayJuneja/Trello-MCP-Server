# Trello MCP Server

This repository contains a Model Context Protocol (MCP) server that provides a comprehensive integration with Trello. It exposes Trello's functionality through a rich set of MCP tools and resources, enabling AI assistants and other applications to interact with Trello boards, lists, cards, and more in a structured and powerful way.

This entire repository has been systematically documented. Every public function, method, and class includes a complete docstring that explains its purpose, parameters, and return values, adhering to standard documentation conventions.

## Features

This server offers a wide range of features, organized into logical categories for easy discovery and use:

*   **Core Trello Entities**: Full CRUD (Create, Read, Update, Delete) operations for boards, lists, cards, checklists, and labels.
*   **User and Team Management**: Tools for managing organization members, inviting users, and handling permissions.
*   **Advanced Functionality**: Includes features like webhook management, batch operations for improved efficiency, and a powerful search capability.
*   **Analytics and Reporting**: A suite of tools for generating analytics on board activity, user productivity, and workflow efficiency. It also includes data export and custom dashboard creation.
*   **Automation**: A framework for creating event-based and scheduled automations to streamline workflows.

## Quick Start

Follow these steps to get the Trello MCP server up and running on your local machine.

### 1. Prerequisites

*   **Node.js**: Version 18.17 or higher.
*   **pnpm**: This project uses pnpm for package management.
*   **Trello API Credentials**: You will need an API Key and a Token from Trello.

### 2. Get Trello Credentials

1.  Log in to your Trello account.
2.  Go to the [Trello Power-Ups admin page](https://trello.com/power-ups/admin).
3.  Click "Create a new Power-Up" or select an existing one to get your **API Key**.
4.  In the Power-Up's admin page, click the "Token" button to generate a **Token**. Ensure it has both read and write permissions.

### 3. Setup Environment

Create a `.env` file in the root of the project by copying the `.env.example` file. Then, fill in your Trello credentials and any other required configuration.

```bash
# Server configuration
PORT=8787
BASE_URL=http://localhost:8787
MCP_API_KEY=your-secure-random-key

# Trello API configuration
TRELLO_API_BASE=https://api.trello.com/1
TRELLO_KEY=your-trello-api-key
TRELLO_TOKEN=your-trello-token

# Logging level
LOG_LEVEL=info
```

### 4. Install and Run

```bash
# Install dependencies using pnpm
pnpm install

# Run the server in development mode (with hot-reloading)
pnpm dev

# Or, for production:
# Build the project
pnpm build
# Start the server
pnpm start
```

### 5. Test the Connection

You can test that the server is running correctly with these simple `curl` commands.

```bash
# Check the server's health
curl http://localhost:8787/health

# Test the MCP connection (replace YOUR_API_KEY with the one from your .env file)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: text/event-stream" \
  http://localhost:8787/mcp/sse
```

## Usage

Once the server is running, you can interact with it using any MCP-compatible client. Here are a few examples of how to use the available tools:

*   **List all your boards**:
    `list_boards`

*   **Create a new card**:
    `create_card --listId "your_list_id" --name "New card from MCP"`

*   **Get analytics for a board**:
    `get_board_analytics --boardId "your_board_id"`

## Project Structure

The repository is organized as follows:

```
src/
├── config/           # Environment variable loading and validation
├── mcp/              # Core MCP server logic
│   ├── resources/    # Handlers for readable resources (e.g., trello:board/{id})
│   ├── tools/        # Implementations of all available MCP tools
│   ├── transport/    # HTTP/SSE and webhook transport layers
│   ├── registry.ts   # Central registration for all tools and resources
│   └── server.ts     # Main MCP server class
├── trello/           # Trello-specific client and types
│   ├── client.ts     # High-level Trello API client
│   ├── http.ts       # Axios-based HTTP client with error handling
│   ├── ratelimit.ts  # Rate limiting for the Trello API
│   └── types.ts      # TypeScript definitions for Trello API objects
├── utils/            # Shared utility functions, like logging
└── index.ts          # Express server setup and application entry point
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.