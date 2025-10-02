export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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
    PULL_REQUESTS: (repoId: string) => `/git/pull-requests/repository/${repoId}`,
  },

  // Job Analysis
  JOBS: {
    ANALYZE: (platform: string, projectId: string, jobId: string) =>
      `/api/job-analysis/analyze/${platform}/${encodeURIComponent(projectId)}/${encodeURIComponent(jobId)}`,
    FAILED_JOBS_FOR_MR: (platform: string, projectId: string, mrId: string) =>
      `/api/job-analysis/failed-jobs/${platform}/${encodeURIComponent(projectId)}/${mrId}`,
    BATCH_ANALYZE: (platform: string) => `/api/job-analysis/batch-analyze/${platform}`,
    STATISTICS: (projectId: string) => `/api/job-analysis/statistics/${encodeURIComponent(projectId)}`,
    WEBHOOK: (platform: string) => `/api/job-analysis/webhook/${platform}`,
    HEALTH: '/api/job-analysis/health',
  },

  // Pipeline Analysis
  PIPELINES: {
    ANALYZE: (platform: string, projectId: string, pipelineId: string) =>
      `/api/pipeline-analysis/analyze/${platform}/${encodeURIComponent(projectId)}/${encodeURIComponent(pipelineId)}`,
    FAILED_PIPELINES_FOR_MR: (platform: string, projectId: string, mrId: string) =>
      `/api/pipeline-analysis/failed-pipelines/${platform}/${encodeURIComponent(projectId)}/${mrId}`,
    BATCH_ANALYZE: (platform: string) => `/api/pipeline-analysis/batch-analyze/${platform}`,
    STATISTICS: (projectId: string) => `/api/pipeline-analysis/statistics/${encodeURIComponent(projectId)}`,
    WEBHOOK: (platform: string) => `/api/pipeline-analysis/webhook/${platform}`,
    HEALTH: '/api/pipeline-analysis/health',
  },
};