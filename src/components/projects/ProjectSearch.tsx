import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProjectSearchProps {
  value?: string;
  onSearch: (search: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const ProjectSearch: React.FC<ProjectSearchProps> = ({
  value = '',
  onSearch,
  placeholder = 'Search projects...',
  debounceMs = 300
}) => {
  const [searchTerm, setSearchTerm] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== value) {
        onSearch(searchTerm);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default ProjectSearch;