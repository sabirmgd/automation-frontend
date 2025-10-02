import { useState, useCallback, useEffect } from 'react';
import jobsService from '../services/jobs.service';
import type {
  JobAnalysis,
  PipelineAnalysis,
  JobAnalysisResponse,
  PipelineAnalysisResponse,
  ProjectStatistics,
  FailedJobsForMR,
  JobLogsDto,
  PipelineDataDto,
} from '../types/jobs.types';

interface UseJobAnalysisOptions {
  autoFetch?: boolean;
  platform?: 'github' | 'gitlab';
  projectId?: string;
}

export const useJobAnalysis = (options: UseJobAnalysisOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [pipelineAnalysis, setPipelineAnalysis] = useState<PipelineAnalysis | null>(null);
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [failedJobs, setFailedJobs] = useState<JobAnalysis[]>([]);

  const analyzeJob = useCallback(
    async (
      platform: 'github' | 'gitlab',
      projectId: string,
      jobId: string,
      jobData: JobLogsDto & { jobName: string; stage: string; pipelineId: string },
      mrIid?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response: JobAnalysisResponse = await jobsService.analyzeJob(
          platform,
          projectId,
          jobId,
          jobData,
          mrIid
        );
        setJobAnalysis(response.analysis);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to analyze job';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const analyzePipeline = useCallback(
    async (
      platform: 'github' | 'gitlab',
      projectId: string,
      pipelineId: string,
      pipelineData: PipelineDataDto & { pipelineName?: string },
      mrIid?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response: PipelineAnalysisResponse = await jobsService.analyzePipeline(
          platform,
          projectId,
          pipelineId,
          pipelineData,
          mrIid
        );
        setPipelineAnalysis(response.analysis);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to analyze pipeline';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchFailedJobsForMR = useCallback(
    async (platform: 'github' | 'gitlab', projectId: string, mrId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response: FailedJobsForMR = await jobsService.getFailedJobsForMR(
          platform,
          projectId,
          mrId
        );
        setFailedJobs(response.analyses);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch failed jobs';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchProjectStatistics = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await jobsService.getProjectJobStatistics(projectId);
      setStatistics(stats);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchAnalyzeJobs = useCallback(
    async (
      platform: 'github' | 'gitlab',
      jobs: Array<{
        projectId: string;
        jobId: string;
        jobName: string;
        stage: string;
        pipelineId: string;
        logs: string;
        config?: string;
        status?: string;
      }>
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await jobsService.batchAnalyzeJobs(platform, jobs);
        setFailedJobs(response.analyses);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to batch analyze jobs';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearAnalyses = useCallback(() => {
    setJobAnalysis(null);
    setPipelineAnalysis(null);
    setFailedJobs([]);
    setStatistics(null);
    setError(null);
  }, []);

  // Auto-fetch project statistics if configured
  useEffect(() => {
    if (options.autoFetch && options.projectId) {
      fetchProjectStatistics(options.projectId);
    }
  }, [options.autoFetch, options.projectId, fetchProjectStatistics]);

  return {
    loading,
    error,
    jobAnalysis,
    pipelineAnalysis,
    statistics,
    failedJobs,
    analyzeJob,
    analyzePipeline,
    fetchFailedJobsForMR,
    fetchProjectStatistics,
    batchAnalyzeJobs,
    clearAnalyses,
  };
};