import React from 'react';
import { Copy, Calendar, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Prompt } from '@/services/prompts.service';
import { useToast } from '@/hooks/use-toast';

interface PromptDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onEdit?: (prompt: Prompt) => void;
}

const PromptDetails: React.FC<PromptDetailsProps> = ({
  isOpen,
  onClose,
  prompt,
  onEdit
}) => {
  const { toast } = useToast();

  if (!prompt) return null;

  const handleCopyContent = () => {
    navigator.clipboard.writeText(prompt.content);
    toast({
      title: 'Copied',
      description: 'Prompt content copied to clipboard',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-semibold">{prompt.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant={prompt.projectId ? 'default' : 'secondary'}>
                {prompt.projectId ? 'Project' : 'Global'}
              </Badge>
              {prompt.project && (
                <Badge variant="outline">
                  {prompt.project.name}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">Created: {formatDate(prompt.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">Updated: {formatDate(prompt.updatedAt)}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Prompt Content</h4>
            <ScrollArea className="h-[350px] w-full rounded-md border p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {prompt.content}
              </pre>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Content
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(prompt);
                  onClose();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptDetails;