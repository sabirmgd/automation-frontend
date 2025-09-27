import { useState, useEffect, useCallback } from 'react';
import gitService from '../services/git.service';
import type {
  GitCredential,
  GitRepository,
  GitPullRequest,
  GitBranch,
  GitCommit,
  CreateGitCredentialDto,
  CreateGitRepositoryDto,
  GitProvider,
  CreateRemoteRepositoryOptions,
} from '../types/git.types';

// Hook for managing Git credentials
export function useGitCredentials(provider?: string, projectId?: string) {
  const [credentials, setCredentials] = useState<GitCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await gitService.getCredentials(provider, projectId);
      setCredentials(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credentials');
    } finally {
      setLoading(false);
    }
  }, [provider, projectId]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const createCredential = async (data: CreateGitCredentialDto) => {
    try {
      const newCredential = await gitService.createCredential(data);
      setCredentials([...credentials, newCredential]);
      return newCredential;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create credential');
    }
  };

  const updateCredential = async (id: string, data: Partial<CreateGitCredentialDto>) => {
    try {
      const updatedCredential = await gitService.updateCredential(id, data);
      setCredentials(credentials.map(c => c.id === id ? updatedCredential : c));
      return updatedCredential;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update credential');
    }
  };

  const deleteCredential = async (id: string) => {
    try {
      await gitService.deleteCredential(id);
      setCredentials(credentials.filter(c => c.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete credential');
    }
  };

  const validateCredential = async (id: string) => {
    try {
      return await gitService.validateCredential(id);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to validate credential');
    }
  };

  return {
    credentials,
    loading,
    error,
    refetch: fetchCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
    validateCredential,
  };
}

// Hook for managing Git repositories
export function useGitRepositories(projectId?: string, provider?: GitProvider) {
  const [repositories, setRepositories] = useState<GitRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await gitService.getRepositories(projectId, provider);
      setRepositories(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  }, [projectId, provider]);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const createRepository = async (data: CreateGitRepositoryDto) => {
    try {
      const newRepo = await gitService.createRepository(data);
      setRepositories([...repositories, newRepo]);
      return newRepo;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create repository');
    }
  };

  const createRemoteRepository = async (
    projectId: string,
    provider: GitProvider,
    options: CreateRemoteRepositoryOptions,
    credentialId?: string
  ) => {
    try {
      const newRepo = await gitService.createRemoteRepository(projectId, provider, options, credentialId);
      setRepositories([...repositories, newRepo]);
      return newRepo;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create remote repository');
    }
  };

  const importRepository = async (
    projectId: string,
    provider: GitProvider,
    owner: string,
    repoName: string,
    credentialId?: string
  ) => {
    try {
      const newRepo = await gitService.importRepository(projectId, provider, owner, repoName, credentialId);
      setRepositories([...repositories, newRepo]);
      return newRepo;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to import repository');
    }
  };

  const updateRepository = async (id: string, data: Partial<CreateGitRepositoryDto>) => {
    try {
      const updatedRepo = await gitService.updateRepository(id, data);
      setRepositories(repositories.map(r => r.id === id ? updatedRepo : r));
      return updatedRepo;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update repository');
    }
  };

  const deleteRepository = async (id: string) => {
    try {
      await gitService.deleteRepository(id);
      setRepositories(repositories.filter(r => r.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete repository');
    }
  };

  const syncRepository = async (id: string) => {
    try {
      const syncedRepo = await gitService.syncRepository(id);
      setRepositories(repositories.map(r => r.id === id ? syncedRepo : r));
      return syncedRepo;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to sync repository');
    }
  };

  const syncProjectRepositories = async () => {
    if (!projectId) {
      throw new Error('Project ID is required to sync repositories');
    }

    try {
      console.log('[useGit] Syncing repositories for project:', projectId);
      const result = await gitService.syncProjectRepositories(projectId);
      console.log('[useGit] Sync result:', result);

      // Update the repositories list with the synced data
      setRepositories(result.repositories);

      // Show user feedback
      if (result.errors.length > 0) {
        console.warn('[useGit] Sync had errors:', result.errors);
      }

      return result;
    } catch (err: any) {
      console.error('[useGit] Sync failed:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to sync repositories');
    }
  };

  return {
    repositories,
    loading,
    error,
    refetch: fetchRepositories,
    createRepository,
    createRemoteRepository,
    importRepository,
    updateRepository,
    deleteRepository,
    syncRepository,
    syncProjectRepositories,
  };
}

// Hook for managing pull requests
export function useGitPullRequests(repoId: string, state?: 'open' | 'closed' | 'all') {
  const [pullRequests, setPullRequests] = useState<GitPullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPullRequests = useCallback(async () => {
    if (!repoId) return;

    try {
      setLoading(true);
      const data = await gitService.getPullRequests(repoId, state);
      setPullRequests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pull requests');
    } finally {
      setLoading(false);
    }
  }, [repoId, state]);

  useEffect(() => {
    fetchPullRequests();
  }, [fetchPullRequests]);

  const createPullRequest = async (
    title: string,
    sourceBranch: string,
    targetBranch: string,
    description?: string
  ) => {
    try {
      const newPR = await gitService.createPullRequest(repoId, title, sourceBranch, targetBranch, description);
      setPullRequests([...pullRequests, newPR]);
      return newPR;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create pull request');
    }
  };

  const mergePullRequest = async (prNumber: number, method?: 'merge' | 'squash' | 'rebase') => {
    try {
      await gitService.mergePullRequest(repoId, prNumber, method);
      await fetchPullRequests(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to merge pull request');
    }
  };

  const closePullRequest = async (prNumber: number) => {
    try {
      await gitService.closePullRequest(repoId, prNumber);
      await fetchPullRequests(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to close pull request');
    }
  };

  return {
    pullRequests,
    loading,
    error,
    refetch: fetchPullRequests,
    createPullRequest,
    mergePullRequest,
    closePullRequest,
  };
}

// Hook for managing branches
export function useGitBranches(repoId: string) {
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    if (!repoId) return;

    try {
      setLoading(true);
      const data = await gitService.getBranches(repoId);
      setBranches(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const createBranch = async (branchName: string, fromBranch: string) => {
    try {
      const newBranch = await gitService.createBranch(repoId, branchName, fromBranch);
      setBranches([...branches, newBranch]);
      return newBranch;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create branch');
    }
  };

  const deleteBranch = async (branchName: string) => {
    try {
      await gitService.deleteBranch(repoId, branchName);
      setBranches(branches.filter(b => b.name !== branchName));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete branch');
    }
  };

  return {
    branches,
    loading,
    error,
    refetch: fetchBranches,
    createBranch,
    deleteBranch,
  };
}

// Hook for managing commits
export function useGitCommits(repoId: string, branch?: string, limit?: number) {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommits = useCallback(async () => {
    if (!repoId) return;

    try {
      setLoading(true);
      const data = await gitService.getCommits(repoId, branch, limit);
      setCommits(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commits');
    } finally {
      setLoading(false);
    }
  }, [repoId, branch, limit]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  return {
    commits,
    loading,
    error,
    refetch: fetchCommits,
  };
}