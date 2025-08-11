# A Developer's Diary: Building and Debugging a Trello MCP Server

Hello there! If you're reading this, you're probably interested in how AI assistants like Claude can interact with real-world tools like Trello. This document is a deep-dive into our journey of building a Trello MCP server, hitting roadblocks, and ultimately getting it to work seamlessly with Cursor. We'll cover the what, the why, and every "aha!" moment we had along the way.

## Part 1: What in the World is an MCP Server?

Imagine an AI assistant is a brilliant, multilingual chef. This chef can cook anything, but they need ingredients and tools. Now, imagine every kitchen tool (Trello, GitHub, Slack) speaks a different, obscure language. The chef would spend all their time learning languages instead of cooking.

**MCP (Model Context Protocol)** solves this. It's a universal language—a standard set of instructions—that the AI (our chef) can use. An **MCP Server** is the specialized kitchen assistant who understands this universal language *and* knows how to operate a specific tool, like the Trello espresso machine.

- **The AI says (in MCP):** "Hey, create a card named 'Buy milk'."
- **The MCP Server hears this, translates it, and tells Trello:** "Use your API to create a new card with the title 'Buy milk' in the 'Groceries' list."

Our Trello MCP server is that specialized assistant, bridging the gap between the AI and Trello's powerful project management features.

### How Do They Talk? The "Transports"

The AI and the MCP server need a way to communicate. This communication channel is called a "transport." We built our server to support two main types:

1.  **`stdio` (Standard Input/Output):** Think of this as a direct, private phone line. The AI and the server are running on the same computer and talk to each other through text streams (`stdin` for listening, `stdout` for talking). It's incredibly fast and secure, perfect for desktop applications like Cursor where the AI runs locally. **This is the transport that gave us the most trouble, and we'll dive deep into why.**

2.  **HTTP/SSE (Server-Sent Events):** This is more like a private web radio broadcast. The MCP server runs as a web server (like a website on `http://localhost:8787`), and the AI "tunes in" to a specific URL (`/mcp/sse`) to listen for messages. It's more flexible, allowing the AI and the server to be on different machines, but has slightly more overhead than `stdio`.


## Part 2: The Debugging Journey - From "No Tools" to a Working Server

We got our server built, added it to Cursor, and saw the little green light. Success! ...Except it said "no tools or prompts." This kicked off an intricate debugging process.

### Problem #1: The Silent Crash - "No Tools" in Cursor

**The Symptom:** Cursor recognized that our server was running but reported that it had zero tools available.

**The Investigation:** Our first thought was that the tools weren't being registered correctly. But looking at the code in `src/mcp/registry.ts`, the registration logic was sound. So, if the code was right, maybe the server wasn't running long enough for the registration to happen?

This led us to the root cause: **a silent crash on startup.** The server process was starting, hitting an error, and exiting immediately. Because it happened so fast, Cursor's health check saw it start, but by the time it asked for tools, the server was already gone.

**The Culprit:** Strict environment variable validation in `src/config/env.ts`. Our code had a rule: "You MUST provide a `TRELLO_KEY`, `TRELLO_TOKEN`, and `MCP_API_KEY` to run." When we ran the server via `stdio` in Cursor, we hadn't configured the `MCP_API_KEY` in `.cursor/mcp.json`. The server saw the missing key, threw an error, and died.

**The Fix:** We relaxed the validation. An MCP server running in `stdio` mode for a local desktop client doesn't necessarily need an API key for authentication. We changed the configuration to make these keys optional at startup. The server could now start up fully and successfully register all its tools.

**Key Takeaway:** For `stdio`-based servers, avoid hard-failing on environment variables that are only needed for specific operations (like API calls or network authentication). Let the server start, and handle the missing keys when a tool that needs them is actually called.

### Problem #2: The Corrupted Handshake - The "[dotenv...]" JSON Error

**The Symptom:** With the server running, Claude now reported a new, very specific error: `Unexpected token 'd', "[dotenv@17..." is not valid JSON`.

**The Investigation:** This was the most critical bug to solve. It taught us the single most important rule of `stdio` MCP servers.

As we discussed, `stdio` is a direct text stream. The protocol has a "handshake" process. The moment the connection opens, the client (Claude/Cursor) expects the *very first thing* it reads from the server's `stdout` to be a perfectly formed JSON message.

Our server was outputting this instead:
`[dotenv@17.2.1] injecting env...`
`{"jsonrpc":"2.0", ...}`

The client tried to parse `[dotenv...` as JSON, saw the `[` and then the `d`, and immediately failed because that's not valid JSON.

**The Culprits:**
1.  **`dotenv` Library:** By default, some versions of the `dotenv` library print a helpful debug message to the console when they load a `.env` file. Unfortunately, it prints this to `stdout`.
2.  **`pnpm` Banners:** The `pnpm` package manager, which we used to run our script, can also print its own output, like version numbers or warnings, to `stdout`.

