import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Trash2,
  Edit,
  Eye,
  PlayCircle,
} from 'lucide-react';
import type { CronJob } from '@/types/cron.types';
import { CronJobStatus } from '@/types/cron.types';
import { formatDistanceToNow } from 'date-fns';

interface CronListProps {
  cronJobs: CronJob[];
  onEdit: (cronJob: CronJob) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onRun: (id: string) => void;
  onView: (id: string) => void;
}

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

export const CronList: React.FC<CronListProps> = ({
  cronJobs,
  onEdit,
  onDelete,
  onToggle,
  onRun,
  onView,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Expression</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Success/Failure</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cronJobs.map((cronJob) => (
            <TableRow key={cronJob.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{cronJob.name}</div>
                  {cronJob.description && (
                    <div className="text-sm text-muted-foreground">
                      {cronJob.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {cronJob.jobType?.replace('_', ' ').toUpperCase() || 'GENERIC'}
                </Badge>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {cronJob.cronExpression}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(cronJob.status)}>
                  {cronJob.status}
                </Badge>
              </TableCell>
              <TableCell>
                {cronJob.lastRun
                  ? formatDistanceToNow(new Date(cronJob.lastRun), {
                      addSuffix: true,
                    })
                  : 'Never'}
              </TableCell>
              <TableCell>
                {cronJob.nextRun
                  ? formatDistanceToNow(new Date(cronJob.nextRun), {
                      addSuffix: true,
                    })
                  : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">
                    {cronJob.executionCount - cronJob.failureCount}
                  </span>
                  /
                  <span className="text-red-600">{cronJob.failureCount}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(cronJob.id)}
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggle(cronJob.id)}
                    title={cronJob.isActive ? 'Pause' : 'Resume'}
                  >
                    {cronJob.isActive ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRun(cronJob.id)}
                    title="Run now"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(cronJob)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(cronJob.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};