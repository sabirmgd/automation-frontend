import apiClient from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type {
  Platform,
  PipelineAnalysis,
  PipelineDataDto,
  BatchPipelineAnalysisDto,
  PipelineAnalysisResponse,
  PipelineStatistics,
  WebhookEvent,
} from '../types/pipeline.types';

class PipelineService {
  async analyzePipeline(
    platform: Platform,
    projectId: string,
    pipelineId: string,
    pipelineData?: PipelineDataDto,
    mrIid?: string
  ): Promise<PipelineAnalysisResponse> {
    const params = mrIid ? { mrIid } : {};
    // Backend now fetches pipeline data using repository credentials
    // pipelineData is optional for backward compatibility
    const response = await apiClient.post<PipelineAnalysisResponse>(
      API_ENDPOINTS.PIPELINES.ANALYZE(platform, projectId, pipelineId),
      pipelineData || {},
      { params }
    );
    return response.data;
  }

  async getFailedPipelinesForMR(
    platform: Platform,
    projectId: string,
    mrId: string
  ): Promise<{
    platform: Platform;
    projectId: string;
    mrId: string;
    count: number;
    analyses: PipelineAnalysis[];
  }> {
    const response = await apiClient.get(
      API_ENDPOINTS.PIPELINES.FAILED_PIPELINES_FOR_MR(platform, projectId, mrId)
    );
    return response.data;
  }

  async batchAnalyzePipelines(
    platform: Platform,
    pipelines: BatchPipelineAnalysisDto[]
  ): Promise<{
    platform: Platform;
    totalPipelines: number;
    analyzedCount: number;
    analyses: PipelineAnalysis[];
  }> {
    const response = await apiClient.post(
      API_ENDPOINTS.PIPELINES.BATCH_ANALYZE(platform),
      pipelines
    );
    return response.data;
  }

  async getProjectStatistics(projectId: string): Promise<PipelineStatistics> {
    const response = await apiClient.get<PipelineStatistics>(
      API_ENDPOINTS.PIPELINES.STATISTICS(projectId)
    );
    return response.data;
  }

  async handleWebhook(
    platform: Platform,
    webhookData: any,
    headers?: Record<string, string>
  ): Promise<WebhookEvent> {
    const response = await apiClient.post<WebhookEvent>(
      API_ENDPOINTS.PIPELINES.WEBHOOK(platform),
      webhookData,
      { headers }
    );
    return response.data;
  }

  async getPipelinesWithMultipleFailures(
    projectId: string,
    minFailedJobs: number = 2
  ): Promise<{
    projectId: string;
    minFailedJobs: number;
    count: number;
    pipelines: PipelineAnalysis[];
  }> {
    const response = await apiClient.get(
      `/api/pipeline-analysis/multiple-failures/${projectId}`,
      { params: { minFailedJobs } }
    );
    return response.data;
  }

  async checkHealth(): Promise<{
    status: string;
    service: string;
    timestamp: string;
  }> {
    const response = await apiClient.get(API_ENDPOINTS.PIPELINES.HEALTH);
    return response.data;
  }
}

export default new PipelineService();