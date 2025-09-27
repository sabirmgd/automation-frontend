import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Folder, Check } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

interface ProjectSelectorProps {
  className?: string;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ className = '' }) => {
  const { selectedProject, setSelectedProject, projects, setProjects, loading, setLoading } = useProjectContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3333/projects');
      if (response.ok) {
        const data = await response.json();
        // The API returns paginated data with { data: [], total: number, page: number, lastPage: number }
        const projectList = data.data || [];
        setProjects(projectList);
        console.log('Loaded projects:', projectList);
      } else {
        console.error('Failed to fetch projects:', response.status, response.statusText);
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.key && project.key.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleProjectSelect = (project: typeof projects[0]) => {
    setSelectedProject(project);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedProject(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-64 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <div className="flex items-center">
          <Folder className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium">
            {selectedProject ? selectedProject.name : 'Select a project'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {selectedProject && (
              <button
                onClick={handleClearSelection}
                className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
              >
                Clear selection
              </button>
            )}

            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading projects...
              </div>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">{project.name}</span>
                        {project.key && (
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            {project.key}
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {project.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        {project.gitlabId && (
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                            GitLab
                          </span>
                        )}
                        {project.jiraKey && (
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                            Jira
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedProject?.id === project.id && (
                      <Check className="w-4 h-4 text-blue-500 mt-1" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No projects found
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectSelector;