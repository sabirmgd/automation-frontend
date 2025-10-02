import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import type { GitPullRequest } from '../types/git.types';

export interface PullRequestFilters {
  repositoryId?: string;
  projectId?: string;
  status?: 'open' | 'closed' | 'merged';
  authorUsername?: string;
}

class PullRequestService {
  private baseUrl = `${API_CONFIG.BASE_URL}/git/pull-requests`;

  async getAllPullRequests(filters?: PullRequestFilters): Promise<GitPullRequest[]> {
    const params = new URLSearchParams();

    if (filters?.repositoryId) params.append('repositoryId', filters.repositoryId);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.authorUsername) params.append('authorUsername', filters.authorUsername);

    const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  async getPullRequestsByRepository(repositoryId: string, status?: string): Promise<GitPullRequest[]> {
    const params = status ? `?status=${status}` : '';
    const response = await axios.get(`${this.baseUrl}/repository/${repositoryId}${params}`);
    return response.data;
  }

  async getPullRequestsByProject(projectId: string): Promise<GitPullRequest[]> {
    const response = await axios.get(`${this.baseUrl}/project/${projectId}`);
    return response.data;
  }

  async getPullRequest(id: string): Promise<GitPullRequest> {
    const response = await axios.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createPullRequest(
    repositoryId: string,
    pullRequestData: Partial<GitPullRequest>
  ): Promise<GitPullRequest> {
    const response = await axios.post(this.baseUrl, {
      repositoryId,
      pullRequestData,
    });
    return response.data;
  }

  async updatePullRequest(id: string, updateData: Partial<GitPullRequest>): Promise<GitPullRequest> {
    const response = await axios.patch(`${this.baseUrl}/${id}`, updateData);
    return response.data;
  }

  async updatePullRequestStatus(
    id: string,
    status: 'open' | 'closed' | 'merged',
    additionalData?: any
  ): Promise<GitPullRequest> {
    const response = await axios.patch(`${this.baseUrl}/${id}/status`, {
      status,
      additionalData,
    });
    return response.data;
  }

  async linkTickets(id: string, ticketKeys: string[]): Promise<GitPullRequest> {
    const response = await axios.post(`${this.baseUrl}/${id}/link-tickets`, {
      ticketKeys,
    });
    return response.data;
  }

  async unlinkTickets(id: string, ticketKeys: string[]): Promise<GitPullRequest> {
    const response = await axios.post(`${this.baseUrl}/${id}/unlink-tickets`, {
      ticketKeys,
    });
    return response.data;
  }

  async deletePullRequest(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`);
  }

  async syncPullRequests(repositoryId: string, remotePRData: any[]): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/sync`, {
      repositoryId,
      remotePRData,
    });
    return response.data;
  }
}

export default new PullRequestService();