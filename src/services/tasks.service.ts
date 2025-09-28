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
} from '@/types';

class TasksService {
  private getBasePath(projectId: string) {
    return `/projects/${projectId}/tasks`;
  }

  async create(projectId: string, data: CreateTaskDto): Promise<Task> {
    const response = await apiClient.post<Task>(this.getBasePath(projectId), data);
    return response.data;
  }

  async findByProject(projectId: string, filters?: TaskFilterDto): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(this.getBasePath(projectId), { params: filters });
    return response.data;
  }

  async findOne(projectId: string, taskId: string): Promise<Task> {
    const response = await apiClient.get<Task>(`${this.getBasePath(projectId)}/${taskId}`);
    return response.data;
  }

  async update(projectId: string, taskId: string, data: UpdateTaskDto): Promise<Task> {
    const response = await apiClient.patch<Task>(`${this.getBasePath(projectId)}/${taskId}`, data);
    return response.data;
  }

  async updateStatus(projectId: string, taskId: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch<Task>(`${this.getBasePath(projectId)}/${taskId}/status`, { status });
    return response.data;
  }
  
  async delete(projectId: string, taskId: string): Promise<void> {
    await apiClient.delete(`${this.getBasePath(projectId)}/${taskId}`);
  }

  async addLink(projectId: string, taskId: string, data: LinkTaskDto): Promise<TaskLink> {
    const response = await apiClient.post<TaskLink>(`${this.getBasePath(projectId)}/${taskId}/links`, data);
    return response.data;
  }

  async removeLink(projectId: string, taskId: string, data: UnlinkTaskDto): Promise<void> {
    await apiClient.delete(`${this.getBasePath(projectId)}/${taskId}/links`, { data });
  }

  async getLinks(projectId: string, taskId: string): Promise<TaskLink[]> {
    const response = await apiClient.get<TaskLink[]>(`${this.getBasePath(projectId)}/${taskId}/links`);
    return response.data;
  }
}

export default new TasksService();