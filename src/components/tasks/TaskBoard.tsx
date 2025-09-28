import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TaskStatus, type Task } from "@/types";
import TaskCard from "./TaskCard";
import DroppableColumn from "./DroppableColumn";

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
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: TaskStatus.TODO, title: "To Do", color: "border-gray-300" },
    {
      status: TaskStatus.IN_PROGRESS,
      title: "In Progress",
      color: "border-blue-300",
    },
    {
      status: TaskStatus.IN_REVIEW,
      title: "In Review",
      color: "border-yellow-300",
    },
    { status: TaskStatus.DONE, title: "Done", color: "border-green-300" },
    { status: TaskStatus.BLOCKED, title: "Blocked", color: "border-red-300" },
  ];

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if we're dragging over a column
    const overColumn = columns.find((col) => col.status === overId);
    if (overColumn) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== overColumn.status) {
        // Update task status immediately for smooth UX
        onStatusChange(taskId, overColumn.status);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const overColumn = columns.find((col) => col.status === overId);
    if (overColumn) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== overColumn.status) {
        onStatusChange(taskId, overColumn.status);
      }
    } else {
      // Dropped on another task - find which column it belongs to
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        const task = tasks.find((t) => t.id === taskId);
        if (task && task.status !== overTask.status) {
          onStatusChange(taskId, overTask.status);
        }
      }
    }

    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          return (
            <DroppableColumn
              key={column.status}
              status={column.status}
              title={column.title}
              color={column.color}
              tasks={columnTasks}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onViewDetails={onViewDetails}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80 rotate-3 shadow-2xl">
            <TaskCard
              task={activeTask}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onViewDetails={onViewDetails}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskBoard;