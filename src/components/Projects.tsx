import { useState } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import type { Project, ProjectFilters as ProjectFiltersType } from '../types/project.types';
import ProjectCard from './projects/ProjectCard';
import ProjectSearch from './projects/ProjectSearch';
import ProjectFilters from './projects/ProjectFilters';
import ProjectModal from './projects/ProjectModal';

const Projects = () => {
  const [filters, setFilters] = useState<ProjectFiltersType>({
    page: 1,
    limit: 10,
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);

  const { data, isLoading, error } = useProjects(filters);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const handleSearch = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search: search || undefined,
      page: 1,
    }));
  };

  const handleStatusChange = (status: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      status,
      page: 1,
    }));
  };

  const handleOwnerChange = (owner: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      owner,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: any) => {
    if (selectedProject) {
      await updateMutation.mutateAsync({ id: selectedProject.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (project: Project) => {
    if (deleteConfirm?.id === project.id) {
      await deleteMutation.mutateAsync(project.id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(project);
      setTimeout(() => setDeleteConfirm(null), 5000);
    }
  };

  const handleView = (project: Project) => {
    console.log('View project:', project);
  };

  const uniqueOwners = Array.from(
    new Set(data?.data.map(p => p.owner).filter(Boolean) || [])
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-2">Manage and track your automation projects</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <ProjectSearch
              value={filters.search}
              onSearch={handleSearch}
              placeholder="Search projects..."
            />
            <ProjectFilters
              selectedStatus={filters.status}
              onStatusChange={handleStatusChange}
              selectedOwner={filters.owner}
              onOwnerChange={handleOwnerChange}
              owners={uniqueOwners}
            />
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-gray-600">Failed to load projects</p>
              <p className="text-sm text-red-500 mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="divide-y">
              {data.data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No projects found</p>
                  <button
                    onClick={handleCreate}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first project
                  </button>
                </div>
              ) : (
                data.data.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))
              )}
            </div>

            {data.lastPage > 1 && (
              <div className="p-6 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((filters.page! - 1) * filters.limit!) + 1} to{' '}
                    {Math.min(filters.page! * filters.limit!, data.total)} of {data.total} projects
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, data.lastPage) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded-lg ${
                            page === filters.page
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === data.lastPage}
                      className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-red-800 mb-2">
            Are you sure you want to delete "{deleteConfirm.name}"?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        project={selectedProject}
      />
    </div>
  );
};

export default Projects;