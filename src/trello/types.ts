/**
 * @fileoverview This file contains all the TypeScript type definitions for the Trello API.
 * It includes interfaces for core Trello objects like Boards, Lists, and Cards,
 * as well as types for API request bodies and error responses. These types provide
 * strong typing for interactions with the Trello API, improving developer experience and code safety.
 *
 * The types are based on the official Trello REST API documentation.
 * @see https://developer.atlassian.com/cloud/trello/rest/
 */

// Core Trello object types based on the API responses

/**
 * Represents a Trello board.
 */
export interface TrelloBoard {
  /** The unique identifier of the board. */
  id: string;
  /** The name of the board. */
  name: string;
  /** The description of the board. */
  desc?: string;
  /** Whether the board is closed (archived). */
  closed: boolean;
  /** The URL to the board on Trello. */
  url: string;
  /** The short URL to the board. */
  shortUrl: string;
  /** The short link for the board. */
  shortLink: string;
  /** The ID of the organization the board belongs to, if any. */
  idOrganization?: string;
  /** Whether the board is starred by the current user. */
  starred: boolean;
  /** Whether the current user is subscribed to the board. */
  subscribed: boolean;
  /** The timestamp of the last activity on the board. */
  dateLastActivity: string;
  /** The timestamp of the last time the board was viewed by the user. */
  dateLastView?: string;
  /** The preferences for the board. */
  prefs: {
    /** The permission level for the board ('org', 'private', 'public'). */
    permissionLevel: 'org' | 'private' | 'public';
    /** Whether members can join the board themselves. */
    selfJoin: boolean;
    /** Whether card covers are enabled. */
    cardCovers: boolean;
    /** Who can invite people to the board ('admins', 'members'). */
    invitations: 'admins' | 'members';
    /** Who can vote on cards ('disabled', 'members', 'observers', 'org', 'public'). */
    voting: 'disabled' | 'members' | 'observers' | 'org' | 'public';
    /** Who can comment on cards ('disabled', 'members', 'observers', 'org', 'public'). */
    comments: 'disabled' | 'members' | 'observers' | 'org' | 'public';
    /** The background of the board (e.g., 'blue', 'orange'). */
    background: string;
    /** The card aging style ('pirate', 'regular'). */
    cardAging: 'pirate' | 'regular';
    /** Whether the calendar feed is enabled. */
    calendarFeedEnabled: boolean;
  };
  /** The names for the default labels. */
  labelNames: {
    green?: string;
    yellow?: string;
    orange?: string;
    red?: string;
    purple?: string;
    blue?: string;
    sky?: string;
    lime?: string;
    pink?: string;
    black?: string;
  };
  /** Array of lists on the board (included when requested). */
  lists?: TrelloList[];
  /** Array of cards on the board (included when requested). */
  cards?: TrelloCard[];
  /** Array of labels on the board (included when requested). */
  labels?: TrelloLabel[];
  /** Array of members on the board (included when requested). */
  members?: TrelloMember[];
}

/**
 * Represents a list (a column) on a Trello board.
 */
export interface TrelloList {
  /** The unique identifier of the list. */
  id: string;
  /** The name of the list. */
  name: string;
  /** Whether the list is closed (archived). */
  closed: boolean;
  /** The position of the list on the board. */
  pos: number;
  /** The ID of the board this list belongs to. */
  idBoard: string;
  /** Whether the current user is subscribed to this list. */
  subscribed: boolean;
  /** Array of cards in the list (included when requested). */
  cards?: TrelloCard[];
}

/**
 * Represents a card on a Trello list.
 */
