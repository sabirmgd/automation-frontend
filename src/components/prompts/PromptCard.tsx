import React from 'react';
import { MoreVertical, Edit, Trash2, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Prompt } from '@/services/prompts.service';
import { useToast } from '@/hooks/use-toast';

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onView: (prompt: Prompt) => void;
  isOverridden?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onEdit,
  onDelete,
  onView,
  isOverridden = false
}) => {
  const { toast } = useToast();

  const handleCopyContent = () => {
    navigator.clipboard.writeText(prompt.content);
    toast({
      title: 'Copied',
      description: 'Prompt content copied to clipboard',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${isOverridden ? 'opacity-60' : ''}`}
      onClick={() => onView(prompt)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {prompt.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={prompt.projectId ? 'default' : 'secondary'}>
                {prompt.projectId ? 'Project' : 'Global'}
              </Badge>
              {isOverridden && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Overridden
                </Badge>
              )}
              {prompt.project && (
                <Badge variant="outline">
                  {prompt.project.name}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleCopyContent();
              }}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(prompt);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(prompt.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="whitespace-pre-wrap font-mono text-xs">
          {truncateContent(prompt.content)}
        </CardDescription>
        <div className="mt-3 text-xs text-muted-foreground">
          Updated: {new Date(prompt.updatedAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptCard;