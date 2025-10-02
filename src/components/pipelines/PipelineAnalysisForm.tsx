import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { Platform, PipelineDataDto } from '../../types/pipeline.types';
import { Plus, X } from 'lucide-react';

interface PipelineAnalysisFormProps {
  platform: Platform;
  projectId?: string;
  onSubmit: (pipelineId: string, data: PipelineDataDto) => void;
  isLoading: boolean;
}

export function PipelineAnalysisForm({
  platform,
  projectId,
  onSubmit,
  isLoading,
}: PipelineAnalysisFormProps) {
  const [pipelineId, setPipelineId] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [config, setConfig] = useState('');
  const [failedJobs, setFailedJobs] = useState<Array<{
    jobName: string;
    stage: string;
    failureReason?: string;
  }>>([]);

  const handleAddFailedJob = () => {
    setFailedJobs([...failedJobs, { jobName: '', stage: '', failureReason: '' }]);
  };

  const handleRemoveFailedJob = (index: number) => {
    setFailedJobs(failedJobs.filter((_, i) => i !== index));
  };

  const handleUpdateFailedJob = (index: number, field: string, value: string) => {
    const updated = [...failedJobs];
    updated[index] = { ...updated[index], [field]: value };
    setFailedJobs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pipelineId || !projectId) return;

    const data: PipelineDataDto = {
      pipelineName,
      failedJobsCount: failedJobs.length,
      totalJobsCount: failedJobs.length + 5, // Example: assume some jobs passed
      errorMessage: errorMessage || undefined,
      config: config || undefined,
      failedJobs: failedJobs.filter(job => job.jobName && job.stage),
      status: 'failed',
      ref: 'main', // You might want to make this configurable
      triggeredBy: 'push', // You might want to make this configurable
    };

    onSubmit(pipelineId, data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyze Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gitlab">GitLab</SelectItem>
                  <SelectItem value="github">GitHub</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                value={projectId || ''}
                disabled
                placeholder="Select a project"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pipelineId">Pipeline ID *</Label>
              <Input
                id="pipelineId"
                value={pipelineId}
                onChange={(e) => setPipelineId(e.target.value)}
                placeholder="e.g., 123456"
                required
              />
            </div>

            <div>
              <Label htmlFor="pipelineName">Pipeline Name</Label>
              <Input
                id="pipelineName"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="e.g., CI/CD Pipeline"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="errorMessage">Error Message</Label>
            <Textarea
              id="errorMessage"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Main error message from the pipeline"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="config">Pipeline Configuration (YAML)</Label>
            <Textarea
              id="config"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder="Paste your .gitlab-ci.yml or workflow YAML here (optional)"
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Failed Jobs</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFailedJob}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </div>

            <div className="space-y-2">
              {failedJobs.map((job, index) => (
                <div key={index} className="grid grid-cols-[1fr,1fr,2fr,auto] gap-2">
                  <Input
                    placeholder="Job name"
                    value={job.jobName}
                    onChange={(e) => handleUpdateFailedJob(index, 'jobName', e.target.value)}
                  />
                  <Input
                    placeholder="Stage"
                    value={job.stage}
                    onChange={(e) => handleUpdateFailedJob(index, 'stage', e.target.value)}
                  />
                  <Input
                    placeholder="Failure reason (optional)"
                    value={job.failureReason || ''}
                    onChange={(e) => handleUpdateFailedJob(index, 'failureReason', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFailedJob(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {failedJobs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No failed jobs added. Click "Add Job" to specify failed jobs.
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!pipelineId || !projectId || isLoading}
            className="w-full"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Pipeline'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}