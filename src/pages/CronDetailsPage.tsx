import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Play, RefreshCw } from 'lucide-react';
import { CronExecutionHistory } from '@/components/crons/CronExecutionHistory';
import { CronForm } from '@/components/crons/CronForm';
import { cronService } from '@/services/cron.service';
import projectsService from '@/services/projects.service';
import type { CronJob, CronJobExecution, UpdateCronDto } from '@/types/cron.types';
import { CronJobStatus, parseCronExpression } from '@/types/cron.types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const CronDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cronJob, setCronJob] = useState<CronJob | null>(null);
  const [executions, setExecutions] = useState<CronJobExecution[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCronJob();
      loadExecutions();
      loadProjects();
    }
  }, [id]);

  const loadCronJob = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await cronService.getCronJob(id);
      setCronJob(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load cron job',
        variant: 'destructive',
      });
      navigate('/crons');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    if (!id) return;
    try {
      const data = await cronService.getCronJobExecutions(id);
      setExecutions(data);
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await projectsService.getProjects();
      setProjects(data.projects.map((p: any) => ({ id: p.id, name: p.name })));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleRun = async () => {
    if (!id) return;
    try {
      const result = await cronService.runCronJob(id);
      toast({
        title: 'Success',
        description: result.message,
      });
      setTimeout(() => {
        loadCronJob();
        loadExecutions();
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run cron job',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async () => {
    if (!id) return;
    try {
      const updated = await cronService.toggleCronJob(id);
      setCronJob(updated);
      toast({
        title: 'Success',
        description: updated.isActive ? 'Cron job activated' : 'Cron job deactivated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle cron job',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: UpdateCronDto) => {
    if (!id) return;
    try {
      const updated = await cronService.updateCronJob(id, data);
      setCronJob(updated);
      toast({
        title: 'Success',
        description: 'Cron job updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update cron job',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getStatusBadgeVariant = (status: CronJobStatus): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case CronJobStatus.ACTIVE:
        return 'default';
      case CronJobStatus.RUNNING:
        return 'secondary';
      case CronJobStatus.ERROR:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cronJob) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/crons')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cron Jobs
          </Button>
          <h1 className="text-2xl font-bold">{cronJob.name}</h1>
          <Badge variant={getStatusBadgeVariant(cronJob.status)}>
            {cronJob.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadCronJob();
              loadExecutions();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setFormOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleRun}
          >
            <Play className="mr-2 h-4 w-4" />
            Run Now
          </Button>
          <Button
            onClick={handleToggle}
            variant={cronJob.isActive ? 'destructive' : 'default'}
          >
            {cronJob.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Cron Expression
              </label>
              <div className="mt-1">
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {cronJob.cronExpression}
                </code>
                <p className="text-sm text-muted-foreground mt-1">
                  {parseCronExpression(cronJob.cronExpression)}
                </p>
              </div>
            </div>
            {cronJob.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-1">{cronJob.description}</p>
              </div>
            )}
            {cronJob.project && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Associated Project
                </label>
                <p className="mt-1">{cronJob.project.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Total Executions
                </label>
                <p className="text-2xl font-bold">{cronJob.executionCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Failed Executions
                </label>
                <p className="text-2xl font-bold text-red-600">
                  {cronJob.failureCount}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Run
              </label>
              <p className="mt-1">
                {cronJob.lastRun
                  ? format(new Date(cronJob.lastRun), 'PPpp')
                  : 'Never'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Next Run
              </label>
              <p className="mt-1">
                {cronJob.nextRun && cronJob.isActive
                  ? format(new Date(cronJob.nextRun), 'PPpp')
                  : 'Not scheduled'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <CronExecutionHistory executions={executions} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(cronJob.metadata || {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CronForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cronJob={cronJob}
        projects={projects}
        onSubmit={handleUpdate}
      />
    </div>
  );
};