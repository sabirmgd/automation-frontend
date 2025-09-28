import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Edit,
  Trash2,
  Link,
  ExternalLink,
  GitBranch,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import {
  TaskLinkType,
  type Task,
  type TaskLink,
  type LinkTaskDto,
} from "@/types";
import tasksService from "@/services/tasks.service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  task,
  onClose,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkFormData, setLinkFormData] = useState<Partial<LinkTaskDto>>({
    linkType: TaskLinkType.JIRA_TICKET,
    externalId: "",
    externalUrl: "",
    title: "",
    platform: "jira",
  });
  const [links, setLinks] = useState<TaskLink[]>(task.links || []);
  const { toast } = useToast();

  const handleAddLink = async () => {
    if (!linkFormData.externalId) {
      toast({
        title: "Error",
        description: "External ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const newLink = await tasksService.addLink(
        task.id,
        linkFormData as LinkTaskDto
      );
      setLinks([...links, newLink]);
      setShowLinkForm(false);
      setLinkFormData({
        linkType: TaskLinkType.JIRA_TICKET,
        externalId: "",
        externalUrl: "",
        title: "",
        platform: "jira",
      });
      toast({
        title: "Success",
        description: "Link added successfully",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add link",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLink = async (link: TaskLink) => {
    try {
      await tasksService.removeLink(task.id, {
        linkType: link.linkType,
        externalId: link.externalId,
      });
      setLinks(links.filter((l) => l.id !== link.id));
      toast({
        title: "Success",
        description: "Link removed successfully",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove link",
        variant: "destructive",
      });
    }
  };

  const getLinkIcon = (linkType: TaskLinkType) => {
    switch (linkType) {
      case TaskLinkType.JIRA_TICKET:
        return <AlertCircle className="h-4 w-4" />;
      case TaskLinkType.PULL_REQUEST:
      case TaskLinkType.MERGE_REQUEST:
        return <GitBranch className="h-4 w-4" />;
      default:
        return <Link className="h-4 w-4" />;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Not set";
    return format(new Date(date), "PPP");
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task.title}</DialogTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant={task.status === "done" ? "default" : "secondary"}>
              {task.status.replace("_", " ")}
            </Badge>
            <Badge variant="outline">{task.priority}</Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {task.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Assignee:</span>
                  <span className="text-sm font-medium">
                    {task.assignee || "Unassigned"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Reporter:</span>
                  <span className="text-sm font-medium">
                    {task.reporter || "Unknown"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Start Date:</span>
                  <span className="text-sm font-medium">
                    {formatDate(task.startDate)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Due Date:</span>
                  <span className="text-sm font-medium">
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Estimated:</span>
                  <span className="text-sm font-medium">
                    {task.estimatedHours || 0} hours
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Actual:</span>
                  <span className="text-sm font-medium">
                    {task.actualHours || 0} hours
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="text-sm font-medium">
                    {formatDate(task.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Updated:</span>
                  <span className="text-sm font-medium">
                    {formatDate(task.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {task.tags && task.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {task.labels && task.labels.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label, index) => (
                    <Badge key={index} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowLinkForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </div>

            {showLinkForm && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Add External Link</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Link Type</Label>
                    <Select
                      value={linkFormData.linkType}
                      onValueChange={(value) =>
                        setLinkFormData({
                          ...linkFormData,
                          linkType: value as TaskLinkType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaskLinkType.JIRA_TICKET}>
                          Jira Ticket
                        </SelectItem>
                        <SelectItem value={TaskLinkType.PULL_REQUEST}>
                          Pull Request
                        </SelectItem>
                        <SelectItem value={TaskLinkType.MERGE_REQUEST}>
                          Merge Request
                        </SelectItem>
                        <SelectItem value={TaskLinkType.ISSUE}>
                          Issue
                        </SelectItem>
                        <SelectItem value={TaskLinkType.DOCUMENT}>
                          Document
                        </SelectItem>
                        <SelectItem value={TaskLinkType.OTHER}>
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>External ID *</Label>
                    <Input
                      placeholder="e.g., JIRA-123, PR#456"
                      value={linkFormData.externalId}
                      onChange={(e) =>
                        setLinkFormData({
                          ...linkFormData,
                          externalId: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="Link title"
                      value={linkFormData.title}
                      onChange={(e) =>
                        setLinkFormData({
                          ...linkFormData,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      placeholder="https://..."
                      value={linkFormData.externalUrl}
                      onChange={(e) =>
                        setLinkFormData({
                          ...linkFormData,
                          externalUrl: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Input
                      placeholder="jira, github, gitlab, etc."
                      value={linkFormData.platform}
                      onChange={(e) =>
                        setLinkFormData({
                          ...linkFormData,
                          platform: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddLink}>
                    Add Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowLinkForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getLinkIcon(link.linkType)}
                    <div>
                      <div className="font-medium">
                        {link.title || link.externalId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {link.platform} • {link.linkType.replace("_", " ")}
                        {link.status && ` • ${link.status}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.externalUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(link.externalUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveLink(link)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {links.length === 0 && !showLinkForm && (
              <div className="text-center py-8 text-gray-400">
                No external links added yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="text-center py-8 text-gray-400">
              Activity timeline coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetails;