export interface TrelloCard {
  /** The unique identifier of the card. */
  id: string;
  /** The name (title) of the card. */
  name: string;
  /** The description of the card. */
  desc: string;
  /** Whether the card is closed (archived). */
  closed: boolean;
  /** The ID of the list this card belongs to. */
  idList: string;
  /** The ID of the board this card belongs to. */
  idBoard: string;
  /** The URL to the card on Trello. */
  url: string;
  /** The short URL to the card. */
  shortUrl: string;
  /** The short link for the card. */
  shortLink: string;
  /** The position of the card within its list. */
  pos: number;
  /** The timestamp of the last activity on the card. */
  dateLastActivity: string;
  /** The due date for the card. */
  due?: string;
  /** Whether the due date has been marked as complete. */
  dueComplete: boolean;
  /** The start date for the card. */
  start?: string;
  /** The cover image or color for the card. */
  cover?: {
    idAttachment?: string;
    color?: string;
    idUploadedBackground?: string;
    size: 'normal' | 'full';
    brightness: 'dark' | 'light';
  };
  /** A summary of counts for various card properties. */
  badges: {
    votes: number;
    attachments: number;
    comments: number;
    description: boolean;
    due?: string;
    start?: string;
    subscribed: boolean;
    fogbugz?: string;
    checkItems: number;
    checkItemsChecked: number;
  };
  /** The labels applied to the card. */
  labels: TrelloLabel[];
  /** An array of member IDs who are assigned to the card. */
  idMembers: string[];
  /** An array of member objects assigned to the card (included when requested). */
  members?: TrelloMember[];
  /** An array of checklists on the card (included when requested). */
  checklists?: TrelloChecklist[];
  /** An array of attachments on the card (included when requested). */
  attachments?: TrelloAttachment[];
  /** An array of actions (history) on the card (included when requested). */
  actions?: TrelloAction[];
}

/**
 * Represents a label on a Trello board.
 */
export interface TrelloLabel {
  /** The unique identifier of the label. */
  id: string;
  /** The ID of the board this label belongs to. */
  idBoard: string;
  /** The name of the label. */
  name: string;
  /** The color of the label. */
  color: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'sky' | 'lime' | 'pink' | 'black' | null;
  /** The number of times the label is used. */
  uses: number;
}

/**
 * Represents a Trello user (member).
 */
export interface TrelloMember {
  /** The unique identifier of the member. */
  id: string;
  /** The username of the member. */
  username: string;
  /** The full name of the member. */
  fullName: string;
  /** The initials of the member. */
  initials: string;
  /** The hash for the member's avatar. */
  avatarHash?: string;
  /** The URL for the member's avatar. */
  avatarUrl?: string;
  /** The email address of the member. */
  email?: string;
  /** Whether the member's account is confirmed. */
  confirmed: boolean;
  /** The type of member ('admin', 'normal', 'observer'). */
  memberType: 'admin' | 'normal' | 'observer';
}

/**
 * Represents a checklist on a Trello card.
 */
export interface TrelloChecklist {
  /** The unique identifier of the checklist. */
  id: string;
  /** The name of the checklist. */
  name: string;
  /** The ID of the board the checklist is on. */
  idBoard: string;
  /** The ID of the card the checklist is on. */
  idCard: string;
  /** The position of the checklist on the card. */
  pos: number;
  /** An array of items in the checklist. */
  checkItems: TrelloCheckItem[];
}

/**
 * Represents an item within a checklist.
 */
export interface TrelloCheckItem {
  /** The unique identifier of the check item. */
  id: string;
  /** The name (text) of the check item. */
  name: string;
  /** Additional data for the name, if any. */
  nameData?: any;
  /** The position of the item in the checklist. */
  pos: number;
  /** The state of the item ('incomplete' or 'complete'). */
  state: 'incomplete' | 'complete';
  /** The due date for the check item. */
  due?: string;
  /** The ID of the member this item is assigned to. */
  idMember?: string;
}

/**
 * Represents an attachment on a Trello card.
 */
