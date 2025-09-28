import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type {
  CronJob,
  CreateCronDto,
  UpdateCronDto,
} from '@/types/cron.types';
import {
  CRON_PRESETS,
  parseCronExpression,
} from '@/types/cron.types';

interface CronFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cronJob?: CronJob | null;
  projects?: Array<{ id: string; name: string }>;
  onSubmit: (data: CreateCronDto | UpdateCronDto) => Promise<void>;
}

export const CronForm: React.FC<CronFormProps> = ({
  open,
  onOpenChange,
  cronJob,
  projects = [],
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  const form = useForm<CreateCronDto>({
    defaultValues: {
      name: '',
      description: '',
      cronExpression: '* * * * *',
      isActive: false,
      projectId: undefined,
      metadata: {},
    },
  });

  useEffect(() => {
    if (cronJob) {
      form.reset({
        name: cronJob.name,
        description: cronJob.description || '',
        cronExpression: cronJob.cronExpression,
        isActive: cronJob.isActive,
        projectId: cronJob.projectId || undefined,
        metadata: cronJob.metadata || {},
      });
    } else {
      form.reset({
        name: '',
        description: '',
        cronExpression: '* * * * *',
        isActive: false,
        projectId: undefined,
        metadata: {},
      });
    }
    setSelectedPreset('custom');
  }, [cronJob, form]);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value !== 'custom') {
      form.setValue('cronExpression', value);
    }
  };

  const handleSubmit = async (data: CreateCronDto) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save cron job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cronExpression = form.watch('cronExpression');
  const cronDescription = parseCronExpression(cronExpression);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {cronJob ? 'Edit Cron Job' : 'Create Cron Job'}
          </DialogTitle>
          <DialogDescription>
            {cronJob
              ? 'Update the cron job configuration'
              : 'Configure a new scheduled task'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Daily backup" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this cron job does..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Cron Expression</FormLabel>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset or use custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  {CRON_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="cronExpression"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="* * * * *"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setSelectedPreset('custom');
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Format: minute hour day month weekday
                    <br />
                    <span className="text-xs">
                      Current: {cronDescription}
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {projects.length > 0 && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Enable this cron job to run automatically
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : cronJob ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};