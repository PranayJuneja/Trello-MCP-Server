// Core Trello object types based on the API responses

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
  shortUrl: string;
  shortLink: string;
  idOrganization?: string;
  starred: boolean;
  subscribed: boolean;
  dateLastActivity: string;
  dateLastView?: string;
  prefs: {
    permissionLevel: 'org' | 'private' | 'public';
    selfJoin: boolean;
    cardCovers: boolean;
    invitations: 'admins' | 'members';
    voting: 'disabled' | 'members' | 'observers' | 'org' | 'public';
    comments: 'disabled' | 'members' | 'observers' | 'org' | 'public';
    background: string;
    cardAging: 'pirate' | 'regular';
    calendarFeedEnabled: boolean;
  };
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
  lists?: TrelloList[];
  cards?: TrelloCard[];
  labels?: TrelloLabel[];
  members?: TrelloMember[];
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
  subscribed: boolean;
  cards?: TrelloCard[];
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  idList: string;
  idBoard: string;
  url: string;
  shortUrl: string;
  shortLink: string;
  pos: number;
  dateLastActivity: string;
  due?: string;
  dueComplete: boolean;
  start?: string;
  cover?: {
    idAttachment?: string;
    color?: string;
    idUploadedBackground?: string;
    size: 'normal' | 'full';
    brightness: 'dark' | 'light';
  };
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
  labels: TrelloLabel[];
  idMembers: string[];
  members?: TrelloMember[];
  checklists?: TrelloChecklist[];
  attachments?: TrelloAttachment[];
  actions?: TrelloAction[];
}

export interface TrelloLabel {
  id: string;
  idBoard: string;
  name: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'sky' | 'lime' | 'pink' | 'black' | null;
  uses: number;
}

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
  initials: string;
  avatarHash?: string;
  avatarUrl?: string;
  email?: string;
  confirmed: boolean;
  memberType: 'admin' | 'normal' | 'observer';
}

export interface TrelloChecklist {
  id: string;
  name: string;
  idBoard: string;
  idCard: string;
  pos: number;
  checkItems: TrelloCheckItem[];
}

export interface TrelloCheckItem {
  id: string;
  name: string;
  nameData?: any;
  pos: number;
  state: 'incomplete' | 'complete';
  due?: string;
  idMember?: string;
}

export interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
  bytes?: number;
  date: string;
  edgeColor?: string;
  idMember: string;
  isUpload: boolean;
  mimeType?: string;
  previews?: TrelloAttachmentPreview[];
}

export interface TrelloAttachmentPreview {
  id: string;
  _id: string;
  scaled: boolean;
  url: string;
  bytes: number;
  height: number;
  width: number;
}

export interface TrelloAction {
  id: string;
  idMemberCreator: string;
  data: any;
  type: string;
  date: string;
  memberCreator?: TrelloMember;
  member?: TrelloMember;
}

export interface TrelloOrganization {
  id: string;
  name: string;
  displayName: string;
  desc: string;
  url: string;
  website?: string;
  logoHash?: string;
  products: number[];
  powerUps: number[];
}

export interface TrelloWebhook {
  id: string;
  description: string;
  idModel: string;
  callbackURL: string;
  active: boolean;
  consecutiveFailures: number;
  firstConsecutiveFailDate?: string;
}

// API request/response types
export interface TrelloApiError {
  message: string;
  error: string;
}

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

export interface CreateListRequest {
  name: string;
  idBoard: string;
  pos?: number | 'top' | 'bottom';
}

export interface UpdateListRequest {
  name?: string;
  closed?: boolean;
  pos?: number | 'top' | 'bottom';
  subscribed?: boolean;
}

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

export interface CreateLabelRequest {
  name: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'sky' | 'lime' | 'pink' | 'black' | null;
  idBoard: string;
}

export interface UpdateLabelRequest {
  name?: string;
  color?: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'sky' | 'lime' | 'pink' | 'black' | null;
}

export interface CreateChecklistRequest {
  name: string;
  idCard: string;
  pos?: number | 'top' | 'bottom';
  idChecklistSource?: string;
}

export interface CreateCheckItemRequest {
  name: string;
  pos?: number | 'top' | 'bottom';
  checked?: boolean;
  due?: string;
  idMember?: string;
}

export interface UpdateCheckItemRequest {
  name?: string;
  pos?: number | 'top' | 'bottom';
  state?: 'incomplete' | 'complete';
  due?: string;
  idMember?: string;
}

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
