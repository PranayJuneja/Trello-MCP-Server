/**
 * @fileoverview Defines the handler for the `trello:organization` MCP resource.
 * This module is responsible for fetching comprehensive details about a Trello organization
 * (Workspace), including its boards, members, and recent activity. It then formats this
 * data into a structured object and a detailed, human-readable summary with actionable insights.
 */
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloOrganization } from '../../trello/types.js';

/**
 * Reads and processes a Trello organization resource from its URI.
 * It fetches a comprehensive view of the organization and generates a structured object
 * and a detailed, human-readable summary.
 * @param {string} uri - The MCP resource URI for the organization (e.g., `trello:organization/{id}`).
 * @param {McpContext} context - The MCP context, providing access to the logger.
 * @returns {Promise<object>} A promise that resolves to an object containing the summary and the enriched organization data.
 * @throws {Error} If the URI format is invalid or the organization ID is missing.
 */
export async function readOrganizationResource(uri: string, context: McpContext) {
  // Extract organization ID from URI: trello:organization/{id}
  const match = uri.match(/^trello:organization\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid organization URI format: ${uri}`);
  }
  
  const organizationId = match[1];
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }
  
  context.logger.info({ organizationId }, 'Reading organization resource');
  
  // Get comprehensive organization data for a full overview.
  const organization = await trelloClient.getOrganization(organizationId, {
    boards: 'all',
    members: 'all',
    memberships: 'all',
    actions: 'recent', // Fetch recent actions for an activity summary.
  });
  
  // Create a human-readable summary.
  const summary = createOrganizationSummary(organization);
  
  return {
    summary,
    organization: {
      ...organization,
      resourceUri: uri,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Creates a detailed, human-readable summary of a Trello organization in Markdown format.
 * The summary includes an overview, key statistics, breakdowns of boards and members,
 * recent activity, and actionable health tips.
 * @param {TrelloOrganization} organization - The Trello organization object to summarize.
 * @returns {string} A string containing the Markdown-formatted summary.
 */
function createOrganizationSummary(organization: TrelloOrganization): string {
  const lines: string[] = [];
  
  lines.push(`# ${organization.displayName || organization.name}`);
  lines.push('');
  
  // Organization overview
  lines.push(`## Organization Overview`);
  lines.push(`**Name:** ${organization.displayName || organization.name}`);
  if (organization.desc) {
    lines.push(`**Description:** ${organization.desc}`);
  }
  if (organization.website) {
    lines.push(`**Website:** [${organization.website}](${organization.website})`);
  }
  if (organization.url) {
    lines.push(`**Trello URL:** [View Organization](${organization.url})`);
  }
  
  // Organization type and status
  const orgType = organization.products && organization.products.length > 0 ? '💼 Premium' : '🆓 Free';
  lines.push(`**Type:** ${orgType}`);
  
  if (organization.premiumFeatures && organization.premiumFeatures.length > 0) {
    lines.push(`**Premium Features:** ${organization.premiumFeatures.join(', ')}`);
  }
  
  lines.push('');
  
  // Key statistics
  lines.push(`## Statistics`);
  const totalBoards = organization.boards?.length || 0;
  const activeBoards = organization.boards?.filter(board => !board.closed).length || 0;
  const closedBoards = totalBoards - activeBoards;
  
  const totalMembers = organization.members?.length || 0;
  const activeMemberships = organization.memberships?.filter(m => !m.deactivated).length || 0;
  const adminMembers = organization.memberships?.filter(m => m.memberType === 'admin').length || 0;
  
  lines.push(`- 📋 **Boards:** ${totalBoards} total (${activeBoards} active, ${closedBoards} closed)`);
  lines.push(`- 👥 **Members:** ${totalMembers} total (${activeMemberships} active)`);
  lines.push(`- 👑 **Admins:** ${adminMembers}`);
  
  lines.push('');
  
  // Board breakdown
  if (organization.boards && organization.boards.length > 0) {
    lines.push(`## Boards (${organization.boards.length})`);
    
    const activeBoardsList = organization.boards.filter(board => !board.closed);
    const closedBoardsList = organization.boards.filter(board => board.closed);
    
    if (activeBoardsList.length > 0) {
      lines.push(`### 🟢 Active Boards (${activeBoardsList.length})`);
      activeBoardsList.slice(0, 10).forEach((board, index) => {
        const starred = board.starred ? ' ⭐' : '';
        const visibility = board.prefs?.permissionLevel === 'public' ? '🌐 Public' : 
                          board.prefs?.permissionLevel === 'org' ? '🏢 Organization' : '🔒 Private';
        const memberCount = board.members?.length || 0;
        
        lines.push(`${index + 1}. **${board.name}**${starred} ${visibility}`);
        if (board.desc && board.desc.length > 0) {
          const shortDesc = board.desc.length > 80 ? board.desc.substring(0, 80) + '...' : board.desc;
          lines.push(`   > ${shortDesc.replace(/\n/g, ' ')}`);
        }
        lines.push(`   👥 ${memberCount} members • Last activity: ${new Date(board.dateLastActivity).toLocaleDateString()}`);
      });
      
      if (activeBoardsList.length > 10) {
        lines.push(`   ... and ${activeBoardsList.length - 10} more active boards`);
      }
      lines.push('');
    }
    
    if (closedBoardsList.length > 0) {
      lines.push(`### 🔒 Closed Boards (${closedBoardsList.length})`);
      closedBoardsList.slice(0, 5).forEach((board, index) => {
        lines.push(`${index + 1}. **${board.name}** (closed since ${new Date(board.dateLastActivity).toLocaleDateString()})`);
      });
      
      if (closedBoardsList.length > 5) {
        lines.push(`   ... and ${closedBoardsList.length - 5} more closed boards`);
      }
      lines.push('');
    }
  }
  
  // Member breakdown
  if (organization.memberships && organization.memberships.length > 0) {
    lines.push(`## Members (${organization.memberships.length})`);
    
    const adminMemberships = organization.memberships.filter(m => m.memberType === 'admin');
    const normalMemberships = organization.memberships.filter(m => m.memberType === 'normal');
    
    if (adminMemberships.length > 0) {
      lines.push(`### 👑 Administrators (${adminMemberships.length})`);
      adminMemberships.forEach((membership, index) => {
        const member = membership.member;
        const status = membership.deactivated ? '⏸️ Deactivated' : 
                      membership.unconfirmed ? '⏳ Pending' : '✅ Active';
        lines.push(`${index + 1}. **${member?.fullName || 'Unknown'}** (@${member?.username || 'unknown'}) - ${status}`);
      });
      lines.push('');
    }
    
    if (normalMemberships.length > 0) {
      lines.push(`### 👤 Members (${normalMemberships.length})`);
      normalMemberships.slice(0, 10).forEach((membership, index) => {
        const member = membership.member;
        const status = membership.deactivated ? '⏸️ Deactivated' : 
                      membership.unconfirmed ? '⏳ Pending' : '✅ Active';
        lines.push(`${index + 1}. **${member?.fullName || 'Unknown'}** (@${member?.username || 'unknown'}) - ${status}`);
      });
      
      if (normalMemberships.length > 10) {
        lines.push(`   ... and ${normalMemberships.length - 10} more members`);
      }
      lines.push('');
    }
  }
  
  // Recent activity
  if (organization.actions && organization.actions.length > 0) {
    lines.push(`## Recent Activity (Last 10 Actions)`);
    organization.actions.slice(0, 10).forEach((action) => {
      const actionDate = new Date(action.date).toLocaleDateString();
      const memberName = action.memberCreator?.fullName || 'Unknown';
      let actionDescription = action.type.replace(/([A-Z])/g, ' $1').toLowerCase();
      
      if (action.data?.board) actionDescription += ` on board "${action.data.board.name}"`;
      if (action.data?.card) actionDescription += ` for card "${action.data.card.name}"`;
      
      lines.push(`- **${memberName}** ${actionDescription} (${actionDate})`);
    });
    lines.push('');
  }
  
  // Organization settings and preferences
  if (organization.prefs) {
    lines.push(`## Organization Settings`);
    
    const visibility = organization.prefs.permissionLevel === 'public' ? '🌐 Public' : '🔒 Private';
    lines.push(`**Default Visibility:** ${visibility}`);
    
    if (organization.prefs.orgInviteRestrict) {
      const invitePolicy = {
        'any': '🌍 Anyone can be invited',
        'domain': `🏢 Only users with an approved domain email (@${organization.prefs.associatedDomain})`,
        'none': '🚫 Invitations are restricted to admins'
      }[organization.prefs.orgInviteRestrict] || 'Custom';
      lines.push(`**Invite Policy:** ${invitePolicy}`);
    }
    
    if (organization.prefs.boardVisibilityRestrict) {
      lines.push(`**Board Creation Restrictions:**`);
      Object.entries(organization.prefs.boardVisibilityRestrict).forEach(([level, restriction]) => {
        lines.push(`  - Can create **${level}** boards: **${restriction}**`);
      });
    }
    lines.push('');
  }
  
  // Management actions and health tips
  lines.push(`## 💡 Health & Management`);
  const adminCount = organization.memberships?.filter(m => m.memberType === 'admin').length || 0;
  const pendingCount = organization.memberships?.filter(m => m.unconfirmed).length || 0;
  
  if (activeBoards > 50) lines.push(`- **Consider archiving old boards:** With ${activeBoards} active boards, cleanup might improve focus.`);
  if (adminCount === 1) lines.push(`- **Add a backup admin:** Having only one admin is risky. Consider promoting another member.`);
  if (pendingCount > 0) lines.push(`- **Review pending invitations:** You have ${pendingCount} unconfirmed member invitation(s).`);
  if (!organization.desc) lines.push(`- **Add a description:** Help new members understand the purpose of this Workspace.`);
  
  lines.push('');
  
  return lines.join('\n');
}
