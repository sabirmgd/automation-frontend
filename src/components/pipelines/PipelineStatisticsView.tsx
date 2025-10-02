import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { PipelineStatistics, PipelineFailureType } from '../../types/pipeline.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, AlertTriangle, Activity, BarChart3 } from 'lucide-react';

interface PipelineStatisticsViewProps {
  statistics: PipelineStatistics;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
];

export function PipelineStatisticsView({ statistics }: PipelineStatisticsViewProps) {
  const failureTypeLabels: Record<PipelineFailureType, string> = {
    configuration_error: 'Config Error',
    dependency_failure: 'Dependency',
    test_failure: 'Test Failure',
    build_failure: 'Build Failure',
    deployment_failure: 'Deploy Failure',
    permission_issue: 'Permission',
    timeout: 'Timeout',
    resource_limit: 'Resource Limit',
    network_error: 'Network',
    unknown: 'Unknown',
  };

  // Handle undefined or null statistics
  if (!statistics || !statistics.failureTypeBreakdown) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <p>No statistics available</p>
      </div>
    );
  }

  const chartData = Object.entries(statistics.failureTypeBreakdown).map(([type, count]) => ({
    name: failureTypeLabels[type as PipelineFailureType] || type,
    value: count,
    percentage: statistics.totalAnalyses > 0 ? Math.round((count / statistics.totalAnalyses) * 100) : 0,
  }));

  const topFailures = statistics.mostCommonFailures?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">Pipeline failure analyses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Avg Failed Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averageFailedJobs.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Jobs per failed pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Most Common Failure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {topFailures[0] ?
                (failureTypeLabels[topFailures[0].type as PipelineFailureType] || topFailures[0].type) :
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {topFailures[0] && statistics.totalAnalyses > 0
                ? `${Math.round((topFailures[0].count / statistics.totalAnalyses) * 100)}% of failures`
                : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Failure Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                fontSize={12}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value} failures`}
                labelFormatter={(label: any) => `Type: ${label}`}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Failure Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topFailures.map((failure, index) => {
              const percentage = statistics.totalAnalyses > 0
                ? Math.round((failure.count / statistics.totalAnalyses) * 100)
                : 0;
              return (
                <div key={failure.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {index + 1}. {failureTypeLabels[failure.type as PipelineFailureType] || failure.type}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {failure.count} occurrences
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failure Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.slice(0, 5).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {statistics.recentAnalyses && statistics.recentAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.recentAnalyses.slice(0, 5).map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-start justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {analysis.pipelineName || `Pipeline #${analysis.pipelineId}`}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {analysis.platform}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {analysis.rootCauseAnalysis}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {analysis.failureTypes.slice(0, 2).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {failureTypeLabels[type]}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}