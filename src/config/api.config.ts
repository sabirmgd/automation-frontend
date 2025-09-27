export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Projects
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
    BY_STATUS: (status: string) => `/projects/status/${status}`,
    BY_OWNER: (owner: string) => `/projects/owner/${owner}`,
    BY_TAGS: '/projects/by-tags',
  },

  // Jira
  JIRA: {
    ACCOUNTS: '/jira/accounts',
    ACCOUNT_BY_ID: (id: string) => `/jira/accounts/${id}`,
    TICKETS: '/jira/tickets',
    TICKET_BY_ID: (id: string) => `/jira/tickets/${id}`,
    TICKET_ANALYSIS: '/jira/ticket-analysis',
    SYNC_TICKETS: (accountId: string) => `/jira/tickets/sync/${accountId}`,
  },

  // Git
  GIT: {
    CREDENTIALS: '/git/credentials',
    CREDENTIAL_BY_ID: (id: string) => `/git/credentials/${id}`,
    REPOSITORIES: '/git/repositories',
    REPOSITORY_BY_ID: (id: string) => `/git/repositories/${id}`,
    BRANCHES: (repoId: string) => `/git/repositories/${repoId}/branches`,
    COMMITS: (repoId: string) => `/git/repositories/${repoId}/commits`,
    PULL_REQUESTS: (repoId: string) => `/git/repositories/${repoId}/pull-requests`,
  },
};