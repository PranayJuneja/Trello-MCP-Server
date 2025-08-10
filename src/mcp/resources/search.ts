import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

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
  
  // Decode the query parameter
  const query = decodeURIComponent(queryParam);
  context.logger.info({ query }, 'Reading search resource');
  
  // Perform comprehensive search
  const searchParams = {
    query,
    modelTypes: ['boards', 'cards', 'members', 'organizations'] as ('boards' | 'cards' | 'members' | 'organizations')[],
    boards_limit: 25,
    cards_limit: 25,
    partial: true,
  };
  
  const results = await trelloClient.search(searchParams);
  
  // Create a human-readable summary
  const summary = createSearchSummary(query, results);
  
  return {
    summary,
    search: {
      query,
      results,
      totalResults: (results.boards?.length || 0) + 
                   (results.cards?.length || 0) + 
                   (results.members?.length || 0) + 
                   (results.organizations?.length || 0),
      executedAt: new Date().toISOString(),
    },
  };
}

function createSearchSummary(query: string, results: any): string {
  const lines: string[] = [];
  
  lines.push(`# Search Results for: "${query}"`);
  lines.push('');
  
  const totalResults = (results.boards?.length || 0) + 
                      (results.cards?.length || 0) + 
                      (results.members?.length || 0) + 
                      (results.organizations?.length || 0);
  
  lines.push(`## Search Summary`);
  lines.push(`Query: **${query}**`);
  lines.push(`Total Results: **${totalResults}**`);
  lines.push(`Executed: ${new Date().toLocaleString()}`);
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
    results.boards.forEach((board: any, index: number) => {
      const status = board.closed ? '🔒 Closed' : '🟢 Active';
      const starred = board.starred ? ' ⭐' : '';
      lines.push(`${index + 1}. **${board.name}**${starred} ${status}`);
      if (board.desc) {
        const shortDesc = board.desc.length > 100 ? board.desc.substring(0, 100) + '...' : board.desc;
        lines.push(`   ${shortDesc}`);
      }
      if (board.url) {
        lines.push(`   🔗 [View Board](${board.url})`);
      }
    });
    lines.push('');
  }
  
  // Card results
  if (results.cards && results.cards.length > 0) {
    lines.push(`## 📝 Cards (${results.cards.length})`);
    
    // Group cards by board if possible
    const cardsByBoard = new Map<string, any[]>();
    const cardsWithoutBoard: any[] = [];
    
    results.cards.forEach((card: any) => {
      if (card.idBoard) {
        if (!cardsByBoard.has(card.idBoard)) {
          cardsByBoard.set(card.idBoard, []);
        }
        cardsByBoard.get(card.idBoard)!.push(card);
      } else {
        cardsWithoutBoard.push(card);
      }
    });
    
    // Show cards grouped by board
    for (const [boardId, cards] of cardsByBoard) {
      const boardName = cards[0]?.board?.name || `Board ${boardId}`;
      lines.push(`### ${boardName} (${cards.length} cards)`);
      
      cards.slice(0, 10).forEach((card: any, index: number) => {
        const status = card.closed ? '✅ Completed' : '📝 Active';
        const dueInfo = card.due ? ` [Due: ${new Date(card.due).toLocaleDateString()}]` : '';
        const labelInfo = card.labels.length > 0 ? ` [${card.labels.length} labels]` : '';
        const memberInfo = card.idMembers.length > 0 ? ` [${card.idMembers.length} members]` : '';
        
        lines.push(`${index + 1}. **${card.name}** ${status}${dueInfo}${labelInfo}${memberInfo}`);
        
        if (card.desc) {
          const shortDesc = card.desc.length > 100 ? card.desc.substring(0, 100) + '...' : card.desc;
          lines.push(`   ${shortDesc}`);
        }
        
        if (card.url) {
          lines.push(`   🔗 [View Card](${card.url})`);
        }
      });
      
      if (cards.length > 10) {
        lines.push(`   ... and ${cards.length - 10} more cards`);
      }
      lines.push('');
    }
    
    // Show ungrouped cards
    if (cardsWithoutBoard.length > 0) {
      lines.push(`### Other Cards (${cardsWithoutBoard.length})`);
      cardsWithoutBoard.slice(0, 10).forEach((card: any, index: number) => {
        const status = card.closed ? '✅ Completed' : '📝 Active';
        const dueInfo = card.due ? ` [Due: ${new Date(card.due).toLocaleDateString()}]` : '';
        
        lines.push(`${index + 1}. **${card.name}** ${status}${dueInfo}`);
        
        if (card.url) {
          lines.push(`   🔗 [View Card](${card.url})`);
        }
      });
      
      if (cardsWithoutBoard.length > 10) {
        lines.push(`   ... and ${cardsWithoutBoard.length - 10} more cards`);
      }
      lines.push('');
    }
  }
  
  // Member results
  if (results.members && results.members.length > 0) {
    lines.push(`## 👥 Members (${results.members.length})`);
    results.members.forEach((member: any, index: number) => {
      const confirmed = member.confirmed ? '✅ Active' : '⏳ Pending';
      lines.push(`${index + 1}. **${member.fullName}** (@${member.username}) ${confirmed}`);
      
      if (member.bio) {
        const shortBio = member.bio.length > 100 ? member.bio.substring(0, 100) + '...' : member.bio;
        lines.push(`   ${shortBio}`);
      }
    });
    lines.push('');
  }
  
  // Organization results
  if (results.organizations && results.organizations.length > 0) {
    lines.push(`## 🏢 Organizations (${results.organizations.length})`);
    results.organizations.forEach((org: any, index: number) => {
      lines.push(`${index + 1}. **${org.displayName || org.name}**`);
      
      if (org.desc) {
        const shortDesc = org.desc.length > 100 ? org.desc.substring(0, 100) + '...' : org.desc;
        lines.push(`   ${shortDesc}`);
      }
      
      if (org.url) {
        lines.push(`   🔗 [View Organization](${org.url})`);
      }
    });
    lines.push('');
  }
  
  // Search tips
  if (totalResults === 0) {
    lines.push(`## 💡 Search Tips`);
    lines.push(`No results found for "${query}". Try:`);
    lines.push(`- Using different keywords`);
    lines.push(`- Checking spelling`);
    lines.push(`- Using more general terms`);
    lines.push(`- Searching for partial matches`);
    lines.push('');
  } else if (totalResults >= 25) {
    lines.push(`## 💡 Refine Your Search`);
    lines.push(`Found many results (${totalResults}). Consider:`);
    lines.push(`- Using more specific keywords`);
    lines.push(`- Adding board or member filters`);
    lines.push(`- Using quotes for exact phrases`);
    lines.push(`- Using advanced search operators`);
    lines.push('');
  }
  
  // Advanced search operators
  lines.push(`## 🔍 Advanced Search Operators`);
  lines.push(`You can use these operators to refine your search:`);
  lines.push(`- \`@username\` - Find items assigned to a specific user`);
  lines.push(`- \`#label\` - Find items with a specific label`);
  lines.push(`- \`board:name\` - Search within a specific board`);
  lines.push(`- \`list:name\` - Search within a specific list`);
  lines.push(`- \`has:attachments\` - Find items with attachments`);
  lines.push(`- \`has:checklists\` - Find items with checklists`);
  lines.push(`- \`has:comments\` - Find items with comments`);
  lines.push(`- \`is:archived\` - Find archived items`);
  lines.push(`- \`due:day\` - Find items due today`);
  lines.push(`- \`due:week\` - Find items due this week`);
  lines.push(`- \`created:day\` - Find items created today`);
  lines.push('');
  
  return lines.join('\n');
}
