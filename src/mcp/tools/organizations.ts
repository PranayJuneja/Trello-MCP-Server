import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

export const getOrganizationsSchema = z.object({
  memberId: z.string().optional().default('me').describe('Member ID to get organizations for'),
  filter: z.enum(['all', 'members', 'none', 'public']).optional().default('all').describe('Filter for organization types'),
  includeFields: z.array(z.string()).optional().describe('Specific organization fields to include'),
  includePaidAccount: z.boolean().optional().default(false).describe('Include paid account information'),
});

export const getOrganizationSchema = z.object({
  organizationId: z.string().describe('Organization ID to retrieve'),
  includeActions: z.boolean().optional().default(false).describe('Include organization actions'),
  includeBoards: z.boolean().optional().default(false).describe('Include organization boards'),
  includeMembers: z.boolean().optional().default(false).describe('Include organization members'),
  includeMemberships: z.boolean().optional().default(false).describe('Include organization memberships'),
});

export const createOrganizationSchema = z.object({
  displayName: z.string().min(1).max(16384).describe('The name to display for the organization'),
  name: z.string().min(3).optional().describe('URL-safe name (lowercase, underscores, numbers only)'),
  desc: z.string().optional().describe('Description for the organization'),
  website: z.string().url().optional().describe('Website URL starting with http:// or https://'),
});

export const updateOrganizationSchema = z.object({
  organizationId: z.string().describe('Organization ID to update'),
  displayName: z.string().min(1).max(16384).optional().describe('The name to display for the organization'),
  name: z.string().min(3).optional().describe('URL-safe name (lowercase, underscores, numbers only)'),
  desc: z.string().optional().describe('Description for the organization'),
  website: z.string().url().optional().describe('Website URL starting with http:// or https://'),
  prefs: z.object({
    associatedDomain: z.string().optional().describe('Associated domain for the organization'),
    googleAppsVersion: z.number().optional().describe('Google Apps version'),
    orgInviteRestrict: z.enum(['any', 'domain', 'none']).optional().describe('Organization invite restrictions'),
    permissionLevel: z.enum(['private', 'public']).optional().describe('Organization permission level'),
    boardVisibilityRestrict: z.object({
      private: z.enum(['admin', 'none', 'org']).optional(),
      org: z.enum(['admin', 'none', 'org']).optional(),
      public: z.enum(['admin', 'none', 'org']).optional(),
    }).optional().describe('Board visibility restrictions'),
  }).optional().describe('Organization preferences'),
});

export const deleteOrganizationSchema = z.object({
  organizationId: z.string().describe('Organization ID to delete'),
});

export const getOrganizationMembersSchema = z.object({
  organizationId: z.string().describe('Organization ID to get members for'),
  filter: z.enum(['admins', 'all', 'none', 'normal']).optional().default('all').describe('Filter for member types'),
  includeActivity: z.boolean().optional().default(false).describe('Include member activity (premium only)'),
  includeFields: z.array(z.string()).optional().describe('Specific member fields to include'),
});

export const getOrganizationBoardsSchema = z.object({
  organizationId: z.string().describe('Organization ID to get boards for'),
  filter: z.enum(['all', 'closed', 'open', 'pinned', 'public', 'starred']).optional().default('all').describe('Filter for board types'),
  includeFields: z.array(z.string()).optional().describe('Specific board fields to include'),
});

export const inviteMemberToOrganizationSchema = z.object({
  organizationId: z.string().describe('Organization ID to invite member to'),
  email: z.string().email().describe('Email address of the member to invite'),
  fullName: z.string().min(1).max(16384).describe('Full name of the member to invite'),
  type: z.enum(['admin', 'normal']).optional().default('normal').describe('Member type in the organization'),
});

export const updateOrganizationMemberSchema = z.object({
  organizationId: z.string().describe('Organization ID'),
  memberId: z.string().describe('Member ID to update'),
  type: z.enum(['admin', 'normal']).describe('New member type in the organization'),
});

export const removeOrganizationMemberSchema = z.object({
  organizationId: z.string().describe('Organization ID'),
  memberId: z.string().describe('Member ID to remove from organization'),
});

