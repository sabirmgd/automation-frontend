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

class CodeService {
  private readonly basePath = '/code';

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
}

export default new CodeService();