export interface TrelloAttachment {
  /** The unique identifier of the attachment. */
  id: string;
  /** The name of the attachment. */
  name: string;
  /** The URL of the attachment. */
  url: string;
  /** The size of the attachment in bytes. */
  bytes?: number;
  /** The timestamp when the attachment was added. */
  date: string;
  /** The color of the edge for link attachments. */
  edgeColor?: string;
  /** The ID of the member who added the attachment. */
  idMember: string;
  /** Whether the attachment was uploaded or is a link. */
  isUpload: boolean;
  /** The MIME type of the attachment. */
  mimeType?: string;
  /** An array of previews for the attachment. */
  previews?: TrelloAttachmentPreview[];
}

/**
 * Represents a preview of an attachment.
 */
export interface TrelloAttachmentPreview {
  /** The unique identifier of the preview. */
  id: string;
  /** The internal ID of the preview. */
  _id: string;
  /** Whether the preview is a scaled version. */
  scaled: boolean;
  /** The URL of the preview image. */
  url: string;
  /** The size of the preview in bytes. */
  bytes: number;
  /** The height of the preview in pixels. */
  height: number;
  /** The width of the preview in pixels. */
  width: number;
}

/**
 * Represents an action (an event in the activity feed) in Trello.
 */
export interface TrelloAction {
  /** The unique identifier of the action. */
  id: string;
  /** The ID of the member who performed the action. */
  idMemberCreator: string;
  /** The data associated with the action. */
  data: any;
  /** The type of the action (e.g., 'commentCard', 'updateCard'). */
  type: string;
  /** The timestamp of the action. */
  date: string;
  /** The member object for the creator of the action (included when requested). */
  memberCreator?: TrelloMember;
  /** The member object associated with the action (included when requested). */
  member?: TrelloMember;
}

/**
 * Represents a webhook for receiving notifications about model changes.
 */
export interface TrelloWebhook {
  /** The unique identifier of the webhook. */
  id: string;
  /** The description of the webhook. */
  description: string;
  /** The ID of the model (board, list, card, etc.) being watched. */
  idModel: string;
  /** The URL that Trello will POST to. */
  callbackURL: string;
  /** Whether the webhook is active. */
  active: boolean;
  /** The number of consecutive failed attempts to send a notification. */
  consecutiveFailures: number;
  /** The timestamp of the first consecutive failure. */
  firstConsecutiveFailDate?: string;
}

/**
 * Represents a Trello organization (Workspace).
 */
export interface TrelloOrganization {
  /** The unique identifier of the organization. */
  id: string;
  /** The internal name of the organization. */
  name: string;
  /** The display name of the organization. */
  displayName: string;
  /** The description of the organization. */
  desc?: string;
  /** Additional data for the description. */
  descData?: any;
  /** Whether the organization is closed. */
  closed: boolean;
  /** The ID of the member who created the organization. */
  idMemberCreator?: string;
  /** The URL to the organization's page on Trello. */
  url: string;
  /** The organization's website. */
  website?: string;
  /** The hash for the organization's logo. */
  logoHash?: string;
  /** The URL for the organization's logo. */
  logoUrl?: string;
  /** An array of product IDs associated with the organization. */
  products: number[];
  /** An array of Power-Up IDs enabled for the organization. */
  powerUps: number[];
  /** An array of premium features available to the organization. */
  premiumFeatures: string[];
  /** The number of billable members in the organization. */
  billableMemberCount?: number;
  /** The number of active billable members. */
  activeBillableMemberCount?: number;
  /** An array of memberships in the organization (included when requested). */
  memberships?: TrelloMembership[];
  /** An array of members in the organization (included when requested). */
  members?: TrelloMember[];
  /** An array of boards in the organization (included when requested). */
  boards?: TrelloBoard[];
  /** An array of actions in the organization (included when requested). */
  actions?: TrelloAction[];
  /** The preferences for the organization. */
  prefs?: TrelloOrganizationPrefs;
}

/**
 * Represents the preferences for a Trello organization.
 */
