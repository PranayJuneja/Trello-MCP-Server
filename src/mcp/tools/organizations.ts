/**
 * @fileoverview This file defines the MCP tools for interacting with Trello organizations (Workspaces).
 * It includes functions for creating, reading, updating, deleting, and managing organizations
 * and their members. Each tool is accompanied by a Zod schema for input validation.
 */
import { z } from 'zod';
import { trelloClient } from '../../trello/client.js';
import { McpContext } from '../server.js';

// ===== INPUT SCHEMAS =====

/**
 * Schema for the `getOrganizations` tool.
 */
export const getOrganizationsSchema = z.object({
  memberId: z.string().optional().default('me').describe("The ID of the member to get organizations for (defaults to 'me')."),
});

/**
 * Schema for the `getOrganization` tool.
 */
export const getOrganizationSchema = z.object({
  organizationId: z.string().describe('The ID of the organization to retrieve.'),
  includeBoards: z.boolean().optional().default(false).describe('Set to true to include the organization\'s boards.'),
  includeMembers: z.boolean().optional().default(false).describe('Set to true to include the organization\'s members.'),
});

/**
 * Schema for the `createOrganization` tool.
 */
export const createOrganizationSchema = z.object({
  displayName: z.string().min(1).max(16384).describe('The display name for the new organization.'),
  desc: z.string().optional().describe('A description for the organization.'),
  website: z.string().url().optional().describe('A URL for the organization\'s website.'),
});

/**
 * Schema for the `updateOrganization` tool.
 */
export const updateOrganizationSchema = z.object({
  organizationId: z.string().describe('The ID of the organization to update.'),
  displayName: z.string().min(1).max(16384).optional().describe('A new display name for the organization.'),
  desc: z.string().optional().describe('A new description for the organization.'),
  website: z.string().url().optional().describe('A new website URL.'),
});

/**
 * Schema for the `deleteOrganization` tool.
 */
export const deleteOrganizationSchema = z.object({
  organizationId: z.string().describe('The ID of the organization to delete.'),
});

/**
 * Schema for the `getOrganizationMembers` tool.
 */
export const getOrganizationMembersSchema = z.object({
  organizationId: z.string().describe('The ID of the organization to get members from.'),
});

/**
 * Schema for the `inviteMemberToOrganization` tool.
 */
export const inviteMemberToOrganizationSchema = z.object({
  organizationId: z.string().describe('The ID of the organization to invite the member to.'),
  email: z.string().email().describe('The email address of the person to invite.'),
  fullName: z.string().min(1).describe('The full name of the person to invite.'),
  type: z.enum(['admin', 'normal']).optional().default('normal').describe('The type of member to add ("admin" or "normal").'),
});

/**
 * Schema for the `removeOrganizationMember` tool.
 */
export const removeOrganizationMemberSchema = z.object({
  organizationId: z.string().describe('The ID of the organization.'),
  memberId: z.string().describe('The ID of the member to remove.'),
});

// ===== TOOL HANDLERS =====

/**
 * Retrieves a list of organizations for a given member.
 * @param {z.infer<typeof getOrganizationsSchema>} args - The arguments for getting organizations.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the list of organizations.
 */
export async function getOrganizations(args: z.infer<typeof getOrganizationsSchema>, context: McpContext) {
  context.logger.info({ memberId: args.memberId }, 'Getting organizations');
  const organizations = await trelloClient.getMemberOrganizations(args.memberId);
  return {
    success: true,
    data: organizations,
    summary: `Found ${organizations.length} organizations.`,
  };
}

/**
 * Retrieves detailed information about a single organization.
 * @param {z.infer<typeof getOrganizationSchema>} args - The arguments for getting an organization.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the organization data.
 */
export async function getOrganization(args: z.infer<typeof getOrganizationSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId }, 'Getting organization');
  const options: any = {};
  if (args.includeBoards) options.boards = 'all';
  if (args.includeMembers) options.members = 'all';
  const organization = await trelloClient.getOrganization(args.organizationId, options);
  return {
    success: true,
    data: organization,
    summary: `Retrieved organization "${organization.displayName}".`,
  };
}

/**
 * Creates a new Trello organization (Workspace).
 * @param {z.infer<typeof createOrganizationSchema>} args - The details for the new organization.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the new organization data.
 */
export async function createOrganization(args: z.infer<typeof createOrganizationSchema>, context: McpContext) {
  context.logger.info({ displayName: args.displayName }, 'Creating organization');
  const organization = await trelloClient.createOrganization(args);
  return {
    success: true,
    data: organization,
    summary: `Created organization "${organization.displayName}".`,
  };
}

/**
 * Updates an existing Trello organization.
 * @param {z.infer<typeof updateOrganizationSchema>} args - The ID of the organization and fields to update.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated organization data.
 */
export async function updateOrganization(args: z.infer<typeof updateOrganizationSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId }, 'Updating organization');
  const { organizationId, ...updateData } = args;
  const organization = await trelloClient.updateOrganization(organizationId, updateData);
  return {
    success: true,
    data: organization,
    summary: `Updated organization "${organization.displayName}".`,
  };
}

/**
 * Deletes a Trello organization. This action is permanent.
 * @param {z.infer<typeof deleteOrganizationSchema>} args - The ID of the organization to delete.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of deletion.
 */
export async function deleteOrganization(args: z.infer<typeof deleteOrganizationSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId }, 'Deleting organization');
  await trelloClient.deleteOrganization(args.organizationId);
  return {
    success: true,
    data: { deleted: true, id: args.organizationId },
    summary: `Deleted organization ${args.organizationId}.`,
  };
}

/**
 * Retrieves a list of members for a given organization.
 * @param {z.infer<typeof getOrganizationMembersSchema>} args - The arguments for getting members.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the list of members.
 */
export async function getOrganizationMembers(args: z.infer<typeof getOrganizationMembersSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId }, 'Getting organization members');
  const members = await trelloClient.getOrganizationMembers(args.organizationId);
  return {
    success: true,
    data: members,
    summary: `Found ${members.length} members in the organization.`,
  };
}

/**
 * Invites a new member to an organization.
 * @param {z.infer<typeof inviteMemberToOrganizationSchema>} args - The details of the invitation.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with the updated member information.
 */
export async function inviteMemberToOrganization(args: z.infer<typeof inviteMemberToOrganizationSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, email: args.email }, 'Inviting member');
  const member = await trelloClient.inviteMemberToOrganization(args.organizationId, args);
  return {
    success: true,
    data: member,
    summary: `Invited ${args.email} to the organization as a ${args.type}.`,
  };
}

/**
 * Removes a member from an organization.
 * @param {z.infer<typeof removeOrganizationMemberSchema>} args - The organization and member IDs.
 * @param {McpContext} context - The MCP context.
 * @returns {Promise<object>} A promise that resolves with a confirmation of removal.
 */
export async function removeOrganizationMember(args: z.infer<typeof removeOrganizationMemberSchema>, context: McpContext) {
  context.logger.info({ organizationId: args.organizationId, memberId: args.memberId }, 'Removing member');
  await trelloClient.removeOrganizationMember(args.organizationId, args.memberId);
  return {
    success: true,
    summary: `Removed member ${args.memberId} from the organization.`,
  };
}
