export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TaskLinkType {
  JIRA_TICKET = 'jira_ticket',
  PULL_REQUEST = 'pull_request',
  MERGE_REQUEST = 'merge_request',
  ISSUE = 'issue',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  reporter?: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours: number;
  actualHours: number;
  tags?: string[];
  labels?: string[];
  metadata?: Record<string, any>;
  projectId: string;
  project?: any;
  links?: TaskLink[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskLink {
  id: string;
  taskId: string;
  linkType: TaskLinkType;
  externalId: string;
  externalUrl?: string;
  title?: string;
  status?: string;
  platform?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  reporter?: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  tags?: string[];
  labels?: string[];
  metadata?: Record<string, any>;
  projectId: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  completedAt?: string;
  actualHours?: number;
}

export interface LinkTaskDto {
  linkType: TaskLinkType;
  externalId: string;
  externalUrl?: string;
  title?: string;
  status?: string;
  platform?: string;
  metadata?: Record<string, any>;
}

export interface UnlinkTaskDto {
  linkType: TaskLinkType;
  externalId: string;
}

export interface TaskFilterDto {
  projectId?: string;
  status?: TaskStatus;
  statuses?: TaskStatus[];
  priority?: TaskPriority;
  assignee?: string;
  reporter?: string;
  tags?: string[];
  labels?: string[];
  dueDateBefore?: string;
  dueDateAfter?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface TasksResponse {
  data: Task[];
  total: number;
  page: number;
  lastPage: number;
}