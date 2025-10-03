export interface JiraAccount {
  id: string;
  accountName: string;
  jiraUrl: string;
  email: string;
  isActive: boolean;
  accountType?: string;
  cloudId?: string;
  projectId?: string;
  boards?: JiraBoard[];
  jiraProjects?: JiraProject[];
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JiraBoard {
  id: string;
  boardId: string;
  name: string;
  type?: string;
  projectKey?: string;
  projectName?: string;
  accountId: string;
  account?: JiraAccount;
  tickets?: JiraTicket[];
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description?: string;
  issueType: string;
  status: string;
  priority?: string;
  resolution?: string;
  boardId: string;
  board?: JiraBoard;
  assignee?: JiraUser;
  reporter?: JiraUser;
  pullRequests?: PullRequest[];
  labels?: string[];
  components?: string[];
  storyPoints?: number;
  originalEstimate?: number;
  remainingEstimate?: number;
  timeSpent?: number;
  epicKey?: string;
  parentKey?: string;
  sprintId?: string;
  sprintName?: string;
  customFields?: Record<string, any>;
  dueDate?: Date;
  jiraCreatedAt?: Date;
  jiraUpdatedAt?: Date;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JiraProject {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description?: string;
  projectType?: string;
  category?: string;
  leadAccountId?: string;
  leadName?: string;
  avatarUrl?: string;
  accountId: string;
  boards?: JiraBoard[];
  tickets?: JiraTicket[];
  isActive: boolean;
  metadata?: Record<string, any>;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JiraUser {
  id: string;
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrl?: string;
  active: boolean;
  timeZone?: string;
  accountType?: string;
}

export interface PullRequest {
  id: string;
  remoteId: string;
  number: number;
  title: string;
  description?: string;
  status: 'open' | 'closed' | 'merged' | 'draft';
  state?: 'pending' | 'approved' | 'changes_requested';
  sourceBranch: string;
  targetBranch: string;
  url: string;
  repositoryId: string;
  linkedTickets?: JiraTicket[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJiraAccountDto {
  accountName: string;
  jiraUrl: string;
  email: string;
  apiToken: string;
  accountType?: string;
  cloudId?: string;
  isActive?: boolean;
  projectId?: string;
}

export interface UpdateJiraAccountDto extends Partial<CreateJiraAccountDto> {}

// Hidden Comments Types
export type AuthorType = 'user' | 'ai';

export interface HiddenComment {
  id: string;
  ticketId: string;
  content: string;
  authorType: AuthorType;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHiddenCommentDto {
  content: string;
  authorType: AuthorType;
  authorName?: string;
}

export interface UpdateHiddenCommentDto {
  content?: string;
}