export const deactivateOrganizationMemberSchema = z.object({
  organizationId: z.string().describe('Organization ID'),
  memberId: z.string().describe('Member ID to deactivate/reactivate'),
  value: z.boolean().describe('True to deactivate, false to reactivate'),
});

export const getOrganizationMembershipsSchema = z.object({
  organizationId: z.string().describe('Organization ID to get memberships for'),
  filter: z.enum(['admins', 'all', 'none', 'normal']).optional().default('all').describe('Filter for membership types'),
  includeMember: z.boolean().optional().default(true).describe('Include member information'),
  includeFields: z.array(z.string()).optional().describe('Specific membership fields to include'),
});

export const getOrganizationMembershipSchema = z.object({
  organizationId: z.string().describe('Organization ID'),
  membershipId: z.string().describe('Membership ID to retrieve'),
  includeMember: z.boolean().optional().default(true).describe('Include member information'),
  includeFields: z.array(z.string()).optional().describe('Specific membership fields to include'),
});

export const getOrganizationAnalyticsSchema = z.object({
  organizationId: z.string().describe('Organization ID to analyze'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d').describe('Time range for analytics'),
  includeBoards: z.boolean().optional().default(true).describe('Include board analytics'),
  includeMembers: z.boolean().optional().default(true).describe('Include member analytics'),
  includeActivity: z.boolean().optional().default(true).describe('Include activity analytics'),
});

// ===== TOOL HANDLERS =====

export async function getOrganizations(args: z.infer<typeof getOrganizationsSchema>, context: McpContext) {
  context.logger.info({ memberId: args.memberId, filter: args.filter }, 'Getting organizations');
  
  // Build query parameters
  const queryParams: any = {
    filter: args.filter,
  };
  
  if (args.includeFields && args.includeFields.length > 0) {
    queryParams.fields = args.includeFields.join(',');
  }
  
  if (args.includePaidAccount) {
    queryParams.paid_account = 'true';
  }
  
  // Note: This uses the member's organizations endpoint
  // The actual implementation would need to be added to the Trello client
  const organizations = await trelloClient.getMemberOrganizations(args.memberId, queryParams);
  
  return {
    success: true,
    data: organizations,
    summary: `Found ${organizations.length} organizations for member`,
  };
}

export async function getOrganization(args: z.infer<typeof getOrganizationSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId }, 'Getting organization');
  
  // Build query parameters for additional data
  const options: any = {};
  
  if (args.includeActions) {
    options.actions = 'all';
  }
  
  if (args.includeBoards) {
    options.boards = 'all';
  }
  
  if (args.includeMembers) {
    options.members = 'all';
  }
  
  if (args.includeMemberships) {
    options.memberships = 'all';
  }
  
  const organization = await trelloClient.getOrganization(args.organizationId, options);
  
  return {
    success: true,
    data: organization,
    summary: `Retrieved organization "${organization.displayName}"`,
  };
}

export async function createOrganization(args: z.infer<typeof createOrganizationSchema>, context: McpContext) {
  context.logger.info({ displayName: args.displayName }, 'Creating organization');
  
  const createData: any = {
    displayName: args.displayName,
  };
  
  if (args.name) {
    createData.name = args.name;
  }
  
  if (args.desc) {
    createData.desc = args.desc;
  }
  
  if (args.website) {
    createData.website = args.website;
  }
  
  const organization = await trelloClient.createOrganization(createData);
  
  return {
    success: true,
    data: organization,
    summary: `Created organization "${organization.displayName}"`,
  };
}

export async function updateOrganization(args: z.infer<typeof updateOrganizationSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId }, 'Updating organization');
  
  const updateData: any = {};
  
  if (args.displayName) {
    updateData.displayName = args.displayName;
  }
  
  if (args.name) {
    updateData.name = args.name;
  }
  
  if (args.desc !== undefined) {
    updateData.desc = args.desc;
  }
  
  if (args.website !== undefined) {
    updateData.website = args.website;
  }
  
  if (args.prefs) {
    updateData.prefs = args.prefs;
  }
  
  const organization = await trelloClient.updateOrganization(args.organizationId, updateData);
  
  return {
    success: true,
    data: organization,
    summary: `Updated organization "${organization.displayName}"`,
  };
}

