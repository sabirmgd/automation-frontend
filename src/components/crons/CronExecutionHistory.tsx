import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CronJobExecution } from '@/types/cron.types';
import { ExecutionStatus } from '@/types/cron.types';
import { format } from 'date-fns';

interface CronExecutionHistoryProps {
  executions: CronJobExecution[];
}

const getStatusBadgeVariant = (status: ExecutionStatus): "default" | "destructive" | "outline" | "secondary" => {
  switch (status) {
    case ExecutionStatus.SUCCESS:
      return 'default';
    case ExecutionStatus.FAILURE:
      return 'destructive';
    case ExecutionStatus.RUNNING:
      return 'secondary';
    default:
      return 'secondary';
  }
};

const formatDuration = (duration?: number) => {
  if (!duration) return '-';
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${(duration / 60000).toFixed(1)}m`;
};

export const CronExecutionHistory: React.FC<CronExecutionHistoryProps> = ({
  executions,
}) => {
  if (executions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No execution history available
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Started At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Output/Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((execution) => (
            <TableRow key={execution.id}>
              <TableCell>
                {format(
                  new Date(execution.startedAt),
                  'MMM dd, yyyy HH:mm:ss'
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(execution.status)}>
                  {execution.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDuration(execution.duration)}</TableCell>
              <TableCell className="max-w-md">
                {execution.output && (
                  <div className="text-sm text-green-600 truncate">
                    {execution.output}
                  </div>
                )}
                {execution.error && (
                  <div className="text-sm text-red-600 truncate">
                    {execution.error}
                  </div>
                )}
                {!execution.output && !execution.error && (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};