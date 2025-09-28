export enum CronJobStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RUNNING = 'running',
  ERROR = 'error',
}

export enum ExecutionStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running',
}

export interface CronJob {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  status: CronJobStatus;
  isActive: boolean;
  lastRun?: Date | string;
  nextRun?: Date | string;
  executionCount: number;
  failureCount: number;
  metadata?: Record<string, any>;
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  executions?: CronJobExecution[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CronJobExecution {
  id: string;
  cronJobId: string;
  cronJob?: CronJob;
  status: ExecutionStatus;
  startedAt: Date | string;
  completedAt?: Date | string;
  duration?: number;
  output?: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
}

export interface CreateCronDto {
  name: string;
  description?: string;
  cronExpression: string;
  isActive?: boolean;
  projectId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCronDto {
  name?: string;
  description?: string;
  cronExpression?: string;
  isActive?: boolean;
  projectId?: string;
  metadata?: Record<string, any>;
}

export const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at noon', value: '0 12 * * *' },
  { label: 'Weekly on Monday', value: '0 0 * * 1' },
  { label: 'Monthly on 1st', value: '0 0 1 * *' },
];

export function parseCronExpression(expression: string): string {
  const parts = expression.split(' ');
  if (parts.length < 5) return 'Invalid expression';

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const descriptions: string[] = [];

  if (minute === '*') descriptions.push('every minute');
  else if (minute.startsWith('*/')) descriptions.push(`every ${minute.slice(2)} minutes`);
  else descriptions.push(`at minute ${minute}`);

  if (hour !== '*') {
    if (hour.startsWith('*/')) descriptions.push(`every ${hour.slice(2)} hours`);
    else descriptions.push(`at hour ${hour}`);
  }

  if (dayOfMonth !== '*') descriptions.push(`on day ${dayOfMonth}`);
  if (month !== '*') descriptions.push(`in month ${month}`);
  if (dayOfWeek !== '*') descriptions.push(`on weekday ${dayOfWeek}`);

  return descriptions.join(', ');
}