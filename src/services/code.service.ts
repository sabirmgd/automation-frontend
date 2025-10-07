import apiClient from './api.client';

interface AnalysisRequest {
  projectId: string;
  ticketId: string;
}

interface AnalysisResponse {
  projectId: string;
  projectName: string;
  ticketId: string;
  ticketKey: string;
  status: string;
  message: string;
}

interface WorkflowBranchNameResponse {
  id: string;
  ticketId: string;
  projectId: string;
  generatedBranchName: string;
  branchNameMetadata: {
    type?: string;
    confidence?: string;
    reasoning?: string;
    alternatives?: string[];
    generatedAt?: string;
  };
  status: string;
}

interface TicketWorkflow {
  id: string;
  ticketId: string;
  projectId: string;
  analysisSessionId?: string;
  analysisStatus: 'none' | 'pending' | 'complete';
  generatedBranchName?: string;
  branchNameMetadata?: {
    type?: string;
    confidence?: string;
    reasoning?: string;
    alternatives?: string[];
    generatedAt?: string;
  };
  worktreeId?: string;
  happySessionId?: string;
  pullRequestId?: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

class CodeService {
  private readonly basePath = '/code';
  private readonly workflowPath = '/workflows';

  async createPreliminaryAnalysis(projectId: string, ticketId: string): Promise<AnalysisResponse> {
    const response = await apiClient.post<AnalysisResponse>(
      `${this.basePath}/analysis`,
      {
        projectId,
        ticketId,
      }
    );
    return response.data;
  }

  async checkForNewAIComments(ticketIds: string[]): Promise<Record<string, boolean>> {
    const response = await apiClient.get<Record<string, boolean>>(
      `${this.basePath}/analysis/check-ai-comments`,
      {
        params: {
          ticketIds: ticketIds.join(','),
        },
      }
    );
    return response.data;
  }

  // Workflow methods
  async getWorkflowByTicketId(ticketId: string): Promise<TicketWorkflow | null> {
    try {
      const response = await apiClient.get<TicketWorkflow>(
        `${this.workflowPath}/ticket/${ticketId}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async generateBranchName(
    ticketId: string,
    projectId: string,
    options?: {
      includeTicketId?: boolean;
      branchType?: string;
      maxLength?: number;
    }
  ): Promise<WorkflowBranchNameResponse> {
    const response = await apiClient.post<WorkflowBranchNameResponse>(
      `${this.workflowPath}/branch-name`,
      {
        ticketId,
        projectId,
        options,
      }
    );
    return response.data;
  }

  async initWorkflow(ticketId: string, projectId: string): Promise<TicketWorkflow> {
    const response = await apiClient.post<TicketWorkflow>(
      `${this.workflowPath}/init`,
      {
        ticketId,
        projectId,
      }
    );
    return response.data;
  }

  async createWorktree(
    ticketId: string,
    subfolder: string,
    baseBranch: string,
    envHandling?: 'link' | 'copy' | 'skip',
    shareNodeModules?: boolean
  ): Promise<TicketWorkflow> {
    const response = await apiClient.post<TicketWorkflow>(
      `${this.workflowPath}/worktree`,
      {
        ticketId,
        subfolder,
        baseBranch,
        envHandling,
        shareNodeModules,
      }
    );
    return response.data;
  }

  async deleteWorktree(
    ticketId: string,
    options?: { deleteBranch?: boolean; force?: boolean }
  ): Promise<TicketWorkflow> {
    const response = await apiClient.delete<TicketWorkflow>(
      `${this.workflowPath}/ticket/${ticketId}/worktree`,
      { data: options }
    );
    return response.data;
  }
}

export default new CodeService();