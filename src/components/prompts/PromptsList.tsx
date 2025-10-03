import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useProjectContext } from '@/context/ProjectContext';
import PromptCard from './PromptCard';
import PromptForm from './PromptForm';
import PromptDetails from './PromptDetails';
import promptsService from '@/services/prompts.service';
import type { Prompt, CreatePromptDto, UpdatePromptDto } from '@/services/prompts.service';

const PromptsList: React.FC = () => {
  const { selectedProject } = useProjectContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Queries
  const { data: allPrompts = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['prompts', 'all'],
    queryFn: () => promptsService.getPrompts(),
  });

  const { data: projectPrompts = [], isLoading: isLoadingProject } = useQuery({
    queryKey: ['prompts', 'project', selectedProject?.id],
    queryFn: () => selectedProject ? promptsService.getProjectPrompts(selectedProject.id) : Promise.resolve([]),
    enabled: !!selectedProject,
  });

  const { data: globalPrompts = [], isLoading: isLoadingGlobal } = useQuery({
    queryKey: ['prompts', 'global'],
    queryFn: () => promptsService.getGlobalPrompts(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreatePromptDto) => {
      if (data.projectId && selectedProject) {
        return promptsService.createProjectPrompt(selectedProject.id, data);
      }
      return promptsService.createPrompt(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Success',
        description: 'Prompt created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create prompt',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromptDto }) =>
      promptsService.updatePrompt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Success',
        description: 'Prompt updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update prompt',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promptsService.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Success',
        description: 'Prompt deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete prompt',
        variant: 'destructive',
      });
    },
  });

  // Filter prompts based on search term
  const filterPrompts = (prompts: Prompt[]) => {
    if (!searchTerm) return prompts;
    return prompts.filter(prompt =>
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get prompts for current tab with overrides logic
  const displayPrompts = useMemo(() => {
    let prompts: Prompt[] = [];

    if (!selectedProject) {
      prompts = globalPrompts;
    } else {
      switch (activeTab) {
        case 'project':
          prompts = projectPrompts;
          break;
        case 'global':
          prompts = globalPrompts;
          break;
        case 'all':
        default:
          // Combine project and global prompts, marking overridden ones
          const projectPromptNames = new Set(projectPrompts.map(p => p.name));
          const combinedPrompts = [
            ...projectPrompts.map(pp => ({
              ...pp,
              uniqueKey: `project-${pp.id}`
            })),
            ...globalPrompts
              .filter(gp => !projectPromptNames.has(gp.name)) // Exclude global prompts that are overridden
              .map(gp => ({
                ...gp,
                uniqueKey: `global-${gp.id}`,
                isOverridden: false
              }))
          ];
          prompts = combinedPrompts;
          break;
      }
    }

    return filterPrompts(prompts);
  }, [activeTab, projectPrompts, globalPrompts, selectedProject, searchTerm]);

  const handleCreatePrompt = () => {
    setFormMode('create');
    setEditingPrompt(null);
    setIsFormOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setFormMode('edit');
    setEditingPrompt(prompt);
    setIsFormOpen(true);
  };

  const handleViewPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsDetailsOpen(true);
  };

  const handleFormSubmit = async (data: CreatePromptDto | UpdatePromptDto) => {
    if (formMode === 'create') {
      await createMutation.mutateAsync(data as CreatePromptDto);
    } else if (editingPrompt) {
      await updateMutation.mutateAsync({ id: editingPrompt.id, data });
    }
  };

  const handleDeletePrompt = (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      deleteMutation.mutate(id);
    }
  };

  const isLoading = isLoadingAll || isLoadingProject || isLoadingGlobal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prompts</h2>
          <p className="text-muted-foreground">
            Manage your automation prompt templates
            {selectedProject && ` for ${selectedProject.name}`}
          </p>
        </div>
        <Button onClick={handleCreatePrompt}>
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          {selectedProject && (
            <>
              <TabsTrigger value="all">All Prompts</TabsTrigger>
              <TabsTrigger value="project">Project Prompts</TabsTrigger>
            </>
          )}
          <TabsTrigger value="global">Global Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : displayPrompts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No prompts found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by creating a new prompt'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreatePrompt} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Prompt
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayPrompts.map((prompt: any) => (
                <PromptCard
                  key={prompt.uniqueKey || prompt.id}
                  prompt={prompt}
                  onEdit={handleEditPrompt}
                  onDelete={handleDeletePrompt}
                  onView={handleViewPrompt}
                  isOverridden={prompt.isOverridden}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PromptForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        prompt={editingPrompt}
        mode={formMode}
      />

      <PromptDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        prompt={selectedPrompt}
        onEdit={handleEditPrompt}
      />
    </div>
  );
};

export default PromptsList;