export interface TrelloOrganizationPrefs {
  /** The default permission level for new boards ('private', 'public'). */
  permissionLevel: 'private' | 'public';
  /** Whether votes are hidden from non-members. */
  hideVotes: boolean;
  /** Who can vote on cards. */
  voting: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  /** Who can comment on cards. */
  comments: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  /** Who can invite members to the organization. */
  invitations: 'admins' | 'members';
  /** Whether members can join the organization themselves. */
  selfJoin: boolean;
  /** Whether card covers are enabled by default. */
  cardCovers: boolean;
  /** Whether the organization is a template. */
  isTemplate: boolean;
  /** The default card aging style. */
  cardAging: 'pirate' | 'regular';
  /** Whether the calendar feed is enabled. */
  calendarFeedEnabled: boolean;
  /** The default background for boards. */
  background: string;
  /** The default background image for boards. */
  backgroundImage?: string;
  /** Scaled versions of the background image. */
  backgroundImageScaled?: any[];
  /** Whether the background image is tiled. */
  backgroundTile: boolean;
  /** The brightness of the background ('dark', 'light'). */
  backgroundBrightness: 'dark' | 'light';
  /** The background color. */
  backgroundColor?: string;
  /** The bottom gradient color of the background. */
  backgroundBottomColor?: string;
  /** The top gradient color of the background. */
  backgroundTopColor?: string;
  /** Whether boards can be made public. */
  canBePublic: boolean;
  /** Whether boards can be enterprise-visible. */
  canBeEnterprise: boolean;
  /** Whether boards can be organization-visible. */
  canBeOrg: boolean;
  /** Whether boards can be private. */
  canBePrivate: boolean;
  /** Whether new members can be invited. */
  canInvite: boolean;
  /** Restrictions on board visibility settings. */
  boardVisibilityRestrict?: {
    private?: 'admin' | 'none' | 'org';
    org?: 'admin' | 'none' | 'org';
    public?: 'admin' | 'none' | 'org';
  };
  /** Restrictions on who can be invited to the organization. */
  orgInviteRestrict?: 'any' | 'domain' | 'none';
  /** The associated domain for the organization. */
  associatedDomain?: string;
  /** The Google Apps version, if applicable. */
  googleAppsVersion?: number;
  /** Whether external members are disabled. */
  externalMembersDisabled?: boolean;
  /** The source URL for shared content. */
  sharedSourceUrl?: string;
}

/**
 * Represents a member's membership in an organization.
 */
export interface TrelloMembership {
  /** The unique identifier of the membership. */
  id: string;
  /** The ID of the member. */
  idMember: string;
  /** The type of member ('admin', 'normal'). */
  memberType: 'admin' | 'normal';
  /** Whether the membership is unconfirmed. */
  unconfirmed: boolean;
  /** Whether the member is deactivated. */
  deactivated: boolean;
  /** The member object (included when requested). */
  member?: TrelloMember;
}

// API request/response types

/**
 * Represents a standard error response from the Trello API.
 */
export interface TrelloApiError {
  /** The error message. */
  message: string;
  /** The error code string. */
  error: string;
}

/**
 * Represents the request body for creating a new board.
 */
export interface CreateBoardRequest {
  name: string;
  desc?: string;
  idOrganization?: string;
  idBoardSource?: string;
  keepFromSource?: string;
  powerUps?: string;
  prefs_permissionLevel?: 'org' | 'private' | 'public';
  prefs_voting?: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  prefs_comments?: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  prefs_invitations?: 'admins' | 'members';
  prefs_selfJoin?: boolean;
  prefs_cardCovers?: boolean;
  prefs_background?: string;
  prefs_cardAging?: 'pirate' | 'regular';
}

/**
 * Represents the request body for updating an existing board.
 */
