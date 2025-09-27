interface ProjectProgressProps {
  progress: number;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

const ProjectProgress: React.FC<ProjectProgressProps> = ({
  progress,
  showLabel = true,
  height = 'md'
}) => {
  const getHeightClass = () => {
    switch (height) {
      case 'sm':
        return 'h-1';
      case 'md':
        return 'h-2';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  const getProgressColor = () => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 60) return 'bg-yellow-500';
    if (progress < 90) return 'bg-blue-600';
    return 'bg-green-500';
  };

  return (
    <div className="mt-4">
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${getHeightClass()}`}>
        <div
          className={`${getProgressColor()} ${getHeightClass()} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default ProjectProgress;