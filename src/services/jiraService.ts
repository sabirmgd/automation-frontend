import apiClient from './api.client';
import type {
  JiraAccount,
  JiraBoard,
  JiraTicket,
  JiraProject,
  CreateJiraAccountDto,
  UpdateJiraAccountDto,
  PullRequest
} from '../types/jira.types';
import type { AxiosResponse } from 'axios';

class JiraService {
  // Account Management
  async getAccounts(projectId?: string): Promise<JiraAccount[]> {
    const params = projectId ? { projectId } : {};
    const { data } = await apiClient.get<JiraAccount[]>('/jira/accounts', { params });
    return data;
  }

  async getAccount(id: string): Promise<JiraAccount> {
    const { data } = await apiClient.get<JiraAccount>(`/jira/accounts/${id}`);
    return data;
  }

  async createAccount(dto: CreateJiraAccountDto): Promise<JiraAccount> {
    const { data } = await apiClient.post<JiraAccount>('/jira/accounts', dto);
    return data;
  }

  async updateAccount(id: string, dto: UpdateJiraAccountDto): Promise<JiraAccount> {
    const { data } = await apiClient.patch<JiraAccount>(`/jira/accounts/${id}`, dto);
    return data;
  }

  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(`/jira/accounts/${id}`);
  }

  async syncAccount(id: string): Promise<void> {
    await apiClient.post(`/jira/accounts/${id}/sync`);
  }

  // Board Management
  async getBoards(accountId: string): Promise<JiraBoard[]> {
    const { data } = await apiClient.get<JiraBoard[]>(`/jira/accounts/${accountId}/boards`);
    return data;
  }

  async getBoard(boardId: string): Promise<JiraBoard> {
    const { data } = await apiClient.get<JiraBoard>(`/jira/boards/${boardId}`);
    return data;
  }

  async syncBoard(boardId: string): Promise<void> {
    await apiClient.post(`/jira/boards/${boardId}/sync`);
  }

  // Ticket Management
  async getTickets(params: {
    boardId?: string;
    projectId?: string;
    status?: string;
    assigneeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: JiraTicket[]; total: number }> {
    const { data } = await apiClient.get<JiraTicket[]>('/jira/tickets', { params });
    // Backend returns array directly, wrap it in expected format
    return { tickets: data || [], total: data?.length || 0 };
  }

  async getTicket(id: string): Promise<JiraTicket> {
    const { data } = await apiClient.get<JiraTicket>(`/jira/tickets/${id}`);
    return data;
  }

  async getTicketByKey(key: string): Promise<JiraTicket> {
    const { data } = await apiClient.get<JiraTicket>(`/jira/tickets/key/${key}`);
    return data;
  }

  async syncTickets(boardId: string): Promise<void> {
    await apiClient.post(`/jira/tickets/board/${boardId}/sync`);
  }

  // Project Management
  async getJiraProjects(accountId: string): Promise<JiraProject[]> {
    const { data } = await apiClient.get<JiraProject[]>(`/jira/accounts/${accountId}/projects`);
    return data;
  }

  async syncProjects(accountId: string): Promise<void> {
    await apiClient.post(`/jira/accounts/${accountId}/sync-projects`);
  }

  // Pull Request Integration
  async linkTicketToPR(ticketId: string, pullRequestId: string): Promise<void> {
    await apiClient.post(`/jira/tickets/${ticketId}/pull-requests/${pullRequestId}`);
  }

  async unlinkTicketFromPR(ticketId: string, pullRequestId: string): Promise<void> {
    await apiClient.delete(`/jira/tickets/${ticketId}/pull-requests/${pullRequestId}`);
  }

  async getTicketPullRequests(ticketId: string): Promise<PullRequest[]> {
    const { data } = await apiClient.get<PullRequest[]>(`/jira/tickets/${ticketId}/pull-requests`);
    return data;
  }

  // Analytics
  async getAccountStats(accountId: string): Promise<any> {
    const { data } = await apiClient.get(`/jira/accounts/${accountId}/stats`);
    return data;
  }

  async getBoardStats(boardId: string): Promise<any> {
    const { data } = await apiClient.get(`/jira/boards/${boardId}/stats`);
    return data;
  }
}

export default new JiraService();