export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  owner: string;
  localPath?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  key?: string;
  gitlabId?: string;
  jiraKey?: string;
  gitlabUrl?: string;
  jiraUrl?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: string;
  owner: string;
  localPath?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  key?: string;
  gitlabId?: string;
  jiraKey?: string;
  gitlabUrl?: string;
  jiraUrl?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: string;
  owner?: string;
  localPath?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  key?: string;
  gitlabId?: string;
  jiraKey?: string;
  gitlabUrl?: string;
  jiraUrl?: string;
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  page: number;
  lastPage: number;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  owner?: string;
}