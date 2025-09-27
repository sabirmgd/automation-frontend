import React from 'react';
import TaskList from '@/components/tasks/TaskList';

const Tasks: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <TaskList />
    </div>
  );
};

export default Tasks;