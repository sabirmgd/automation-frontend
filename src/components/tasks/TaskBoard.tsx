import React from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types/task.types';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onViewDetails: (task: Task) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
}) => {
  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: TaskStatus.TODO, title: 'To Do', color: 'border-gray-300' },
    { status: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'border-blue-300' },
    { status: TaskStatus.IN_REVIEW, title: 'In Review', color: 'border-yellow-300' },
    { status: TaskStatus.DONE, title: 'Done', color: 'border-green-300' },
    { status: TaskStatus.BLOCKED, title: 'Blocked', color: 'border-red-300' },
  ];

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const newStatus = over.id as TaskStatus;
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map(column => {
          const columnTasks = getTasksByStatus(column.status);
          return (
            <div
              key={column.status}
              className={`bg-gray-50 rounded-lg p-4 min-h-[500px] border-t-4 ${column.color}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider">
                  {column.title}
                </h3>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              <SortableContext
                items={columnTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {columnTasks.map(task => (
                    <div key={task.id} className="cursor-move">
                      <TaskCard
                        task={task}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                        onViewDetails={onViewDetails}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>

              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DndContext>
  );
};

export default TaskBoard;