**The Fix (A Two-Pronged Attack):**
1.  **Silence `pnpm`:** We updated the `args` in our `.cursor/mcp.json` to include the `--silent` flag. This tells `pnpm` to just run the script and not print any of its own chatter.
2.  **Redirect `dotenv`'s Output:** We couldn't easily disable `dotenv`'s message, but we could control *where* it goes. In `src/config/env.ts`, we temporarily redirected `console.log` to `console.error` right before `dotenv.config()` was called, and then restored it immediately after. Since the MCP protocol only cares about `stdout`, anything printed to `stderr` is ignored by the client and is useful for debugging.

**Key Takeaway:** **STDOUT IS SACRED.** In `stdio` mode, only MCP protocol messages can ever be printed to `stdout`. All logs, banners, warnings, and debug messages *must* be sent to `stderr`. Our logger was already correctly configured to use `stderr`, but we had to wrangle these third-party libraries to respect that rule.

### Problem #3: The Validation Nightmare - "keyValidator._parse is not a function"

**The Symptom:** Now that our server was running and communicating properly, we hit a new class of errors. When Claude tried to call tools like `trello:list_boards` or `trello:get_board`, it would fail with the cryptic error: `keyValidator._parse is not a function`.

**The Investigation:** This error was particularly frustrating because it seemed to come from deep within the MCP SDK's validation system. We knew our tools were registered, we knew the server was running, but something in the parameter validation was fundamentally broken.

Our first approach was to examine how we were registering tools with the compat server (the `stdio` transport). We had two different registration paths:
1. **Main Server Registration:** Used for HTTP/SSE transport, where we converted Zod schemas to JSON Schema using `zodToJsonSchema`
2. **Compat Server Registration:** Used for `stdio` transport, where we were also trying to pass JSON Schema

**First Attempt - JSON Schema Everywhere:** We thought, "If JSON Schema works for the main server, it should work for the compat server too!" So we modified `src/mcp/server.ts` to pass JSON Schema to both registration paths. This failed spectacularly because the compat server's validator expected a different format.

**Second Attempt - Zod Shapes for Compat:** We realized the compat server expected Zod shapes (the actual Zod schema objects), not JSON Schema. So we switched the compat registration to pass `inputSchema.shape` instead of the converted JSON Schema. This *still* failed with the same error.

**The Real Culprit - Version Mismatch:** After comparing our working `mcp-server-trello` (which used Zod v3) with our failing `TrelloMCP` (which used Zod v4), we discovered the root cause. The MCP SDK was built expecting Zod v3's internal structure, but we were using Zod v4. When the SDK tried to call `_parse()` (a Zod v3 internal method) on our Zod v4 schema objects, it failed because that method didn't exist in the same way.

**The Investigation Process:**
1. **Grep for the Error:** We searched the entire codebase for "keyValidator" and "_parse" to understand where this was coming from
2. **Compare Working vs Broken:** We examined how the working `mcp-server-trello` registered its tools vs our implementation
3. **Check Package Versions:** We compared the `package.json` files and discovered the Zod version mismatch
4. **Test Schema Formats:** We tried different ways of passing schemas to understand what the compat server expected

**The Final Fix - Pin Zod to v3:** We updated `TrelloMCP/package.json` to pin Zod to version 3.22.4 (matching the working server) and added a `pnpm.overrides` section to ensure all dependencies used the same Zod version:

```json
{
  "dependencies": {
    "zod": "^3.22.4"
  },
  "pnpm": {
    "overrides": {
      "zod": "^3.22.4"
    }
  }
}
```

**Why This Worked:** The MCP SDK's internal validator was built around Zod v3's API. By ensuring we used Zod v3 throughout our dependency tree, the schema objects we passed to the compat server had the expected structure and methods that the SDK's validator could work with.

**Key Takeaway:** When working with MCP servers, pay close attention to the versions of core dependencies like Zod. The SDK's internal validation logic is tightly coupled to specific versions of these libraries. Version mismatches can cause cryptic validation errors that are hard to debug because they occur deep within the SDK's internals.

**The Validation Architecture We Ended Up With:**
- **Main Server (HTTP/SSE):** Receives JSON Schema via `zodToJsonSchema` for maximum client compatibility
- **Compat Server (stdio):** Receives Zod v3 shapes for proper SDK validation
- **Schema Definition:** All tools use Zod v3 schemas defined in their respective tool files
- **Version Consistency:** All dependencies pinned to compatible versions to prevent internal API mismatches

### Problem #3: The Validation Nightmare - "keyValidator._parse is not a function"

**The Symptom:** Now that our server was running and communicating properly, we hit a new class of errors. When Claude tried to call tools like `trello:list_boards` or `trello:get_board`, it would fail with the cryptic error: `keyValidator._parse is not a function`.

**The Investigation:** This error was particularly frustrating because it seemed to come from deep within the MCP SDK's validation system. We knew our tools were registered, we knew the server was running, but something in the parameter validation was fundamentally broken.

Our first approach was to examine how we were registering tools with the compat server (the `stdio` transport). We had two different registration paths:
1. **Main Server Registration:** Used for HTTP/SSE transport, where we converted Zod schemas to JSON Schema using `zodToJsonSchema`
2. **Compat Server Registration:** Used for `stdio` transport, where we were also trying to pass JSON Schema

