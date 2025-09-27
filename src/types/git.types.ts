// Git Credential Types
export const CredentialType = {
  PERSONAL_ACCESS_TOKEN: 'personal_access_token',
  OAUTH_TOKEN: 'oauth_token',
  SSH_KEY: 'ssh_key',
  API_KEY: 'api_key',
  USERNAME_PASSWORD: 'username_password',
} as const;

export type CredentialType = typeof CredentialType[keyof typeof CredentialType];

export interface GitCredential {
  id: string;
  name: string;
  description?: string;
  type: CredentialType;
  provider: string;
  baseUrl?: string;
  username?: string;
  publicKey?: string;
  scopes?: string[];
  expiresAt?: Date;
  isActive: boolean;
  isDefault: boolean;
  lastUsedAt?: Date;
  lastValidatedAt?: Date;
  metadata?: {
    organizationId?: string;
    organizationName?: string;
    apiVersion?: string;
    region?: string;
    customHeaders?: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGitCredentialDto {
  name: string;
  description?: string;
  type: CredentialType;
  provider: string;
  baseUrl?: string;
  username?: string;
  token?: string;
  password?: string;
  privateKey?: string;
  publicKey?: string;
  scopes?: string[];
  expiresAt?: Date;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, any>;
  projectId?: string;
}

export interface UpdateGitCredentialDto extends Partial<CreateGitCredentialDto> {}

// Git Repository Types
export const GitProvider = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  BITBUCKET: 'bitbucket',
  LOCAL: 'local',
} as const;

export type GitProvider = typeof GitProvider[keyof typeof GitProvider];

export const RepositoryVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  INTERNAL: 'internal',
} as const;

export type RepositoryVisibility = typeof RepositoryVisibility[keyof typeof RepositoryVisibility];

export interface GitRepository {
  id: string;
  projectId: string;
  provider: GitProvider;
  name: string;
  description?: string;
  url: string;
  cloneUrl?: string;
  sshUrl?: string;
  defaultBranch?: string;
  remoteId?: string;
  namespace?: string;
  visibility: RepositoryVisibility;
  credentialId?: string;
  credential?: GitCredential;
  localPath?: string;
  isForked: boolean;
  isHot: boolean;
  parentUrl?: string;
  metadata?: {
    stars?: number;
    forks?: number;
    watchers?: number;
    openIssues?: number;
    language?: string;
    topics?: string[];
    lastCommitAt?: Date;
    size?: number;
  };
  webhooks?: Array<{
    id: string;
    url: string;
    events: string[];
    active: boolean;
  }>;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGitRepositoryDto {
  projectId: string;
  provider: GitProvider;
  name: string;
  description?: string;
  url: string;
  cloneUrl?: string;
  sshUrl?: string;
  defaultBranch?: string;
  remoteId?: string;
  namespace?: string;
  visibility?: RepositoryVisibility;
  credentialId?: string;
  localPath?: string;
  isForked?: boolean;
  parentUrl?: string;
  metadata?: Record<string, any>;
}

export interface UpdateGitRepositoryDto extends Partial<CreateGitRepositoryDto> {}

// Pull Request Types
export interface GitPullRequest {
  id: string;
  number: number;
  title: string;
  description?: string;
  state: 'open' | 'closed' | 'merged';
  sourceBranch: string;
  targetBranch: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  assignees?: Array<{
    id: string;
    username: string;
    avatarUrl?: string;
  }>;
  reviewers?: Array<{
    id: string;
    username: string;
    avatarUrl?: string;
    approved?: boolean;
  }>;
  labels?: string[];
  milestone?: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  closedAt?: Date;
  draft: boolean;
  mergeable?: boolean;
  comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

// Branch Types
export interface GitBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
  isDefault?: boolean;
}

// Commit Types
export interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: Date;
  };
  committer: {
    name: string;
    email: string;
    date: Date;
  };
  url: string;
  parents: Array<{ sha: string; url: string }>;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
    status: string;
  }>;
}

// Remote Repository Creation Options
export interface CreateRemoteRepositoryOptions {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  gitignoreTemplate?: string;
  licenseTemplate?: string;
  visibility?: 'public' | 'private' | 'internal';
}