import apiClient from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type {
  GitCredential,
  CreateGitCredentialDto,
  UpdateGitCredentialDto,
  GitRepository,
  CreateGitRepositoryDto,
  UpdateGitRepositoryDto,
  GitPullRequest,
  GitBranch,
  GitCommit,
  CreateRemoteRepositoryOptions,
  GitProvider,
} from '../types/git.types';

class GitService {
  // Credentials Management
  async getCredentials(provider?: string, projectId?: string): Promise<GitCredential[]> {
    const params: any = {};
    if (provider) params.provider = provider;
    if (projectId) params.projectId = projectId;
    const response = await apiClient.get<GitCredential[]>(
      API_ENDPOINTS.GIT.CREDENTIALS,
      { params }
    );
    return response.data;
  }

  async getCredentialById(id: string): Promise<GitCredential> {
    const response = await apiClient.get<GitCredential>(
      API_ENDPOINTS.GIT.CREDENTIAL_BY_ID(id)
    );
    return response.data;
  }

  async createCredential(data: CreateGitCredentialDto): Promise<GitCredential> {
    const response = await apiClient.post<GitCredential>(
      API_ENDPOINTS.GIT.CREDENTIALS,
      data
    );
    return response.data;
  }

  async updateCredential(id: string, data: UpdateGitCredentialDto): Promise<GitCredential> {
    const response = await apiClient.patch<GitCredential>(
      API_ENDPOINTS.GIT.CREDENTIAL_BY_ID(id),
      data
    );
    return response.data;
  }