**First Attempt - JSON Schema Everywhere:** We thought, "If JSON Schema works for the main server, it should work for the compat server too!" So we modified `src/mcp/server.ts` to pass JSON Schema to both registration paths. This failed spectacularly because the compat server's validator expected a different format.

**Second Attempt - Zod Shapes for Compat:** We realized the compat server expected Zod shapes (the actual Zod schema objects), not JSON Schema. So we switched the compat registration to pass `inputSchema.shape` instead of the converted JSON Schema. This *still* failed with the same error.

**The Real Culprit - Version Mismatch:** After comparing our working `mcp-server-trello` (which used Zod v3) with our failing `TrelloMCP` (which used Zod v4), we discovered the root cause. The MCP SDK was built expecting Zod v3's internal structure, but we were using Zod v4. When the SDK tried to call `_parse()` (a Zod v3 internal method) on our Zod v4 schema objects, it failed because that method didn't exist in the same way.

**The Investigation Process:**
1. **Grep for the Error:** We searched the entire codebase for "keyValidator" and "_parse" to understand where this was coming from
2. **Compare Working vs Broken:** We examined how the working `mcp-server-trello` registered its tools vs our implementation
3. **Check Package Versions:** We compared the `package.json` files and discovered the Zod version mismatch
4. **Test Schema Formats:** We tried different ways of passing schemas to understand what the compat server expected

**The Final Fix - Pin Zod to v3:** We updated `TrelloMCP/package.json` to pin Zod to version 3.22.4 (matching the working server) and added a `pnpm.overrides` section to ensure all dependencies used the same Zod version:

```json
{
  "dependencies": {
    "zod": "^3.22.4"
  },
  "pnpm": {
    "overrides": {
      "zod": "^3.22.4"
    }
  }
}
```

**Why This Worked:** The MCP SDK's internal validator was built around Zod v3's API. By ensuring we used Zod v3 throughout our dependency tree, the schema objects we passed to the compat server had the expected structure and methods that the SDK's validator could work with.

**Key Takeaway:** When working with MCP servers, pay close attention to the versions of core dependencies like Zod. The SDK's internal validation logic is tightly coupled to specific versions of these libraries. Version mismatches can cause cryptic validation errors that are hard to debug because they occur deep within the SDK's internals.

**The Validation Architecture We Ended Up With:**
- **Main Server (HTTP/SSE):** Receives JSON Schema via `zodToJsonSchema` for maximum client compatibility
- **Compat Server (stdio):** Receives Zod v3 shapes for proper SDK validation
- **Schema Definition:** All tools use Zod v3 schemas defined in their respective tool files
- **Version Consistency:** All dependencies pinned to compatible versions to prevent internal API mismatches

### Smaller Hiccups and Learnings

-   **"Unknown Configuration Setting":** We tried adding `"mcp.devToolsEnabled": true` to Cursor's settings. This is an old or incorrect setting. **Lesson:** Don't trust outdated documentation. The correct way to manage MCP servers is through the **Connections** panel (the plug icon).
-   **Pasting JSON into PowerShell:** We tried to test the server by pasting a raw JSON-RPC command into the terminal. This fails because the shell tries to interpret the JSON as a command. **Lesson:** `stdio` is a protocol, not a command-line interface. You must use an MCP client to speak to it.

## Part 3: The Final, Working Architecture

After all the fixes, here is what a robust MCP server architecture looks like and why:

-   **Flexible Configuration (`env.ts`):** Environment variables are loaded safely, with any library output redirected to `stderr`. Validation is relaxed on startup to prevent silent crashes, especially in `stdio` mode.
-   **Dedicated `stderr` Logging (`logger.ts`):** A centralized logger (like Pino) is configured from the very beginning to *only* write to `stderr` (file descriptor `2`). This keeps `stdout` clean for the MCP protocol.
-   **Clean `stdio` Entry Point (`stdio.ts`):** The script that runs for `stdio` mode does one thing: it starts the MCP server and connects it to the `StdioServerTransport`. It performs no logging to `stdout` and is run with a silent package manager command.
-   **Separate HTTP/SSE Transport (`index.ts` & `httpSse.ts`):** The web server is handled in a separate file. It has its own logic for things like API key authentication, which isn't needed for `stdio`.
-   **Robust Tool Registration (`server.ts`):** The server code is written to be compatible with multiple clients. It uses the official MCP SDK and provides schemas for its tools in a standard, reference-free format (`$refStrategy: 'none'`) to prevent parsing issues in different clients.
-   **Correct Client Configuration (`.cursor/mcp.json`):** The client is configured to run the `stdio` script with `--silent` to suppress package manager output, ensuring a clean communication channel from the very first byte.

This journey was a fantastic lesson in the intricacies of inter-process communication and the importance of strictly adhering to protocol specifications. By silencing all `stdout` noise and ensuring our server only failed when it was supposed to, we finally achieved a stable and reliable integration. We hope this guide helps you on your own MCP adventures!
