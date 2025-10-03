import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Prompt, CreatePromptDto, UpdatePromptDto } from '@/services/prompts.service';
import { useProjectContext } from '@/context/ProjectContext';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  content: z.string().min(1, 'Content is required'),
  scope: z.enum(['global', 'project']),
});

interface PromptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePromptDto | UpdatePromptDto) => Promise<void>;
  prompt?: Prompt | null;
  mode: 'create' | 'edit';
}

const PromptForm: React.FC<PromptFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prompt,
  mode
}) => {
  const { selectedProject } = useProjectContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      content: '',
      scope: 'global',
    },
  });

  useEffect(() => {
    if (prompt && mode === 'edit') {
      form.reset({
        name: prompt.name,
        content: prompt.content,
        scope: prompt.projectId ? 'project' : 'global',
      });
    } else if (!prompt && mode === 'create') {
      form.reset({
        name: '',
        content: '',
        scope: selectedProject ? 'project' : 'global',
      });
    }
  }, [prompt, mode, form, selectedProject]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const data: CreatePromptDto | UpdatePromptDto = {
      name: values.name,
      content: values.content,
    };

    if (mode === 'create') {
      if (values.scope === 'project' && selectedProject) {
        (data as CreatePromptDto).projectId = selectedProject.id;
      }
    } else if (mode === 'edit') {
      if (values.scope === 'project' && selectedProject) {
        data.projectId = selectedProject.id;
      } else if (values.scope === 'global') {
        data.projectId = null as any;
      }
    }

    await onSubmit(data);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Prompt' : 'Edit Prompt'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new prompt template for your automation workflows.'
              : 'Update the prompt details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter prompt name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique identifier for this prompt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && selectedProject && (
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="project">
                          Project ({selectedProject.name})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether this prompt is global or specific to the current project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter prompt content"
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The actual prompt template content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PromptForm;