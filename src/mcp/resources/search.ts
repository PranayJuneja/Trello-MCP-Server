/**
 * @fileoverview Defines the handler for the `trello:search` MCP resource.
 * This module is responsible for taking a search query from an MCP URI,
 * executing it against the Trello API, and formatting the results into a
 * structured object and a detailed, human-readable summary.
 */
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { SearchResponse } from '../../trello/types.js';

/**
 * Reads and processes a Trello search resource from its URI.
 * It decodes the search query, performs a comprehensive search across boards,
 * cards, members, and organizations, and then generates a summary of the results.
 * @param {string} uri - The MCP resource URI for the search (e.g., `trello:search/{query}`).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves to an object containing the summary and the structured search results.
 * @throws {Error} If the URI format is invalid or the search query is missing.
 */
export async function readSearchResource(uri: string, context: McpContext) {
  // Extract search query from URI: trello:search/{query}
  const match = uri.match(/^trello:search\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid search URI format: ${uri}`);
  }
  
  const queryParam = match[1];
  if (!queryParam) {
    throw new Error('Search query is required');
  }
  
  // Decode the query parameter to handle special characters.
  const query = decodeURIComponent(queryParam);
  context.logger.info({ query }, 'Reading search resource');
  
  // Perform a comprehensive search across multiple model types.
  const searchParams = {
    query,
    modelTypes: ['boards', 'cards', 'members', 'organizations'] as const,
    boards_limit: 25,
    cards_limit: 25,
    partial: true, // Allows for partial matches, providing more lenient search results.
  };
  
  const results = await trelloClient.search(searchParams);
  
  // Create a human-readable summary of the search results.
  const summary = createSearchSummary(query, results);
  
  const totalResults = (results.boards?.length || 0) +
                     (results.cards?.length || 0) +
                     (results.members?.length || 0) +
                     (results.organizations?.length || 0);

  return {
    summary,
    search: {
      query,
      results,
      totalResults,
      executedAt: new Date().toISOString(),
    },
  };
}

/**
 * Creates a detailed, human-readable summary of search results in Markdown format.
 * The summary includes a breakdown by result type, lists the found items, and
 * provides helpful tips for refining the search.
 * @param {string} query - The original search query.
 * @param {SearchResponse} results - The search results object from the Trello client.
 * @returns {string} A string containing the Markdown-formatted summary.
 */
function createSearchSummary(query: string, results: SearchResponse): string {
  const lines: string[] = [];
  
  lines.push(`# Search Results for: "${query}"`);
  lines.push('');
  
  const totalResults = (results.boards?.length || 0) + 
                      (results.cards?.length || 0) + 
                      (results.members?.length || 0) + 
                      (results.organizations?.length || 0);
  
  lines.push(`## Search Summary`);
  lines.push(`- **Query**: \`${query}\``);
  lines.push(`- **Total Results Found**: ${totalResults}`);
  lines.push(`- **Executed At**: ${new Date().toLocaleString()}`);
  lines.push('');
  
  // Results breakdown
  lines.push(`## Results Breakdown`);
  lines.push(`- 📋 Boards: ${results.boards?.length || 0}`);
  lines.push(`- 📝 Cards: ${results.cards?.length || 0}`);
  lines.push(`- 👥 Members: ${results.members?.length || 0}`);
  lines.push(`- 🏢 Organizations: ${results.organizations?.length || 0}`);
  lines.push('');
  
  // Board results
  if (results.boards && results.boards.length > 0) {
    lines.push(`## 📋 Boards (${results.boards.length})`);
    results.boards.forEach((board, index) => {
      const status = board.closed ? '🔒 Closed' : '🟢 Active';
      const starred = board.starred ? ' ⭐' : '';
      lines.push(`${index + 1}. **${board.name}**${starred} - ${status}`);
      if (board.url) {
        lines.push(`   > [View Board](${board.url})`);
      }
    });
    lines.push('');
  }
  
  // Card results
  if (results.cards && results.cards.length > 0) {
    lines.push(`## 📝 Cards (${results.cards.length})`);
    results.cards.slice(0, 15).forEach((card, index) => {
      const status = card.closed ? '✅ Archived' : '📄 Open';
      const dueInfo = card.due ? ` (Due: ${new Date(card.due).toLocaleDateString()})` : '';
      lines.push(`${index + 1}. **${card.name}** - ${status}${dueInfo}`);
      if (card.url) {
        lines.push(`   > [View Card](${card.url})`);
      }
    });
    if (results.cards.length > 15) {
      lines.push(`... and ${results.cards.length - 15} more cards.`);
    }
    lines.push('');
  }
  
  // Member results
  if (results.members && results.members.length > 0) {
    lines.push(`## 👥 Members (${results.members.length})`);
    results.members.forEach((member, index) => {
      const status = member.confirmed ? '✅ Active' : '⏳ Pending';
      lines.push(`${index + 1}. **${member.fullName}** (@${member.username}) - ${status}`);
    });
    lines.push('');
  }
  
  // Organization results
  if (results.organizations && results.organizations.length > 0) {
    lines.push(`## 🏢 Organizations (${results.organizations.length})`);
    results.organizations.forEach((org, index) => {
      lines.push(`${index + 1}. **${org.displayName || org.name}**`);
      if (org.url) {
        lines.push(`   > [View Organization](${org.url})`);
      }
    });
    lines.push('');
  }
  
  // Search tips
  if (totalResults === 0) {
    lines.push(`## 💡 Search Tips`);
    lines.push(`No results found for "${query}". Try:`);
    lines.push(`- Using different or more general keywords.`);
    lines.push(`- Checking for typos.`);
    lines.push(`- Using one of the advanced operators below.`);
    lines.push('');
  } else if (totalResults >= 25) {
    lines.push(`## 💡 Refine Your Search`);
    lines.push(`Found many results. Consider narrowing your search with:`);
    lines.push(`- More specific keywords.`);
    lines.push(`- Quotes for exact phrases (e.g., \`"Project Alpha"\`).`);
    lines.push(`- An advanced search operator.`);
    lines.push('');
  }
  
  // Advanced search operators
  lines.push(`## 🔍 Advanced Search Operators`);
  lines.push(`You can use these operators in your query to refine results:`);
  lines.push("- `@username` - Find items assigned to a member.");
  lines.push("- `#label` - Find cards with a specific label.");
  lines.push("- `board:name` - Search within a specific board.");
  lines.push("- `is:archived` - Find archived items.");
  lines.push("- `due:day` / `due:week` - Find cards due soon.");
  lines.push("- `has:attachments` - Find cards with attachments.");
  lines.push('');
  
  return lines.join('\n');
}
