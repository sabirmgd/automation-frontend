import React, { useState, useEffect } from 'react';
// @ts-ignore
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
  CronJobType,
  JiraSyncMode,
} from '@/types/cron.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import axios from 'axios';

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
  const [jiraBoards, setJiraBoards] = useState<any[]>([]);
  const [jiraAccounts, setJiraAccounts] = useState<any[]>([]);

  const form = useForm<CreateCronDto & { jobType: CronJobType }>({
    defaultValues: {
      name: '',
      description: '',
      cronExpression: '* * * * *',
      jobType: CronJobType.GENERIC,
      isActive: false,
      projectId: undefined,
      metadata: {},
    },
  });

  const jobType = form.watch('jobType');

  // Fetch Jira boards and accounts when job type is JIRA_SYNC
  useEffect(() => {
    if (jobType === CronJobType.JIRA_SYNC) {
      // Fetch Jira boards
      axios.get(`${import.meta.env.VITE_API_URL}/jira/boards`)
        .then(res => setJiraBoards(res.data))
        .catch(err => console.error('Failed to fetch boards:', err));

      // Fetch Jira accounts
      axios.get(`${import.meta.env.VITE_API_URL}/jira/accounts`)
        .then(res => setJiraAccounts(res.data))
        .catch(err => console.error('Failed to fetch accounts:', err));
    }
  }, [jobType]);

  useEffect(() => {
    if (cronJob) {
      form.reset({
        name: cronJob.name,
        description: cronJob.description || '',
        cronExpression: cronJob.cronExpression,
        jobType: cronJob.jobType || CronJobType.GENERIC,
        isActive: cronJob.isActive,
        projectId: cronJob.projectId || undefined,
        metadata: cronJob.metadata || {},
      });
    } else {
      form.reset({
        name: '',
        description: '',
        cronExpression: '* * * * *',
        jobType: CronJobType.GENERIC,
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

  const handleSubmit = async (data: CreateCronDto & { jobType: CronJobType }) => {
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
              render={({ field }: { field: any }) => (
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
              render={({ field }: { field: any }) => (
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

            <FormField
              control={form.control}
              name="jobType"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Job Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CronJobType.GENERIC}>Generic</SelectItem>
                      <SelectItem value={CronJobType.JIRA_SYNC}>Jira Sync</SelectItem>
                      <SelectItem value={CronJobType.DATABASE_BACKUP}>Database Backup</SelectItem>
                      <SelectItem value={CronJobType.GIT_SYNC}>Git Sync</SelectItem>
                      <SelectItem value={CronJobType.REPORT_GENERATION}>Report Generation</SelectItem>
                      <SelectItem value={CronJobType.DATA_CLEANUP}>Data Cleanup</SelectItem>
                      <SelectItem value={CronJobType.HEALTH_CHECK}>Health Check</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of task this cron job will perform
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jira Sync Configuration */}
            {jobType === CronJobType.JIRA_SYNC && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Jira Sync Configuration</h4>

                <FormField
                  control={form.control}
                  name="metadata.syncMode"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Sync Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sync mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={JiraSyncMode.SINGLE_BOARD}>Single Board</SelectItem>
                          <SelectItem value={JiraSyncMode.ALL_BOARDS}>All Boards</SelectItem>
                          <SelectItem value={JiraSyncMode.BY_ACCOUNT}>By Account</SelectItem>
                          <SelectItem value={JiraSyncMode.CUSTOM_JQL}>Custom JQL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('metadata.syncMode') === JiraSyncMode.SINGLE_BOARD && (
                  <FormField
                    control={form.control}
                    name="metadata.boardId"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Board</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a board" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jiraBoards.map((board) => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('metadata.syncMode') === JiraSyncMode.BY_ACCOUNT && (
                  <FormField
                    control={form.control}
                    name="metadata.accountId"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Account</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jiraAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.accountName} - {account.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('metadata.syncMode') === JiraSyncMode.CUSTOM_JQL && (
                  <>
                    <FormField
                      control={form.control}
                      name="metadata.jql"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>JQL Query</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='e.g., assignee = currentUser() AND status = "In Progress"'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a custom JQL query to filter tickets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metadata.accountId"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Account for JQL</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {jiraAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.accountName} - {account.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="space-y-2">
                  <Label>Sync Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="clearExisting"
                        checked={form.watch('metadata.options.clearExisting')}
                        onCheckedChange={(checked: boolean) =>
                          form.setValue('metadata.options.clearExisting', checked)
                        }
                      />
                      <Label htmlFor="clearExisting" className="text-sm font-normal">
                        Clear existing tickets before sync
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="syncComments"
                        checked={form.watch('metadata.options.syncComments')}
                        onCheckedChange={(checked: boolean) =>
                          form.setValue('metadata.options.syncComments', checked)
                        }
                      />
                      <Label htmlFor="syncComments" className="text-sm font-normal">
                        Sync ticket comments
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="syncAttachments"
                        checked={form.watch('metadata.options.syncAttachments')}
                        onCheckedChange={(checked: boolean) =>
                          form.setValue('metadata.options.syncAttachments', checked)
                        }
                      />
                      <Label htmlFor="syncAttachments" className="text-sm font-normal">
                        Sync ticket attachments
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
              render={({ field }: { field: any }) => (
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
                render={({ field }: { field: any }) => (
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
              render={({ field }: { field: any }) => (
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