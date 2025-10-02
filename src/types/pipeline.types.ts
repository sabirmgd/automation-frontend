export type Platform = 'github' | 'gitlab';

export type PipelineStatus = 'failed' | 'success' | 'running' | 'pending' | 'canceled';

export type PipelineFailureType =
  | 'configuration_error'
  | 'dependency_failure'
  | 'test_failure'
  | 'build_failure'
  | 'deployment_failure'
  | 'permission_issue'
  | 'timeout'
  | 'resource_limit'
  | 'network_error'
  | 'unknown';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface FailedJob {
  jobName: string;
  stage: string;
  failureReason?: string;
}

export interface PipelineAnalysis {
  id: string;
  pipelineId: string;
  pipelineName?: string;
  platform: Platform;
  projectId: string;
  ref?: string;
  mergeRequestIid?: number;
  pullRequestNumber?: number;
  status: PipelineStatus;
  triggeredBy?: string;
  failedJobsCount: number;
  totalJobsCount: number;
  failureTypes: PipelineFailureType[];
  rootCauseAnalysis: string;
  suggestedFixes: string[];
  confidenceLevel: ConfidenceLevel;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineDataDto {
  failedJobsCount: number;
  totalJobsCount: number;
  config?: string;
  errorMessage?: string;
  failedJobs?: FailedJob[];
  hasConfigError?: boolean;
  pipelineUrl?: string;
  status?: PipelineStatus;
  pipelineName?: string;
  ref?: string;
  triggeredBy?: string;
}

export interface AnalyzePipelineDto {
  platform: Platform;
  projectId: string;
  pipelineId: string;
  pipelineName?: string;
  mergeRequestId?: string;
  pullRequestId?: string;
  ref?: string;
  triggeredBy?: string;
  status: string;
}

export interface BatchPipelineAnalysisDto {
  projectId: string;
  pipelineId: string;
  pipelineName?: string;
  status: string;
  failedJobsCount: number;
  totalJobsCount: number;
  config?: string;
  errorMessage?: string;
  failedJobs?: FailedJob[];
}

export interface PipelineAnalysisResponse {
  analysis: PipelineAnalysis;
  postedToMR?: boolean;
  mrIid?: string;
  comment?: string;
  message: string;
}

export interface PipelineStatistics {
  projectId?: string;
  totalAnalyses: number;
  failureTypeBreakdown: Record<string, number>;
  averageFailedJobs: number;
  mostCommonFailures: Array<{
    type: string;
    count: number;
  }>;
  configErrorRate: number;
  recentAnalyses?: PipelineAnalysis[];
}

export interface WebhookEvent {
  platform: Platform;
  eventType: string;
  pipelineId?: string;
  workflowId?: string;
  projectId?: string;
  repositoryName?: string;
  status: string;
  mrIid?: number;
  prNumber?: number;
}