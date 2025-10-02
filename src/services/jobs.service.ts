import apiClient from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type {
  JobAnalysis,
  PipelineAnalysis,
  AnalyzeJobDto,
  JobLogsDto,
  AnalyzePipelineDto,
  PipelineDataDto,
  JobAnalysisResponse,
  PipelineAnalysisResponse,
  BatchAnalyzeJobInput,
  BatchAnalyzeResponse,
  ProjectStatistics,
  FailedJobsForMR,
} from '../types/jobs.types';

class JobsService {
  // Job Analysis Methods
  async analyzeJob(
    platform: 'github' | 'gitlab',
    projectId: string,
    jobId: string,
    jobData: Partial<AnalyzeJobDto> & JobLogsDto,
    mrIid?: string
  ): Promise<JobAnalysisResponse> {
    const params = mrIid ? { mrIid } : {};
    // Backend now fetches job logs using repository credentials
    // jobData is optional for backward compatibility
    const response = await apiClient.post<JobAnalysisResponse>(
      API_ENDPOINTS.JOBS.ANALYZE(platform, projectId, jobId),
      jobData || {},
      { params }
    );
    return response.data;
  }

  async getFailedJobsForMR(
    platform: 'github' | 'gitlab',
    projectId: string,
    mrId: string
  ): Promise<FailedJobsForMR> {
    const response = await apiClient.get<FailedJobsForMR>(
      API_ENDPOINTS.JOBS.FAILED_JOBS_FOR_MR(platform, projectId, mrId)
    );
    return response.data;
  }

  async batchAnalyzeJobs(
    platform: 'github' | 'gitlab',
    jobs: BatchAnalyzeJobInput[]
  ): Promise<BatchAnalyzeResponse> {
    const response = await apiClient.post<BatchAnalyzeResponse>(
      API_ENDPOINTS.JOBS.BATCH_ANALYZE(platform),
      jobs
    );
    return response.data;
  }

  async getProjectJobStatistics(projectId: string): Promise<ProjectStatistics> {
    const response = await apiClient.get<ProjectStatistics>(
      API_ENDPOINTS.JOBS.STATISTICS(projectId)
    );
    return response.data;
  }

  async checkJobAnalysisHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await apiClient.get<{ status: string; service: string; timestamp: string }>(
      API_ENDPOINTS.JOBS.HEALTH
    );
    return response.data;
  }

  // Pipeline Analysis Methods
  async analyzePipeline(
    platform: 'github' | 'gitlab',
    projectId: string,
    pipelineId: string,
    pipelineData: Partial<AnalyzePipelineDto> & PipelineDataDto,
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
    platform: 'github' | 'gitlab',
    projectId: string,
    mrId: string
  ): Promise<{ platform: string; projectId: string; mrId: string; count: number; analyses: PipelineAnalysis[] }> {
    const response = await apiClient.get<{
      platform: string;
      projectId: string;
      mrId: string;
      count: number;
      analyses: PipelineAnalysis[];
    }>(API_ENDPOINTS.PIPELINES.FAILED_PIPELINES_FOR_MR(platform, projectId, mrId));
    return response.data;
  }

  async batchAnalyzePipelines(
    platform: 'github' | 'gitlab',
    pipelines: Array<{
      projectId: string;
      pipelineId: string;
      pipelineName: string;
      status?: string;
      failedJobsCount: number;
      totalJobsCount: number;
      config?: string;
      errorMessage?: string;
    }>
  ): Promise<{ platform: string; totalPipelines: number; analyzedCount: number; analyses: PipelineAnalysis[] }> {
    const response = await apiClient.post<{
      platform: string;
      totalPipelines: number;
      analyzedCount: number;
      analyses: PipelineAnalysis[];
    }>(API_ENDPOINTS.PIPELINES.BATCH_ANALYZE(platform), pipelines);
    return response.data;
  }

  async getProjectPipelineStatistics(projectId: string): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.PIPELINES.STATISTICS(projectId));
    return response.data;
  }

  async checkPipelineAnalysisHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await apiClient.get<{ status: string; service: string; timestamp: string }>(
      API_ENDPOINTS.PIPELINES.HEALTH
    );
    return response.data;
  }

  // Webhook handlers
  async sendJobWebhook(platform: 'github' | 'gitlab', webhookData: any): Promise<any> {
    const response = await apiClient.post(
      API_ENDPOINTS.JOBS.WEBHOOK(platform),
      webhookData
    );
    return response.data;
  }

  async sendPipelineWebhook(platform: 'github' | 'gitlab', webhookData: any): Promise<any> {
    const response = await apiClient.post(
      API_ENDPOINTS.PIPELINES.WEBHOOK(platform),
      webhookData
    );
    return response.data;
  }

  // Helper methods for formatting and processing
  getFailureTypeLabel(type: string): string {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
    switch (confidence) {
      case 'high':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'red';
      default:
        return 'gray';
    }
  }

  formatDuration(milliseconds?: number): string {
    if (!milliseconds) return 'N/A';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Method to get job logs from a URL (if needed for real-time analysis)
  async fetchJobLogs(
    platform: 'github' | 'gitlab',
    projectId: string,
    jobId: string
  ): Promise<string> {
    // This would need to be implemented based on your backend's capability
    // to fetch logs from GitLab/GitHub APIs
    const response = await apiClient.get<{ logs: string }>(
      `/api/jobs/${platform}/${projectId}/${jobId}/logs`
    );
    return response.data.logs;
  }
}

export default new JobsService();