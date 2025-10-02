export enum JobFailureType {
  SYNTAX_ERROR = 'syntax_error',
  CONFIGURATION_ERROR = 'configuration_error',
  DEPENDENCY_ISSUE = 'dependency_issue',
  RESOURCE_CONSTRAINT = 'resource_constraint',
  PERMISSION_ISSUE = 'permission_issue',
  NETWORK_ISSUE = 'network_issue',
  TEST_FAILURE = 'test_failure',
  BUILD_ERROR = 'build_error',
  ENVIRONMENT_ISSUE = 'environment_issue',
  EXTERNAL_SERVICE = 'external_service',
  UNKNOWN = 'unknown',
}

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum PipelineFailureType {
  CONFIG_ERROR = 'config_error',
  DEPENDENCY_FAILURE = 'dependency_failure',
  RESOURCE_LIMIT = 'resource_limit',
  PERMISSION_ERROR = 'permission_error',
  NETWORK_ERROR = 'network_error',
  MULTIPLE_JOB_FAILURES = 'multiple_job_failures',
  WORKFLOW_ERROR = 'workflow_error',
  UNKNOWN = 'unknown',
}

export interface JobAnalysis {
  id: string;
  jobId: string;
  jobName: string;
  stage: string;
  projectId: string;
  pipelineId: string;
  mergeRequestIid?: number;
  ref?: string;
  triggeredBy?: string;
  failureType: JobFailureType;
  rootCause: string;
  affectedComponent: string;
  errorDetails: string[];
  suggestedFixSteps: string[];
  suggestedFixCommands?: string[];
  preventionTips?: string[];
  confidence: ConfidenceLevel;
  additionalContext?: string;
  relatedFiles?: string[];
  estimatedFixTime?: string;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineAnalysis {
  id: string;
  pipelineId: string;
  pipelineName: string;
  projectId: string;
  mergeRequestIid?: number;
  ref?: string;
  triggeredBy?: string;
  status: string;
  failureType: PipelineFailureType;
  rootCause: string;
  affectedStages: string[];
  failedJobsCount: number;
  totalJobsCount: number;
  errorSummary: string;
  suggestedActions: string[];
  preventionTips?: string[];
  configIssues?: string[];
  dependencyIssues?: string[];
  confidence: ConfidenceLevel;
  additionalContext?: string;
  estimatedFixTime?: string;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyzeJobDto {
  platform: 'github' | 'gitlab';
  projectId: string;
  jobId: string;
  jobName: string;
  stage: string;
  pipelineId: string;
  mergeRequestId?: string;
  pullRequestId?: string;
  ref?: string;
  triggeredBy?: string;
}

export interface JobLogsDto {
  logs: string;
  config?: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  runner?: string;
  allowFailure?: boolean;
  jobUrl?: string;
}

export interface AnalyzePipelineDto {
  platform: 'github' | 'gitlab';
  projectId: string;
  pipelineId: string;
  pipelineName?: string;
  mergeRequestId?: string;
  pullRequestId?: string;
  ref?: string;
  triggeredBy?: string;
  status?: string;
}

export interface PipelineDataDto {
  failedJobsCount: number;
  totalJobsCount: number;
  config?: string;
  errorMessage?: string;
  failedJobs?: any[];
  hasConfigError?: boolean;
  pipelineUrl?: string;
}

export interface JobAnalysisResponse {
  analysis: JobAnalysis;
  postedToMR?: boolean;
  mrIid?: string;
  comment?: string;
  message: string;
}

export interface PipelineAnalysisResponse {
  analysis: PipelineAnalysis;
  postedToMR?: boolean;
  mrIid?: string;
  comment?: string;
  message: string;
}

export interface BatchAnalyzeJobInput {
  projectId: string;
  jobId: string;
  jobName: string;
  stage: string;
  pipelineId: string;
  logs: string;
  config?: string;
  status?: string;
}

export interface BatchAnalyzeResponse {
  platform: string;
  totalJobs: number;
  analyzedCount: number;
  analyses: JobAnalysis[];
}

export interface ProjectStatistics {
  projectId: string;
  totalAnalyses: number;
  failureTypeDistribution: Record<JobFailureType, number>;
  averageConfidence: number;
  mostCommonFailures: Array<{
    type: JobFailureType;
    count: number;
    percentage: number;
  }>;
  recentAnalyses: JobAnalysis[];
  successRate?: number;
  averageFixTime?: string;
}

export interface FailedJobsForMR {
  platform: string;
  projectId: string;
  mrId: string;
  count: number;
  analyses: JobAnalysis[];
}