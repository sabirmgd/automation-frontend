import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import pipelineService from '../services/pipeline.service';
import { useToast } from './use-toast';
import type {
  Platform,
  PipelineDataDto,
  BatchPipelineAnalysisDto,
  PipelineStatistics,
} from '../types/pipeline.types';

export function usePipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const analyzePipelineMutation = useMutation({
    mutationFn: ({
      platform,
      projectId,
      pipelineId,
      pipelineData,
      mrIid,
    }: {
      platform: Platform;
      projectId: string;
      pipelineId: string;
      pipelineData?: PipelineDataDto;
      mrIid?: string;
    }) => pipelineService.analyzePipeline(platform, projectId, pipelineId, pipelineData, mrIid),
    onSuccess: (data) => {
      toast({
        title: 'Pipeline Analysis Complete',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Pipeline Analysis Failed',
        description: error.response?.data?.message || 'Failed to analyze pipeline',
        variant: 'destructive',
      });
    },
  });

  const batchAnalyzeMutation = useMutation({
    mutationFn: ({
      platform,
      pipelines,
    }: {
      platform: Platform;
      pipelines: BatchPipelineAnalysisDto[];
    }) => pipelineService.batchAnalyzePipelines(platform, pipelines),
    onSuccess: (data) => {
      toast({
        title: 'Batch Analysis Complete',
        description: `Analyzed ${data.analyzedCount} of ${data.totalPipelines} pipelines`,
      });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Batch Analysis Failed',
        description: error.response?.data?.message || 'Failed to analyze pipelines',
        variant: 'destructive',
      });
    },
  });

  const getFailedPipelinesForMR = useCallback(
    async (platform: Platform, projectId: string, mrId: string) => {
      setIsLoading(true);
      try {
        const result = await pipelineService.getFailedPipelinesForMR(platform, projectId, mrId);
        return result;
      } catch (error: any) {
        toast({
          title: 'Failed to fetch pipelines',
          description: error.response?.data?.message || 'Could not retrieve failed pipelines',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const getPipelinesWithMultipleFailures = useCallback(
    async (projectId: string, minFailedJobs: number = 2) => {
      setIsLoading(true);
      try {
        const result = await pipelineService.getPipelinesWithMultipleFailures(
          projectId,
          minFailedJobs
        );
        return result;
      } catch (error: any) {
        toast({
          title: 'Failed to fetch pipelines',
          description: error.response?.data?.message || 'Could not retrieve pipelines',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const useProjectStatistics = (projectId: string) => {
    return useQuery<PipelineStatistics>({
      queryKey: ['pipeline-statistics', projectId],
      queryFn: () => pipelineService.getProjectStatistics(projectId),
      enabled: !!projectId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const checkPipelineHealth = useCallback(async () => {
    try {
      const result = await pipelineService.checkHealth();
      return result;
    } catch (error: any) {
      toast({
        title: 'Health Check Failed',
        description: 'Pipeline analysis service may be unavailable',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    isLoading,
    analyzePipeline: analyzePipelineMutation.mutate,
    analyzePipelineAsync: analyzePipelineMutation.mutateAsync,
    isAnalyzingPipeline: analyzePipelineMutation.isPending,
    batchAnalyzePipelines: batchAnalyzeMutation.mutate,
    batchAnalyzePipelinesAsync: batchAnalyzeMutation.mutateAsync,
    isBatchAnalyzing: batchAnalyzeMutation.isPending,
    getFailedPipelinesForMR,
    getPipelinesWithMultipleFailures,
    useProjectStatistics,
    checkPipelineHealth,
  };
}