import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Grid3x3, List } from "lucide-react";
import {
  TaskStatus,
  TaskPriority,
  type Task,
  type TaskFilterDto,
} from "@/types";
import tasksService from "@/services/tasks.service";
import TaskCard from "./TaskCard";
import TaskBoard from "./TaskBoard";
import TaskForm from "./TaskForm";
import TaskDetails from "./TaskDetails";
import { useToast } from "@/hooks/use-toast";
import { useProjectContext } from "@/context/ProjectContext";

interface TaskListProps {
  projectId?: string;
}

const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
  const { selectedProject } = useProjectContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [filters, setFilters] = useState<TaskFilterDto>({
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject.id);
    }
  }, [filters, selectedProject]);

  const loadTasks = async (projectId: string) => {
    try {
      setLoading(true);
      const data = await tasksService.findByProject(projectId, filters);
      setTasks(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleStatusFilter = (status: string) => {
    if (status === "all") {
      setFilters((prev) => ({
        ...prev,
        status: undefined,
        statuses: undefined,
      }));
    } else {
      setFilters((prev) => ({ ...prev, status: status as TaskStatus }));
    }
  };

  const handlePriorityFilter = (priority: string) => {
    if (priority === "all") {
      setFilters((prev) => ({ ...prev, priority: undefined }));
    } else {
      setFilters((prev) => ({ ...prev, priority: priority as TaskPriority }));
    }
  };

  const handleCreateTask = async (data: any) => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }
    try {
      const newTask = await tasksService.create(selectedProject.id, data);
      setTasks((prev) => [newTask, ...prev]);
      setShowTaskForm(false);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!selectedTask || !selectedProject) return;
    try {
      const updatedTask = await tasksService.update(
        selectedProject.id,
        selectedTask.id,
        data
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      setShowTaskForm(false);
      setSelectedTask(null);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProject) return;
    try {
      await tasksService.delete(selectedProject.id, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    if (!selectedProject) return;
    try {
      const updatedTask = await tasksService.updateStatus(
        selectedProject.id,
        taskId,
        status
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      toast({
        title: "Success",
        description: "Task status updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleEditFromDetails = () => {
    setShowTaskDetails(false);
    setShowTaskForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Button onClick={() => setShowTaskForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select onValueChange={handleStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
            <SelectItem value={TaskStatus.BLOCKED}>Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={handlePriorityFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
            <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
            <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
            <SelectItem value={TaskPriority.CRITICAL}>Critical</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "board" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("board")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : viewMode === "board" ? (
        <TaskBoard
          tasks={tasks}
          onEdit={(task) => {
            setSelectedTask(task);
            setShowTaskForm(true);
          }}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onViewDetails={handleViewDetails}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(task) => {
                setSelectedTask(task);
                setShowTaskForm(true);
              }}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {showTaskForm && (
        <TaskForm
          task={selectedTask}
          projectId={projectId}
          onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
          onClose={() => {
            setShowTaskForm(false);
            setSelectedTask(null);
          }}
        />
      )}

      {showTaskDetails && selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          onEdit={handleEditFromDetails}
          onDelete={() => {
            handleDeleteTask(selectedTask.id);
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          onRefresh={() => selectedProject && loadTasks(selectedProject.id)}
        />
      )}
    </div>
  );
};

export default TaskList;
