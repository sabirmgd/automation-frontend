import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5556';

export interface Prompt {
  id: string;
  name: string;
  content: string;
  projectId: string | null;
  project?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptDto {
  name: string;
  content: string;
  projectId?: string;
}

export interface UpdatePromptDto {
  name?: string;
  content?: string;
  projectId?: string;
}

class PromptsService {
  private baseURL = `${API_BASE_URL}/prompts`;

  async getPrompts(projectId?: string): Promise<Prompt[]> {
    const params = projectId ? { projectId } : {};
    const response = await axios.get(this.baseURL, { params });
    return response.data;
  }

  async getGlobalPrompts(): Promise<Prompt[]> {
    const response = await axios.get(`${this.baseURL}/global`);
    return response.data;
  }

  async getProjectPrompts(projectId: string): Promise<Prompt[]> {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/prompts`);
    return response.data;
  }

  async getPromptById(id: string): Promise<Prompt> {
    const response = await axios.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async getPromptByName(name: string, projectId?: string): Promise<Prompt> {
    const params = projectId ? { projectId } : {};
    const response = await axios.get(`${this.baseURL}/by-name/${name}`, { params });
    return response.data;
  }

  async createPrompt(data: CreatePromptDto): Promise<Prompt> {
    const response = await axios.post(this.baseURL, data);
    return response.data;
  }

  async createProjectPrompt(projectId: string, data: CreatePromptDto): Promise<Prompt> {
    const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/prompts`, data);
    return response.data;
  }

  async updatePrompt(id: string, data: UpdatePromptDto): Promise<Prompt> {
    const response = await axios.patch(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  async deletePrompt(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/${id}`);
  }
}

export default new PromptsService();