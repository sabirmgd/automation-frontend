import { MoreVertical, FolderOpen, HardDrive } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Project } from '../../types/project.types';
import ProjectStatus from './ProjectStatus';
import ProjectProgress from './ProjectProgress';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onView?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onView
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);
  const getProgress = () => {
    const metadata = project.metadata as any;
    return metadata?.progress || 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors border-b last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-gray-100 rounded-lg">
            <FolderOpen className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => onView?.(project)}
            >
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <ProjectStatus status={project.status} />
              <span className="text-sm text-gray-500">
                Updated {formatDate(project.updatedAt)}
              </span>
              {project.owner && (
                <span className="text-sm text-gray-500">
                  by {project.owner}
                </span>
              )}
            </div>
            {project.localPath && (
              <div className="flex items-center gap-2 mt-2">
                <HardDrive className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 font-mono">
                  {project.localPath}
                </span>
              </div>
            )}
            {project.tags && project.tags.length > 0 && (
              <div className="flex gap-2 mt-2">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <ProjectProgress progress={getProgress()} />
          </div>
        </div>
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
            >
              <button
                onClick={() => {
                  onView?.(project);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                View Details
              </button>
              <button
                onClick={() => {
                  onEdit?.(project);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Project
              </button>
              <button
                onClick={() => {
                  onDelete?.(project);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;