import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface PathSelectorProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
}

const PathSelector: React.FC<PathSelectorProps> = ({
  value,
  onChange,
  multiple = false,
  placeholder = 'Enter path...',
  label,
  className = ''
}) => {
  const [paths, setPaths] = useState<string[]>(() => {
    if (multiple) {
      return Array.isArray(value) ? value : (value ? [value] : []);
    }
    return value ? [value as string] : [''];
  });

  const [recentPaths, setRecentPaths] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentPaths');
    if (stored) {
      setRecentPaths(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  useEffect(() => {
    if (multiple) {
      onChange(paths.filter(p => p.trim()));
    } else {
      onChange(paths[0] || '');
    }
  }, [paths, multiple]);

  const handlePathChange = (index: number, newPath: string) => {
    const updated = [...paths];
    updated[index] = newPath;
    setPaths(updated);
  };

  const addPath = () => {
    setPaths([...paths, '']);
  };

  const removePath = (index: number) => {
    setPaths(paths.filter((_, i) => i !== index));
  };

  const saveToRecent = (path: string) => {
    if (!path.trim()) return;
    const updated = [path, ...recentPaths.filter(p => p !== path)].slice(0, 5);
    setRecentPaths(updated);
    localStorage.setItem('recentPaths', JSON.stringify(updated));
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {paths.map((path, index) => (
        <div key={index} className="mb-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={path}
              onChange={(e) => handlePathChange(index, e.target.value)}
              onBlur={() => saveToRecent(path)}
              placeholder={placeholder}
              list={`recent-paths-${index}`}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {multiple && paths.length > 1 && (
              <button
                type="button"
                onClick={() => removePath(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <datalist id={`recent-paths-${index}`}>
            {recentPaths.map((recentPath, i) => (
              <option key={i} value={recentPath} />
            ))}
          </datalist>
        </div>
      ))}

      {multiple && (
        <button
          type="button"
          onClick={addPath}
          className="mt-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Path
        </button>
      )}
    </div>
  );
};

export default PathSelector;