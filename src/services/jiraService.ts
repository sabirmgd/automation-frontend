import apiClient from './api.client';
import type {
  JiraAccount,
  JiraBoard,
  JiraTicket,
  JiraProject,
  CreateJiraAccountDto,
  UpdateJiraAccountDto,
  PullRequest,
  HiddenComment,
  CreateHiddenCommentDto,
  UpdateHiddenCommentDto
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

  async syncBoard(
    boardId: string,
    assigneeAccountId?: string,
    syncMode?: 'assigned' | 'all' | 'custom',
    customJql?: string
  ): Promise<void> {
    const body: any = {};
    if (assigneeAccountId) body.assigneeAccountId = assigneeAccountId;
    if (syncMode) body.syncMode = syncMode;
    if (customJql) body.customJql = customJql;
    await apiClient.post(`/jira/boards/${boardId}/sync`, body);
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

  async syncTickets(
    boardId: string,
    assigneeAccountId?: string,
    syncMode?: 'assigned' | 'all' | 'custom',
    customJql?: string
  ): Promise<void> {
    const body: any = {};
    if (assigneeAccountId) body.assigneeAccountId = assigneeAccountId;
    if (syncMode) body.syncMode = syncMode;
    if (customJql) body.customJql = customJql;
    await apiClient.post(`/jira/tickets/board/${boardId}/sync`, body);
  }

  async syncSingleTicket(key: string, mainProjectId?: string, boardId?: string): Promise<JiraTicket> {
    const { data } = await apiClient.post(`/jira/tickets/key/${key}/sync`, {
      mainProjectId,
      boardId
    });
    return data.ticket;
  }

  // User Management
  async getUsers(): Promise<any[]> {
    const { data } = await apiClient.get('/jira/users');
    return data;
  }

  async getUserById(id: string): Promise<any> {
    const { data } = await apiClient.get(`/jira/users/${id}`);
    return data;
  }

  async getUserByAccountId(accountId: string): Promise<any> {
    const { data } = await apiClient.get(`/jira/users/account/${accountId}`);
    return data;
  }

  async searchUsers(query: string): Promise<any[]> {
    const { data } = await apiClient.get('/jira/users/search', { params: { q: query } });
    return data;
  }

  async syncUsersFromJira(jiraAccountId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/jira/users/sync/${jiraAccountId}`);
    return data;
  }

  // Project Management
  async getJiraProjects(accountId: string): Promise<JiraProject[]> {
    const { data } = await apiClient.get<JiraProject[]>(`/jira/accounts/${accountId}/projects`);
    return data;
  }

  async getAllProjects(): Promise<JiraProject[]> {
    const { data } = await apiClient.get<JiraProject[]>('/jira/projects');
    return data;
  }

  async getProjectsByAccount(accountId: string): Promise<JiraProject[]> {
    const { data } = await apiClient.get<JiraProject[]>(`/jira/projects/account/${accountId}`);
    return data;
  }

  async syncProjects(accountId: string): Promise<void> {
    await apiClient.post(`/jira/accounts/${accountId}/sync-projects`);
  }

  async syncProjectTickets(projectId: string, assigneeAccountId?: string): Promise<any> {
    const body = assigneeAccountId ? { assigneeAccountId } : {};
    const { data } = await apiClient.post(`/jira/projects/${projectId}/sync`, body);
    return data;
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

  // Ticket Details
  async getTicketComments(ticketId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/jira/tickets/${ticketId}/comments`);
    return data;
  }

  async getTicketAttachments(ticketId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/jira/tickets/${ticketId}/attachments`);
    return data;
  }

  async getTicketDetails(ticketId: string): Promise<any> {
    const { data } = await apiClient.get(`/jira/tickets/${ticketId}/details`);
    return data;
  }

  async updateTicketDescription(ticketId: string, description: string): Promise<void> {
    await apiClient.patch(`/jira/tickets/${ticketId}/description`, { description });
  }

  async improveTicketDescription(description: string, context?: string): Promise<{
    title: string;
    description: string;
    acceptanceCriteria: Array<{ criteria: string; testable: boolean }>;
    technicalDetails?: string;
    scope: string;
    priority: string;
  }> {
    const { data } = await apiClient.post('/jira/tickets/improve',
      { description, context },
      { timeout: 180000 } // 3 minutes timeout for AI processing
    );
    return data;
  }

  async addTicketComment(ticketId: string, comment: string): Promise<any> {
    const { data } = await apiClient.post(`/jira/tickets/${ticketId}/comments`, { comment });
    return data;
  }

  // Hidden Comments
  async getHiddenComments(ticketId: string): Promise<HiddenComment[]> {
    const { data } = await apiClient.get<HiddenComment[]>(`/api/jira/tickets/${ticketId}/hidden-comments`);
    return data;
  }

  async createHiddenComment(ticketId: string, dto: CreateHiddenCommentDto): Promise<HiddenComment> {
    const { data } = await apiClient.post<HiddenComment>(`/api/jira/tickets/${ticketId}/hidden-comments`, dto);
    return data;
  }

  async updateHiddenComment(commentId: string, dto: UpdateHiddenCommentDto): Promise<HiddenComment> {
    const { data } = await apiClient.put<HiddenComment>(`/api/jira/hidden-comments/${commentId}`, dto);
    return data;
  }

  async deleteHiddenComment(commentId: string): Promise<void> {
    await apiClient.delete(`/api/jira/hidden-comments/${commentId}`);
  }
}

export default new JiraService();