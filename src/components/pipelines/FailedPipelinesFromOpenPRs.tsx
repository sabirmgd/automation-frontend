import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import {
  AlertCircle,
  GitPullRequest,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import apiClient from '../../services/api.client';
import { useToast } from '@/hooks/use-toast';

interface Pipeline {
  id: string;
  iid: number;
  sha: string;
  ref: string;
  status: string;
  webUrl: string;
  createdAt: string;
  failedJobsCount: number;
  hasAnalysis: boolean;
  analysisId?: string;
}

interface PullRequestWithPipelines {
  pullRequest: {
    id: string;
    number: number;
    title: string;
    authorUsername: string;
    sourceBranch: string;
    targetBranch: string;
    url: string;
  };
  pipelines: Pipeline[];
}

interface Job {
  id: string;
  name: string;
  stage: string;
  status: string;
  failureReason?: string;
  webUrl: string;
  duration?: number;
  hasAnalysis: boolean;
  analysisId?: string;
}

interface PipelineWithJobs {
  pipeline: {
    id: string;
    iid: number;
    ref: string;
    pullRequest?: {
      id: string;
      number: number;
      title: string;
    };
  };
  jobs: Job[];
}

interface FailedPipelinesFromOpenPRsProps {
  repositoryId?: string;
  projectId?: string;
}

export function FailedPipelinesFromOpenPRs({ repositoryId, projectId }: FailedPipelinesFromOpenPRsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pipelines' | 'jobs'>('pipelines');
  const [pipelinesData, setPipelinesData] = useState<PullRequestWithPipelines[]>([]);
  const [jobsData, setJobsData] = useState<PipelineWithJobs[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [analyzingItems, setAnalyzingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('FailedPipelinesFromOpenPRs - repositoryId:', repositoryId);
    if (repositoryId) {
      // Automatically sync pipelines when component mounts
      toast({
        title: 'Syncing pipelines',
        description: 'Fetching failed pipelines from open PRs...',
      });
      syncPipelines().then(() => {
        loadFailedPipelines();
        loadFailedJobs();
      });
    } else {
      console.warn('No repositoryId provided to FailedPipelinesFromOpenPRs');
    }
  }, [repositoryId]);

  const syncPipelines = async () => {
    if (!repositoryId) return;

    setIsSyncing(true);
    try {
      const response = await apiClient.post<{ created: number; updated: number }>(`/api/pipelines/sync/${repositoryId}`);
      toast({
        title: 'Sync completed',
        description: `Synced ${response.data.created} new and ${response.data.updated} updated pipelines`,
      });

      // Reload data after sync
      await loadFailedPipelines();
      await loadFailedJobs();
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'Failed to sync pipelines from repository',
        variant: 'destructive',
      });
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFailedPipelines = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ data: PullRequestWithPipelines[] }>('/api/pipelines/failed/open-prs', {
        params: { repositoryId },
      });
      setPipelinesData(response.data.data || []);
    } catch (error) {
      toast({
        title: 'Load failed',
        description: 'Failed to load pipelines',
        variant: 'destructive',
      });
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFailedJobs = async () => {
    try {
      const response = await apiClient.get<{ data: PipelineWithJobs[] }>('/api/pipelines/failed-jobs/open-prs', {
        params: { repositoryId },
      });
      setJobsData(response.data.data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const analyzePipeline = async (pipelineId: string, prNumber?: number) => {
    setAnalyzingItems(prev => new Set(prev).add(pipelineId));

    try {
      // Call the analyze endpoint
      await apiClient.post(`/api/pipeline-analysis/analyze/github/${projectId || repositoryId}/${pipelineId}`, {
        mrIid: prNumber?.toString(),
      });

      toast({
        title: 'Analysis complete',
        description: 'Pipeline analyzed successfully',
      });

      // Reload to show updated analysis status
      await loadFailedPipelines();
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: 'Failed to analyze pipeline',
        variant: 'destructive',
      });
      console.error('Analysis error:', error);
    } finally {
      setAnalyzingItems(prev => {
        const next = new Set(prev);
        next.delete(pipelineId);
        return next;
      });
    }
  };

  const analyzeJob = async (jobId: string, pipelineId: string) => {
    setAnalyzingItems(prev => new Set(prev).add(jobId));

    try {
      // Call the analyze job endpoint
      await apiClient.post(`/api/job-analysis/analyze/github/${projectId || repositoryId}/${jobId}`, {
        pipelineId,
      });

      toast({
        title: 'Analysis complete',
        description: 'Job analyzed successfully',
      });

      // Reload to show updated analysis status
      await loadFailedJobs();
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: 'Failed to analyze job',
        variant: 'destructive',
      });
      console.error('Analysis error:', error);
    } finally {
      setAnalyzingItems(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'failed':
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderPipelines = () => {
    if (isLoading || isSyncing) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-600">
                {isSyncing ? 'Syncing pipelines from open PRs...' : 'Loading pipelines...'}
              </p>
              <p className="text-sm text-gray-500">
                This happens automatically when you open this page
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (pipelinesData.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No failed pipelines found in open pull requests
            </p>
            <Button onClick={syncPipelines} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Pipelines
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {pipelinesData.map((prData) => (
            <Card key={prData.pullRequest.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GitPullRequest className="h-5 w-5" />
                      PR #{prData.pullRequest.number}: {prData.pullRequest.title}
                    </CardTitle>
                    <CardDescription>
                      {prData.pullRequest.sourceBranch} → {prData.pullRequest.targetBranch}
                      <span className="ml-2">by @{prData.pullRequest.authorUsername}</span>
                    </CardDescription>
                  </div>
                  <a
                    href={prData.pullRequest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View PR →
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prData.pipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(pipeline.status)}
                        <div>
                          <div className="font-medium">
                            Pipeline #{pipeline.iid}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pipeline.ref} • {pipeline.failedJobsCount} failed jobs
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(pipeline.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pipeline.hasAnalysis ? (
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Analyzed
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => analyzePipeline(pipeline.id, prData.pullRequest.number)}
                            disabled={analyzingItems.has(pipeline.id)}
                          >
                            {analyzingItems.has(pipeline.id) ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-1" />
                                Analyze
                              </>
                            )}
                          </Button>
                        )}
                        <a
                          href={pipeline.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderJobs = () => {
    if (jobsData.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No failed jobs found in open pull requests
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {jobsData.map((pipelineData) => (
            <Card key={pipelineData.pipeline.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Pipeline #{pipelineData.pipeline.iid}
                  {pipelineData.pipeline.pullRequest && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (PR #{pipelineData.pipeline.pullRequest.number})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{pipelineData.pipeline.ref}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pipelineData.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="font-medium">{job.name}</div>
                          <div className="text-sm text-gray-500">
                            Stage: {job.stage}
                            {job.failureReason && ` • ${job.failureReason}`}
                          </div>
                          {job.duration && (
                            <div className="text-xs text-gray-400">
                              Duration: {Math.round(job.duration / 60)}m {job.duration % 60}s
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.hasAnalysis ? (
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Analyzed
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => analyzeJob(job.id, pipelineData.pipeline.id)}
                            disabled={analyzingItems.has(job.id)}
                          >
                            {analyzingItems.has(job.id) ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-1" />
                                Analyze
                              </>
                            )}
                          </Button>
                        )}
                        <a
                          href={job.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  };

  // Show message if no repository is selected
  if (!repositoryId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-gray-600 text-center">
            No repository selected
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please select a repository from the Repositories tab first
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Failed Pipelines from Open PRs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automatically synced when you open this page • Click analyze to get AI-powered fixes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              syncPipelines().then(() => {
                loadFailedPipelines();
                loadFailedJobs();
              });
            }}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-sync
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pipelines' | 'jobs')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pipelines">
            Failed Pipelines
            {pipelinesData.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {pipelinesData.reduce((acc, pr) => acc + pr.pipelines.length, 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs">
            Failed Jobs
            {jobsData.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {jobsData.reduce((acc, p) => acc + p.jobs.length, 0)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-4">
          {renderPipelines()}
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          {renderJobs()}
        </TabsContent>
      </Tabs>
    </div>
  );
}