import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';
import { TrelloOrganization } from '../../trello/types.js';

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
  
  // Get comprehensive organization data
  const organization = await trelloClient.getOrganization(organizationId, {
    boards: 'all',
    members: 'all',
    memberships: 'all',
    actions: 'recent',
  });
  
  // Create a human-readable summary
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
  
  // Statistics
  lines.push(`## Statistics`);
  const totalBoards = organization.boards?.length || 0;
  const activeBoards = organization.boards?.filter(board => !board.closed).length || 0;
  const closedBoards = totalBoards - activeBoards;
  
  const totalMembers = organization.members?.length || 0;
  const activeMemberships = organization.memberships?.filter(m => !m.deactivated).length || 0;
  const adminMembers = organization.memberships?.filter(m => m.memberType === 'admin').length || 0;
  const normalMembers = organization.memberships?.filter(m => m.memberType === 'normal').length || 0;
  
  lines.push(`- 📋 **Boards:** ${totalBoards} total (${activeBoards} active, ${closedBoards} closed)`);
  lines.push(`- 👥 **Members:** ${totalMembers} total (${activeMemberships} active)`);
  lines.push(`- 👑 **Admins:** ${adminMembers}`);
  lines.push(`- 👤 **Normal Members:** ${normalMembers}`);
  
  lines.push('');
  
  // Board breakdown
  if (organization.boards && organization.boards.length > 0) {
    lines.push(`## Boards (${organization.boards.length})`);
    
    // Group boards by status
    const activeBoards = organization.boards.filter(board => !board.closed);
    const closedBoards = organization.boards.filter(board => board.closed);
    
    if (activeBoards.length > 0) {
      lines.push(`### 🟢 Active Boards (${activeBoards.length})`);
      activeBoards.slice(0, 10).forEach((board, index) => {
        const starred = board.starred ? ' ⭐' : '';
        const visibility = board.prefs?.permissionLevel === 'public' ? '🌐 Public' : 
                          board.prefs?.permissionLevel === 'org' ? '🏢 Organization' : '🔒 Private';
        const memberCount = board.members?.length || 0;
        
        lines.push(`${index + 1}. **${board.name}**${starred} ${visibility}`);
        if (board.desc && board.desc.length > 0) {
          const shortDesc = board.desc.length > 80 ? board.desc.substring(0, 80) + '...' : board.desc;
          lines.push(`   ${shortDesc}`);
        }
        lines.push(`   👥 ${memberCount} members • Last activity: ${new Date(board.dateLastActivity).toLocaleDateString()}`);
        if (board.url) {
          lines.push(`   🔗 [View Board](${board.url})`);
        }
      });
      
      if (activeBoards.length > 10) {
        lines.push(`   ... and ${activeBoards.length - 10} more active boards`);
      }
      lines.push('');
    }
    
    if (closedBoards.length > 0) {
      lines.push(`### 🔒 Closed Boards (${closedBoards.length})`);
      closedBoards.slice(0, 5).forEach((board, index) => {
        lines.push(`${index + 1}. **${board.name}** (closed)`);
        lines.push(`   Last activity: ${new Date(board.dateLastActivity).toLocaleDateString()}`);
      });
      
      if (closedBoards.length > 5) {
        lines.push(`   ... and ${closedBoards.length - 5} more closed boards`);
      }
      lines.push('');
    }
  }
  
  // Member breakdown
  if (organization.memberships && organization.memberships.length > 0) {
    lines.push(`## Members (${organization.memberships.length})`);
    
    // Group by member type
    const adminMemberships = organization.memberships.filter(m => m.memberType === 'admin');
    const normalMemberships = organization.memberships.filter(m => m.memberType === 'normal');
    
    if (adminMemberships.length > 0) {
      lines.push(`### 👑 Administrators (${adminMemberships.length})`);
      adminMemberships.forEach((membership, index) => {
        const member = membership.member;
        const status = membership.deactivated ? '⏸️ Deactivated' : 
                      membership.unconfirmed ? '⏳ Pending' : '✅ Active';
        const fullName = member?.fullName || 'Unknown';
        const username = member?.username || 'unknown';
        
        lines.push(`${index + 1}. **${fullName}** (@${username}) ${status}`);
      });
      lines.push('');
    }
    
    if (normalMemberships.length > 0) {
      lines.push(`### 👤 Members (${normalMemberships.length})`);
      normalMemberships.slice(0, 10).forEach((membership, index) => {
        const member = membership.member;
        const status = membership.deactivated ? '⏸️ Deactivated' : 
                      membership.unconfirmed ? '⏳ Pending' : '✅ Active';
        const fullName = member?.fullName || 'Unknown';
        const username = member?.username || 'unknown';
        
        lines.push(`${index + 1}. **${fullName}** (@${username}) ${status}`);
      });
      
      if (normalMemberships.length > 10) {
        lines.push(`   ... and ${normalMemberships.length - 10} more members`);
      }
      lines.push('');
    }
  }
  
  // Recent activity
  if (organization.actions && organization.actions.length > 0) {
    lines.push(`## Recent Activity`);
    organization.actions.slice(0, 10).forEach((action, index) => {
      const actionDate = new Date(action.date).toLocaleDateString();
      const memberName = action.memberCreator?.fullName || 'Unknown';
      const actionType = action.type.replace(/([A-Z])/g, ' $1').toLowerCase();
      
      let actionDescription = `${actionType}`;
      
      // Add context based on action type
      if (action.data?.board) {
        actionDescription += ` on board "${action.data.board.name}"`;
      }
      if (action.data?.card) {
        actionDescription += ` card "${action.data.card.name}"`;
      }
      if (action.data?.list) {
        actionDescription += ` in list "${action.data.list.name}"`;
      }
      
      lines.push(`${index + 1}. **${memberName}** ${actionDescription} (${actionDate})`);
    });
    lines.push('');
  }
  
  // Organization settings and preferences
  if (organization.prefs) {
    lines.push(`## Organization Settings`);
    
    if (organization.prefs.permissionLevel) {
      const permissionLevel = organization.prefs.permissionLevel === 'public' ? '🌐 Public' : '🔒 Private';
      lines.push(`**Visibility:** ${permissionLevel}`);
    }
    
    if (organization.prefs.orgInviteRestrict) {
      const inviteRestriction = {
        'any': '🌍 Anyone can be invited',
        'domain': '🏢 Domain restrictions apply',
        'none': '🚫 Invitations restricted'
      }[organization.prefs.orgInviteRestrict] || organization.prefs.orgInviteRestrict;
      lines.push(`**Invite Policy:** ${inviteRestriction}`);
    }
    
    if (organization.prefs.associatedDomain) {
      lines.push(`**Associated Domain:** ${organization.prefs.associatedDomain}`);
    }
    
    if (organization.prefs.boardVisibilityRestrict) {
      lines.push(`**Board Visibility Restrictions:**`);
      const restrictions = organization.prefs.boardVisibilityRestrict;
      if (restrictions.private) {
        lines.push(`  - Private boards: ${restrictions.private}`);
      }
      if (restrictions.org) {
        lines.push(`  - Organization boards: ${restrictions.org}`);
      }
      if (restrictions.public) {
        lines.push(`  - Public boards: ${restrictions.public}`);
      }
    }
    
    lines.push('');
  }
  
  // Management actions
  lines.push(`## 🛠️ Management Actions`);
  lines.push(`Available organization management operations:`);
  lines.push(`- **Update organization settings** - Modify name, description, website, preferences`);
  lines.push(`- **Manage members** - Invite, remove, change permissions, activate/deactivate`);
  lines.push(`- **Board oversight** - View all organization boards and their activity`);
  lines.push(`- **Analytics** - Get detailed organization analytics and insights`);
  lines.push(`- **Export data** - Export organization data (premium feature)`);
  lines.push('');
  
  // Tips and recommendations
  lines.push(`## 💡 Organization Health Tips`);
  
  const activeBoardCount = organization.boards?.filter(board => !board.closed).length || 0;
  const totalMemberCount = organization.memberships?.length || 0;
  const adminCount = organization.memberships?.filter(m => m.memberType === 'admin').length || 0;
  const pendingCount = organization.memberships?.filter(m => m.unconfirmed).length || 0;
  
  if (activeBoardCount === 0) {
    lines.push(`⚠️ **No active boards** - Consider creating boards to start organizing work`);
  } else if (activeBoardCount > 50) {
    lines.push(`📊 **Many active boards** - Consider archiving unused boards for better organization`);
  }
  
  if (adminCount === 0) {
    lines.push(`⚠️ **No administrators** - Ensure at least one member has admin privileges`);
  } else if (adminCount === 1) {
    lines.push(`💡 **Single admin** - Consider adding backup administrators for redundancy`);
  }
  
  if (pendingCount > 0) {
    lines.push(`📩 **${pendingCount} pending invitations** - Follow up on unconfirmed member invitations`);
  }
  
  if (totalMemberCount > 0) {
    const boardToMemberRatio = activeBoardCount / totalMemberCount;
    if (boardToMemberRatio > 5) {
      lines.push(`📋 **High board-to-member ratio** - Consider consolidating boards or adding more team members`);
    }
  }
  
  const hasDescription = organization.desc && organization.desc.length > 0;
  const hasWebsite = organization.website && organization.website.length > 0;
  
  if (!hasDescription) {
    lines.push(`📝 **Add organization description** - Help members understand the organization's purpose`);
  }
  
  if (!hasWebsite) {
    lines.push(`🌐 **Add organization website** - Provide external reference for the organization`);
  }
  
  lines.push('');
  
  return lines.join('\n');
}