export async function deleteOrganization(args: z.infer<typeof deleteOrganizationSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId }, 'Deleting organization');
  
  await trelloClient.deleteOrganization(args.organizationId);
  
  return {
    success: true,
    data: { deleted: true, id: args.organizationId },
    summary: `Deleted organization ${args.organizationId}`,
  };
}

export async function getOrganizationMembers(args: z.infer<typeof getOrganizationMembersSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, filter: args.filter }, 'Getting organization members');
  
  const queryParams: any = {
    filter: args.filter,
  };
  
  if (args.includeActivity) {
    queryParams.activity = 'true';
  }
  
  if (args.includeFields && args.includeFields.length > 0) {
    queryParams.fields = args.includeFields.join(',');
  }
  
  const members = await trelloClient.getOrganizationMembers(args.organizationId, queryParams);
  
  return {
    success: true,
    data: members,
    summary: `Found ${members.length} members in organization`,
  };
}

export async function getOrganizationBoards(args: z.infer<typeof getOrganizationBoardsSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, filter: args.filter }, 'Getting organization boards');
  
  const queryParams: any = {
    filter: args.filter,
  };
  
  if (args.includeFields && args.includeFields.length > 0) {
    queryParams.fields = args.includeFields.join(',');
  }
  
  const boards = await trelloClient.getOrganizationBoards(args.organizationId, queryParams);
  
  return {
    success: true,
    data: boards,
    summary: `Found ${boards.length} boards in organization`,
  };
}

export async function inviteMemberToOrganization(args: z.infer<typeof inviteMemberToOrganizationSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, email: args.email }, 'Inviting member to organization');
  
  const inviteData = {
    email: args.email,
    fullName: args.fullName,
    type: args.type,
  };
  
  const member = await trelloClient.inviteMemberToOrganization(args.organizationId, inviteData);
  
  return {
    success: true,
    data: member,
    summary: `Invited ${args.email} to organization as ${args.type}`,
  };
}

export async function updateOrganizationMember(args: z.infer<typeof updateOrganizationMemberSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, memberId: args.memberId, type: args.type }, 'Updating organization member');
  
  const member = await trelloClient.updateOrganizationMember(args.organizationId, args.memberId, { type: args.type });
  
  return {
    success: true,
    data: member,
    summary: `Updated member ${args.memberId} to ${args.type} in organization`,
  };
}

export async function removeOrganizationMember(args: z.infer<typeof removeOrganizationMemberSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, memberId: args.memberId }, 'Removing member from organization');
  
  await trelloClient.removeOrganizationMember(args.organizationId, args.memberId);
  
  return {
    success: true,
    data: { removed: true, memberId: args.memberId, organizationId: args.organizationId },
    summary: `Removed member ${args.memberId} from organization`,
  };
}

export async function deactivateOrganizationMember(args: z.infer<typeof deactivateOrganizationMemberSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, memberId: args.memberId, value: args.value }, 'Deactivating/reactivating organization member');
  
  const member = await trelloClient.deactivateOrganizationMember(args.organizationId, args.memberId, args.value);
  
  const action = args.value ? 'deactivated' : 'reactivated';
  
  return {
    success: true,
    data: member,
    summary: `${action.charAt(0).toUpperCase() + action.slice(1)} member ${args.memberId} in organization`,
  };
}

export async function getOrganizationMemberships(args: z.infer<typeof getOrganizationMembershipsSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, filter: args.filter }, 'Getting organization memberships');
  
  const queryParams: any = {
    filter: args.filter,
    member: args.includeMember.toString(),
  };
  
  if (args.includeFields && args.includeFields.length > 0) {
    queryParams.member_fields = args.includeFields.join(',');
  }
  
  const memberships = await trelloClient.getOrganizationMemberships(args.organizationId, queryParams);
  
  return {
    success: true,
    data: memberships,
    summary: `Found ${memberships.length} memberships in organization`,
  };
}

