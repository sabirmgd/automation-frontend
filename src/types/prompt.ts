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