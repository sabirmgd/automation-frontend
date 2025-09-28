import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskStatus, type Task } from "@/types";
import DraggableTaskCard from "./DraggableTaskCard";

interface DroppableColumnProps {
  status: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onViewDetails: (task: Task) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  status,
  title,
  color,
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded-lg p-4 min-h-[500px] border-t-4 ${color} ${
        isOver ? "bg-gray-100 ring-2 ring-blue-400" : ""
      } transition-all duration-200`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wider">
          {title}
        </h3>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </SortableContext>

      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          {isOver ? "Drop here" : "No tasks"}
        </div>
      )}
    </div>
  );
};

export default DroppableColumn;