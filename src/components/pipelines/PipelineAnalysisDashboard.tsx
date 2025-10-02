import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FailedPipelinesFromOpenPRs } from './FailedPipelinesFromOpenPRs';
import { PipelineAnalysisForm } from './PipelineAnalysisForm';
import { PipelineStatisticsView } from './PipelineStatisticsView';
import {
  Activity,
  AlertCircle,
  BarChart3,
  GitPullRequest,
  Zap,
} from 'lucide-react';

interface PipelineAnalysisDashboardProps {
  repositoryId?: string;
  projectId?: string;
  platform?: 'github' | 'gitlab';
}

export function PipelineAnalysisDashboard({
  repositoryId,
  projectId,
  platform = 'github',
}: PipelineAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('failed-pipelines'); // Start with the main feature

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Analyze CI/CD pipeline failures and get AI-powered suggestions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="failed-pipelines" className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4" />
            Failed Pipelines
          </TabsTrigger>
          <TabsTrigger value="manual-analysis" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Manual Analysis
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="failed-pipelines" className="space-y-4">
          <FailedPipelinesFromOpenPRs
            repositoryId={repositoryId}
            projectId={projectId}
          />
        </TabsContent>

        <TabsContent value="manual-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Pipeline Analysis</CardTitle>
              <CardDescription>
                Manually analyze a specific pipeline by providing its ID and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineAnalysisForm
                projectId={projectId || repositoryId || ''}
                platform={platform}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Statistics</CardTitle>
              <CardDescription>
                View statistics and trends for pipeline analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectId && (
                <PipelineStatisticsView
                  statistics={{
                    totalAnalyses: 0,
                    failureTypeBreakdown: {},
                    averageFailedJobs: 0,
                    mostCommonFailures: [],
                    configErrorRate: 0,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}