export async function getOrganizationMembership(args: z.infer<typeof getOrganizationMembershipSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, membershipId: args.membershipId }, 'Getting organization membership');
  
  const queryParams: any = {
    member: args.includeMember.toString(),
  };
  
  if (args.includeFields && args.includeFields.length > 0) {
    queryParams.member_fields = args.includeFields.join(',');
  }
  
  const membership = await trelloClient.getOrganizationMembership(args.organizationId, args.membershipId, queryParams);
  
  return {
    success: true,
    data: membership,
    summary: `Retrieved membership ${args.membershipId} in organization`,
  };
}

export async function getOrganizationAnalytics(args: z.infer<typeof getOrganizationAnalyticsSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, timeRange: args.timeRange }, 'Analyzing organization');
  
  // Get organization with comprehensive data
  const organization = await trelloClient.getOrganization(args.organizationId, {
    boards: 'all',
    members: 'all',
    memberships: 'all',
    actions: 'all',
  });
  
  const analytics = {
    organization: {
      id: organization.id,
      name: organization.displayName,
      description: organization.desc,
    },
    overview: {
      totalBoards: 0,
      activeBoards: 0,
      totalMembers: 0,
      activeMembers: 0,
      adminMembers: 0,
      normalMembers: 0,
    },
    timeRange: args.timeRange,
    generatedAt: new Date().toISOString(),
  };
  
  // Board analytics
  if (args.includeBoards && organization.boards) {
    analytics.overview.totalBoards = organization.boards.length;
    analytics.overview.activeBoards = organization.boards.filter(board => !board.closed).length;
    
    const boardActivity = organization.boards.map(board => ({
      board: {
        id: board.id,
        name: board.name,
        closed: board.closed,
        starred: board.starred,
      },
      metrics: {
        lastActivity: board.dateLastActivity,
        memberCount: board.members?.length || 0,
      },
    })).sort((a, b) => new Date(b.metrics.lastActivity).getTime() - new Date(a.metrics.lastActivity).getTime());
    
    (analytics as any).boardActivity = boardActivity.slice(0, 10); // Top 10 most active boards
  }
  
  // Member analytics
  if (args.includeMembers && organization.members) {
    analytics.overview.totalMembers = organization.members.length;
    analytics.overview.activeMembers = organization.members.filter(member => member.confirmed).length;
    
    // Get member types from memberships if available
    if (organization.memberships) {
      analytics.overview.adminMembers = organization.memberships.filter(membership => membership.memberType === 'admin').length;
      analytics.overview.normalMembers = organization.memberships.filter(membership => membership.memberType === 'normal').length;
      
      const memberActivity = organization.memberships.map(membership => ({
        member: {
          id: membership.idMember,
          fullName: membership.member?.fullName || 'Unknown',
          username: membership.member?.username || 'unknown',
        },
        membership: {
          type: membership.memberType,
          unconfirmed: membership.unconfirmed,
          deactivated: membership.deactivated,
        },
      }));
      
      (analytics as any).memberActivity = memberActivity;
    }
  }
  
  // Activity analytics
  if (args.includeActivity && organization.actions) {
    const recentActions = organization.actions
      .slice(0, 100) // Recent 100 actions
      .map(action => ({
        type: action.type,
        date: action.date,
        memberCreator: action.memberCreator?.fullName || 'Unknown',
        data: action.data,
      }));
    
    const actionTypes = organization.actions.reduce((acc: any, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {});
    
    (analytics as any).activityAnalytics = {
      recentActions: recentActions.slice(0, 20), // Most recent 20 actions
      actionTypeCounts: actionTypes,
      totalActions: organization.actions.length,
    };
  }
  
  return {
    success: true,
    data: analytics,
    summary: `Organization analytics: ${analytics.overview.totalBoards} boards (${analytics.overview.activeBoards} active), ${analytics.overview.totalMembers} members (${analytics.overview.activeMembers} active)`,
  };
}
