import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Clock, Calendar, User, Link, GitBranch } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@/types/task.types';
import tasksService from '@/services/tasks.service';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onViewDetails: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
}) => {
  const getStatusBadge = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'bg-gray-500',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-500',
      [TaskStatus.IN_REVIEW]: 'bg-yellow-500',
      [TaskStatus.DONE]: 'bg-green-500',
      [TaskStatus.BLOCKED]: 'bg-red-500',
      [TaskStatus.CANCELLED]: 'bg-gray-400',
    };

    return (
      <Badge className={`${colors[status]} text-white`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      [TaskPriority.LOW]: 'bg-gray-200 text-gray-700',
      [TaskPriority.MEDIUM]: 'bg-yellow-200 text-yellow-800',
      [TaskPriority.HIGH]: 'bg-orange-200 text-orange-800',
      [TaskPriority.CRITICAL]: 'bg-red-200 text-red-800',
    };

    return (
      <Badge variant="outline" className={colors[priority]}>
        {priority}
      </Badge>
    );
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(task)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium line-clamp-2">
            {task.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 mt-2">
          {getStatusBadge(task.status)}
          {getPriorityBadge(task.priority)}
        </div>
      </CardHeader>
      <CardContent>
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-col gap-2 text-sm">
          {task.assignee && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
          )}

          {task.dueDate && (
            <div className={`flex items-center gap-2 ${getDueDateColor(task.dueDate)}`}>
              <Calendar className="h-3 w-3" />
              <span>Due {formatDate(task.dueDate)}</span>
            </div>
          )}

          {(task.estimatedHours > 0 || task.actualHours > 0) && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-3 w-3" />
              <span>
                {task.actualHours || 0}/{task.estimatedHours || 0}h
              </span>
            </div>
          )}

          {task.links && task.links.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {task.links.some(link => link.linkType === 'jira_ticket') && (
                <Badge variant="outline" className="text-xs">
                  <Link className="h-3 w-3 mr-1" />
                  Jira
                </Badge>
              )}
              {task.links.some(link => link.linkType === 'pull_request' || link.linkType === 'merge_request') && (
                <Badge variant="outline" className="text-xs">
                  <GitBranch className="h-3 w-3 mr-1" />
                  PR
                </Badge>
              )}
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;