import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Badge } from './badge';

interface MultiSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectedLabels = value.map(v => {
    const option = options.find(o => o.value === v);
    return option?.label || v;
  });

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-2">
            {value.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {value.length <= 3 ? (
                  selectedLabels.map((label, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {label}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleOption(value[idx]);
                        }}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {value.length} selected
                  </Badge>
                )}
              </div>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {value.length === options.length ? 'Deselect All' : 'Select All'}
              </button>
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggleOption(option.value)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span className="text-sm">{option.label}</span>
                  </div>
                  {value.includes(option.value) && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};