import { useState, useEffect, useCallback } from 'react';
import pullRequestService from '../services/pullRequest.service';
import type { PullRequestFilters } from '../services/pullRequest.service';
import type { GitPullRequest, GitRepository } from '../types/git.types';

export function usePullRequests(filters?: PullRequestFilters) {
  const [pullRequests, setPullRequests] = useState<GitPullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepository, setSelectedRepository] = useState<string | undefined>(filters?.repositoryId);
  const [repositories, setRepositories] = useState<GitRepository[]>([]);

  const fetchPullRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters: PullRequestFilters = {
        ...filters,
        ...(selectedRepository && { repositoryId: selectedRepository }),
      };

      const data = await pullRequestService.getAllPullRequests(currentFilters);
      setPullRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pull requests');
      setPullRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedRepository]);

  useEffect(() => {
    fetchPullRequests();
  }, [fetchPullRequests]);

  const filterByRepository = useCallback((repositoryId: string | undefined) => {
    setSelectedRepository(repositoryId);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedRepository(undefined);
  }, []);

  const updatePullRequestStatus = async (
    id: string,
    status: 'open' | 'closed' | 'merged'
  ) => {
    try {
      const updated = await pullRequestService.updatePullRequestStatus(id, status);
      setPullRequests(prev => prev.map(pr => pr.id === id ? updated : pr));
      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update pull request status');
    }
  };

  const deletePullRequest = async (id: string) => {
    try {
      await pullRequestService.deletePullRequest(id);
      setPullRequests(prev => prev.filter(pr => pr.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete pull request');
    }
  };

  const linkTickets = async (id: string, ticketKeys: string[]) => {
    try {
      const updated = await pullRequestService.linkTickets(id, ticketKeys);
      setPullRequests(prev => prev.map(pr => pr.id === id ? updated : pr));
      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to link tickets');
    }
  };

  const unlinkTickets = async (id: string, ticketKeys: string[]) => {
    try {
      const updated = await pullRequestService.unlinkTickets(id, ticketKeys);
      setPullRequests(prev => prev.map(pr => pr.id === id ? updated : pr));
      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to unlink tickets');
    }
  };

  return {
    pullRequests,
    loading,
    error,
    selectedRepository,
    repositories,
    setRepositories,
    filterByRepository,
    clearFilters,
    refetch: fetchPullRequests,
    updatePullRequestStatus,
    deletePullRequest,
    linkTickets,
    unlinkTickets,
  };
}