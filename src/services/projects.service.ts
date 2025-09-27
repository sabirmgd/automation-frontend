import apiClient from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectsResponse,
  ProjectFilters,
} from '../types/project.types';

class ProjectsService {
  async getProjects(filters?: ProjectFilters): Promise<ProjectsResponse> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get<ProjectsResponse>(
      `${API_ENDPOINTS.PROJECTS.BASE}?${params.toString()}`
    );
    return response.data;
  }

  async getProjectById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(API_ENDPOINTS.PROJECTS.BY_ID(id));
    return response.data;
  }

  async createProject(data: CreateProjectDto): Promise<Project> {
    const response = await apiClient.post<Project>(API_ENDPOINTS.PROJECTS.BASE, data);
    return response.data;
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await apiClient.patch<Project>(
      API_ENDPOINTS.PROJECTS.BY_ID(id),
      data
    );
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PROJECTS.BY_ID(id));
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(
      API_ENDPOINTS.PROJECTS.BY_STATUS(status)
    );
    return response.data;
  }

  async getProjectsByOwner(owner: string): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(
      API_ENDPOINTS.PROJECTS.BY_OWNER(owner)
    );
    return response.data;
  }

  async getProjectsByTags(tags: string[]): Promise<Project[]> {
    const response = await apiClient.post<Project[]>(
      API_ENDPOINTS.PROJECTS.BY_TAGS,
      { tags }
    );
    return response.data;
  }
}

export default new ProjectsService();