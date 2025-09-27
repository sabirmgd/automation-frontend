import { Filter, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ProjectFiltersProps {
  selectedStatus?: string;
  onStatusChange: (status: string | undefined) => void;
  selectedOwner?: string;
  onOwnerChange: (owner: string | undefined) => void;
  owners?: string[];
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  selectedStatus,
  onStatusChange,
  selectedOwner,
  onOwnerChange,
  owners = []
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'in_review', label: 'In Review' },
    { value: 'planning', label: 'Planning' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {(selectedStatus || selectedOwner) && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
            {[selectedStatus, selectedOwner].filter(Boolean).length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {showFilters && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-10">
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus || ''}
                onChange={(e) => onStatusChange(e.target.value || undefined)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {owners.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner
                </label>
                <select
                  value={selectedOwner || ''}
                  onChange={(e) => onOwnerChange(e.target.value || undefined)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Owners</option>
                  {owners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => {
                  onStatusChange(undefined);
                  onOwnerChange(undefined);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;