  async deleteCredential(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.GIT.CREDENTIAL_BY_ID(id));
  }

  async validateCredential(id: string): Promise<boolean> {
    const response = await apiClient.post<{ valid: boolean }>(
      `${API_ENDPOINTS.GIT.CREDENTIAL_BY_ID(id)}/validate`
    );
    return response.data.valid;
  }

  async generateSSHKey(name: string, provider: string, email?: string): Promise<{
    id: string;
    name: string;
    provider: string;
    publicKey: string;
    createdAt: Date;
  }> {
    const response = await apiClient.post<{
      id: string;
      name: string;
      provider: string;
      publicKey: string;
      createdAt: Date;
    }>(
      `${API_ENDPOINTS.GIT.CREDENTIALS}/ssh-key`,
      { name, provider, email }
    );
    return response.data;
  }

  async setDefaultCredential(id: string): Promise<GitCredential> {
    const response = await apiClient.patch<GitCredential>(
      `${API_ENDPOINTS.GIT.CREDENTIAL_BY_ID(id)}/set-default`
    );
    return response.data;
  }

  // Repository Management
  async getRepositories(projectId?: string, provider?: GitProvider): Promise<GitRepository[]> {
    const params: any = {};
    if (projectId) params.projectId = projectId;
    if (provider) params.provider = provider;

    const response = await apiClient.get<GitRepository[]>(
      API_ENDPOINTS.GIT.REPOSITORIES,
      { params }
    );
    return response.data;
  }

  async getRepositoryById(id: string): Promise<GitRepository> {
    const response = await apiClient.get<GitRepository>(
      API_ENDPOINTS.GIT.REPOSITORY_BY_ID(id)
    );
    return response.data;
  }

  async createRepository(data: CreateGitRepositoryDto): Promise<GitRepository> {
    const response = await apiClient.post<GitRepository>(
      API_ENDPOINTS.GIT.REPOSITORIES,
      data
    );
    return response.data;
  }

  async createRemoteRepository(
    projectId: string,
    provider: GitProvider,
    options: CreateRemoteRepositoryOptions,
    credentialId?: string
  ): Promise<GitRepository> {
    const response = await apiClient.post<GitRepository>(
      `${API_ENDPOINTS.GIT.REPOSITORIES}/remote`,
      { projectId, provider, options, credentialId }
    );
    return response.data;
  }

  async importRepository(
    projectId: string,
    provider: GitProvider,
    owner: string,
    repoName: string,
    credentialId?: string
  ): Promise<GitRepository> {
    const response = await apiClient.post<GitRepository>(
      `${API_ENDPOINTS.GIT.REPOSITORIES}/import`,
      { projectId, provider, owner, repoName, credentialId }
    );
    return response.data;
  }

  async updateRepository(id: string, data: UpdateGitRepositoryDto): Promise<GitRepository> {
    const response = await apiClient.patch<GitRepository>(
      API_ENDPOINTS.GIT.REPOSITORY_BY_ID(id),
      data
    );
    return response.data;
  }

  async deleteRepository(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.GIT.REPOSITORY_BY_ID(id));
  }

  async syncRepository(id: string): Promise<GitRepository> {
    const response = await apiClient.post<GitRepository>(
      `${API_ENDPOINTS.GIT.REPOSITORY_BY_ID(id)}/sync`
    );
    return response.data;
  }

  async cloneRepository(id: string, localPath: string, branch?: string): Promise<void> {
    await apiClient.post(
      `${API_ENDPOINTS.GIT.REPOSITORY_BY_ID(id)}/clone`,
      { localPath, branch }
    );
  }

  async searchRepositories(
    provider: GitProvider,
    query: string,
    credentialId?: string,
    limit?: number
  ): Promise<GitRepository[]> {
    const params: any = { provider, query };
    if (credentialId) params.credentialId = credentialId;
    if (limit) params.limit = limit;

    const response = await apiClient.get<GitRepository[]>(
      `${API_ENDPOINTS.GIT.REPOSITORIES}/search`,
      { params }
    );
    return response.data;
  }

  // Branch Management
  async getBranches(repoId: string): Promise<GitBranch[]> {
    const response = await apiClient.get<GitBranch[]>(
      API_ENDPOINTS.GIT.BRANCHES(repoId)
    );
    return response.data;
  }

  async createBranch(repoId: string, branchName: string, fromBranch: string): Promise<GitBranch> {
    const response = await apiClient.post<GitBranch>(
      API_ENDPOINTS.GIT.BRANCHES(repoId),
      { branchName, fromBranch }
    );
    return response.data;
  }

  async deleteBranch(repoId: string, branchName: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.GIT.BRANCHES(repoId)}/${branchName}`);
  }

  // Commit Management
  async getCommits(repoId: string, branch?: string, limit?: number): Promise<GitCommit[]> {
    const params: any = {};
    if (branch) params.branch = branch;
    if (limit) params.limit = limit;

    const response = await apiClient.get<GitCommit[]>(
      API_ENDPOINTS.GIT.COMMITS(repoId),
      { params }
    );
    return response.data;
  }

  async getCommit(repoId: string, sha: string): Promise<GitCommit> {
    const response = await apiClient.get<GitCommit>(
      `${API_ENDPOINTS.GIT.COMMITS(repoId)}/${sha}`
    );
    return response.data;
  }

  // Pull Request Management
  async getPullRequests(
    repoId: string,
    state?: 'open' | 'closed' | 'all'
  ): Promise<GitPullRequest[]> {
    const params = state ? { state } : {};
    const response = await apiClient.get<GitPullRequest[]>(
      API_ENDPOINTS.GIT.PULL_REQUESTS(repoId),
      { params }
    );
    return response.data;
  }

  async createPullRequest(
    repoId: string,
    title: string,
    sourceBranch: string,
    targetBranch: string,
    description?: string
  ): Promise<GitPullRequest> {
    const response = await apiClient.post<GitPullRequest>(
      API_ENDPOINTS.GIT.PULL_REQUESTS(repoId),
      { title, sourceBranch, targetBranch, description }
    );
    return response.data;
  }

  async mergePullRequest(
    repoId: string,
    prNumber: number,
    method?: 'merge' | 'squash' | 'rebase'
  ): Promise<void> {
    await apiClient.post(
      `${API_ENDPOINTS.GIT.PULL_REQUESTS(repoId)}/${prNumber}/merge`,
      { method }
    );
  }

  async closePullRequest(repoId: string, prNumber: number): Promise<void> {
    await apiClient.post(
      `${API_ENDPOINTS.GIT.PULL_REQUESTS(repoId)}/${prNumber}/close`
    );
  }

  async updatePullRequest(
    repoId: string,
    prNumber: number,
    data: { title?: string; description?: string; targetBranch?: string }
  ): Promise<GitPullRequest> {
    const response = await apiClient.patch<GitPullRequest>(
      `${API_ENDPOINTS.GIT.PULL_REQUESTS(repoId)}/${prNumber}`,
      data
    );
    return response.data;
  }

  // Project Repository Sync
  async syncProjectRepositories(projectId: string): Promise<{
    repositories: GitRepository[];
    syncedAt: Date;
    credentialsUsed: string[];
    errors: Array<{ credential: string; error: string }>;
  }> {
    const response = await apiClient.post<{
      repositories: GitRepository[];
      syncedAt: Date;
      credentialsUsed: string[];
      errors: Array<{ credential: string; error: string }>;
    }>(`${API_ENDPOINTS.GIT.REPOSITORIES}/sync/project/${projectId}`);
    return response.data;
  }
}

export default new GitService();