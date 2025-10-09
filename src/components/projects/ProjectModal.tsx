import { X } from 'lucide-react';
// @ts-ignore
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../../types/project.types';
import { useEffect, useState } from 'react';
import PathSelector from '../common/PathSelector';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().min(1, 'Owner is required'),
  localPath: z.string().optional(),
  tags: z.string().optional(),
  key: z.string().optional(),
  gitlabId: z.string().optional(),
  jiraKey: z.string().optional(),
  gitlabUrl: z.string().optional(),
  jiraUrl: z.string().optional(),
  agentNavigationInfo: z.string().optional(),
});

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectDto | UpdateProjectDto) => Promise<void>;
  project?: Project | null;
  title?: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project,
  title
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'configuration'>('general');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      owner: '',
      localPath: '',
      tags: '',
      key: '',
      gitlabId: '',
      jiraKey: '',
      gitlabUrl: '',
      jiraUrl: '',
      agentNavigationInfo: ''
    }
  });

  const localPath = watch('localPath');

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        status: project.status,
        owner: project.owner,
        localPath: project.localPath || '',
        tags: project.tags?.join(', ') || '',
        key: project.key || '',
        gitlabId: project.gitlabId || '',
        jiraKey: project.jiraKey || '',
        gitlabUrl: project.gitlabUrl || '',
        jiraUrl: project.jiraUrl || '',
        agentNavigationInfo: project.agentNavigationInfo || ''
      });
    } else {
      reset({
        name: '',
        description: '',
        status: 'planning',
        owner: '',
        localPath: '',
        tags: '',
        key: '',
        gitlabId: '',
        jiraKey: '',
        gitlabUrl: '',
        jiraUrl: '',
        agentNavigationInfo: ''
      });
    }
  }, [project, reset]);

  const handleFormSubmit = async (data: any) => {
    const formData = {
      ...data,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
    };

    // Remove empty string fields to avoid database constraint issues
    Object.keys(formData).forEach(key => {
      if (formData[key] === '' || formData[key] === null) {
        delete formData[key];
      }
    });

    await onSubmit(formData);
    reset({
      name: '',
      description: '',
      status: 'planning',
      owner: '',
      localPath: '',
      tags: '',
      key: '',
      gitlabId: '',
      jiraKey: '',
      gitlabUrl: '',
      jiraUrl: '',
      agentNavigationInfo: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {title || (project ? 'Edit Project' : 'Create New Project')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="border-b">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'general'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('configuration')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'configuration'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Configuration
              </button>
            </div>
          </div>

          <div className="p-6">
          {activeTab === 'general' && (
            <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project description"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="in_review">In Review</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner
            </label>
            <input
              {...register('owner')}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter owner name"
            />
            {errors.owner && (
              <p className="mt-1 text-sm text-red-600">{errors.owner.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              {...register('tags')}
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., frontend, backend, urgent"
            />
          </div>
            </>
          )}

          {activeTab === 'configuration' && (
            <>
          <div className="mb-4">
            <PathSelector
              label="Local Project Path"
              value={localPath || ''}
              onChange={(value) => setValue('localPath', value as string)}
              placeholder="Enter project path"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent Navigation Information
            </label>
            <textarea
              {...register('agentNavigationInfo')}
              rows={8}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add navigation hints, context, or instructions for AI agents working with this project..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Provide context about project structure, key files, conventions, and navigation patterns
            </p>
          </div>
            </>
          )}
          </div>

          <div className="px-6 pb-6">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (project ? 'Update' : 'Create')}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;