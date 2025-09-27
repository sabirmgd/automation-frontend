interface ProjectStatusProps {
  status: string;
}

const ProjectStatus: React.FC<ProjectStatusProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();

    switch (statusLower) {
      case 'active':
      case 'in_progress':
        return {
          color: 'bg-green-100 text-green-800',
          label: 'Active'
        };
      case 'in_review':
      case 'review':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          label: 'In Review'
        };
      case 'planning':
      case 'planned':
        return {
          color: 'bg-blue-100 text-blue-800',
          label: 'Planning'
        };
      case 'completed':
      case 'done':
        return {
          color: 'bg-gray-100 text-gray-800',
          label: 'Completed'
        };
      case 'on_hold':
      case 'paused':
        return {
          color: 'bg-orange-100 text-orange-800',
          label: 'On Hold'
        };
      case 'cancelled':
      case 'canceled':
        return {
          color: 'bg-red-100 text-red-800',
          label: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default ProjectStatus;