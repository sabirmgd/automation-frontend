import apiClient from './api.client';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  TaskLink,
  LinkTaskDto,
  UnlinkTaskDto,
  TaskStatus,
  TasksResponse
} from '../types/task.types';

class TasksService {
  private readonly basePath = '/tasks';

  async create(data: CreateTaskDto): Promise<Task> {
    const response = await apiClient.post<Task>(this.basePath, data);
    return response.data;
  }

  async findAll(filters?: TaskFilterDto): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(this.basePath, { params: filters });
    return response.data;
  }

  async findOne(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`${this.basePath}/${id}`);
    return response.data;
  }

  async findByProject(projectId: string): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`);
    return response.data;
  }

  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const response = await apiClient.patch<Task>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch<Task>(`${this.basePath}/${id}/status`, { status });
    return response.data;
  }

  async bulkUpdateStatus(taskIds: string[], status: TaskStatus): Promise<Task[]> {
    const response = await apiClient.post<Task[]>(`${this.basePath}/bulk-update-status`, {
      taskIds,
      status
    });
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async addLink(taskId: string, data: LinkTaskDto): Promise<TaskLink> {
    const response = await apiClient.post<TaskLink>(`${this.basePath}/${taskId}/links`, data);
    return response.data;
  }

  async removeLink(taskId: string, data: UnlinkTaskDto): Promise<void> {
    await apiClient.delete(`${this.basePath}/${taskId}/links`, { data });
  }

  async getLinks(taskId: string): Promise<TaskLink[]> {
    const response = await apiClient.get<TaskLink[]>(`${this.basePath}/${taskId}/links`);
    return response.data;
  }

  async getTasksByJiraTicket(jiraTicketId: string): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.basePath}/jira/${jiraTicketId}`);
    return response.data;
  }

  async getTasksByPullRequest(pullRequestId: string): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.basePath}/pr/${pullRequestId}`);
    return response.data;
  }

  async createForProject(projectId: string, data: Omit<CreateTaskDto, 'projectId'>): Promise<Task> {
    const response = await apiClient.post<Task>(`/projects/${projectId}/tasks`, data);
    return response.data;
  }

  getStatusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'gray',
      [TaskStatus.IN_PROGRESS]: 'blue',
      [TaskStatus.IN_REVIEW]: 'yellow',
      [TaskStatus.DONE]: 'green',
      [TaskStatus.BLOCKED]: 'red',
      [TaskStatus.CANCELLED]: 'gray',
    };
    return colors[status] || 'gray';
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      low: 'gray',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    };
    return colors[priority] || 'gray';
  }

  getStatusIcon(status: TaskStatus): string {
    const icons: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: '○',
      [TaskStatus.IN_PROGRESS]: '◐',
      [TaskStatus.IN_REVIEW]: '👁',
      [TaskStatus.DONE]: '✓',
      [TaskStatus.BLOCKED]: '⛔',
      [TaskStatus.CANCELLED]: '✗',
    };
    return icons[status] || '○';
  }
}

export default new TasksService();