export interface UpdateBoardRequest {
  name?: string;
  desc?: string;
  closed?: boolean;
  subscribed?: boolean;
  idOrganization?: string;
  'prefs/permissionLevel'?: 'org' | 'private' | 'public';
  'prefs/selfJoin'?: boolean;
  'prefs/cardCovers'?: boolean;
  'prefs/invitations'?: 'admins' | 'members';
  'prefs/voting'?: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  'prefs/comments'?: 'disabled' | 'members' | 'observers' | 'org' | 'public';
  'prefs/background'?: string;
  'prefs/cardAging'?: 'pirate' | 'regular';
  'prefs/calendarFeedEnabled'?: boolean;
}

/**
 * Represents the request body for creating a new list.
 */
export interface CreateListRequest {
  name: string;
  idBoard: string;
  pos?: number | 'top' | 'bottom';
}

/**
 * Represents the request body for updating an existing list.
 */
export interface UpdateListRequest {
  name?: string;
  closed?: boolean;
  pos?: number | 'top' | 'bottom';
  subscribed?: boolean;
}

/**
 * Represents the request body for creating a new card.
 */
export interface CreateCardRequest {
  name: string;
  desc?: string;
  pos?: number | 'top' | 'bottom';
  due?: string;
  start?: string;
  dueComplete?: boolean;
  idList: string;
  idMembers?: string[];
  idLabels?: string[];
  urlSource?: string;
  fileSource?: string;
  idCardSource?: string;
  keepFromSource?: string;
}

/**
 * Represents the request body for updating an existing card.
 */
export interface UpdateCardRequest {
  name?: string;
  desc?: string;
  closed?: boolean;
  idMembers?: string[];
  idAttachmentCover?: string;
  idList?: string;
  idLabels?: string[];
  idBoard?: string;
  pos?: number | 'top' | 'bottom';
  due?: string;
  start?: string;
  dueComplete?: boolean;
  subscribed?: boolean;
  address?: string;
  locationName?: string;
  coordinates?: string;
  cover?: {
    color?: string;
    brightness?: 'dark' | 'light';
    size?: 'normal' | 'full';
  };
}

/**
 * Represents the request body for creating a new label.
 */
export interface CreateLabelRequest {
  name: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'sky' | 'lime' | 'pink' | 'black' | null;
  idBoard: string;
}

/**
 * Represents the request body for updating an existing label.
 */
export interface UpdateLabelRequest {
  name?: string;
  color?: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'sky' | 'lime' | 'pink' | 'black' | null;
}

/**
 * Represents the request body for creating a new checklist.
 */
export interface CreateChecklistRequest {
  name: string;
  idCard: string;
  pos?: number | 'top' | 'bottom';
  idChecklistSource?: string;
}

/**
 * Represents the request body for creating a new check item in a checklist.
 */
export interface CreateCheckItemRequest {
  name: string;
  pos?: number | 'top' | 'bottom';
  checked?: boolean;
  due?: string;
  idMember?: string;
}

/**
 * Represents the request body for updating an existing check item.
 */
export interface UpdateCheckItemRequest {
  name?: string;
  pos?: number | 'top' | 'bottom';
  state?: 'incomplete' | 'complete';
  due?: string;
  idMember?: string;
}

/**
 * Represents the request parameters for a Trello search query.
 */
export interface SearchRequest {
  query: string;
  idBoards?: string;
  idOrganizations?: string;
  idCards?: string;
  modelTypes?: ('actions' | 'boards' | 'cards' | 'members' | 'organizations')[];
  board_fields?: string;
  boards_limit?: number;
  card_fields?: string;
  cards_limit?: number;
  cards_page?: number;
  partial?: boolean;
}

/**
 * Represents the response from a Trello search query.
 */
export interface SearchResponse {
  actions?: TrelloAction[];
  boards?: TrelloBoard[];
  cards?: TrelloCard[];
  members?: TrelloMember[];
  organizations?: TrelloOrganization[];
  options: {
    terms: {
      text: string;
    }[];
    modifiers: {
      text: string;
    }[];
  };
}