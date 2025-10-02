import React from 'react';
import { Filter, X, GitBranch } from 'lucide-react';
import type { GitRepository } from '../../types/git.types';

interface PullRequestFilterProps {
  repositories: GitRepository[];
  selectedRepository?: string;
  onRepositoryChange: (repositoryId: string | undefined) => void;
  onClearFilters: () => void;
}

const PullRequestFilter: React.FC<PullRequestFilterProps> = ({
  repositories,
  selectedRepository,
  onRepositoryChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>

          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-500" />
            <select
              value={selectedRepository || ''}
              onChange={(e) => onRepositoryChange(e.target.value || undefined)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Repositories</option>
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name}
                </option>
              ))}
            </select>
          </div>

          {selectedRepository && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {selectedRepository && (
            <span>
              Showing PRs from{' '}
              <span className="font-medium text-gray-700">
                {repositories.find((r) => r.id === selectedRepository)?.name}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PullRequestFilter;