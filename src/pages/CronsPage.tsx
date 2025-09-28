import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { CronList } from '@/components/crons/CronList';
import { CronForm } from '@/components/crons/CronForm';
import { cronService } from '@/services/cron.service';
import projectsService from '@/services/projects.service';
import type { CronJob, CreateCronDto, UpdateCronDto } from '@/types/cron.types';
import { useToast } from '@/hooks/use-toast';

export const CronsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCron, setEditingCron] = useState<CronJob | null>(null);

  useEffect(() => {
    loadCronJobs();
    loadProjects();
  }, []);

  const loadCronJobs = async () => {
    try {
      setLoading(true);
      const data = await cronService.getCronJobs();
      setCronJobs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load cron jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const handleCreate = () => {
    setEditingCron(null);
    setFormOpen(true);
  };

  const handleEdit = (cronJob: CronJob) => {
    setEditingCron(cronJob);
    setFormOpen(true);
  };

  const handleSubmit = async (data: CreateCronDto | UpdateCronDto) => {
    try {
      if (editingCron) {
        await cronService.updateCronJob(editingCron.id, data);
        toast({
          title: 'Success',
          description: 'Cron job updated successfully',
        });
      } else {
        await cronService.createCronJob(data as CreateCronDto);
        toast({
          title: 'Success',
          description: 'Cron job created successfully',
        });
      }
      loadCronJobs();
    } catch (error) {
      toast({
        title: 'Error',
        description: editingCron
          ? 'Failed to update cron job'
          : 'Failed to create cron job',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cron job?')) {
      return;
    }

    try {
      await cronService.deleteCronJob(id);
      toast({
        title: 'Success',
        description: 'Cron job deleted successfully',
      });
      loadCronJobs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete cron job',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await cronService.toggleCronJob(id);
      toast({
        title: 'Success',
        description: 'Cron job toggled successfully',
      });
      loadCronJobs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle cron job',
        variant: 'destructive',
      });
    }
  };

  const handleRun = async (id: string) => {
    try {
      const result = await cronService.runCronJob(id);
      toast({
        title: 'Success',
        description: result.message,
      });
      setTimeout(loadCronJobs, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run cron job',
        variant: 'destructive',
      });
    }
  };

  const handleView = (id: string) => {
    navigate(`/crons/${id}`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cron Jobs</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadCronJobs}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Cron Job
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : cronJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No cron jobs found. Create your first cron job to get started.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Cron Job
          </Button>
        </div>
      ) : (
        <CronList
          cronJobs={cronJobs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onRun={handleRun}
          onView={handleView}
        />
      )}

      <CronForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cronJob={editingCron}
        projects={projects}
        onSubmit={handleSubmit}
      />
    </div>
  );
};