import React from 'react';
import PromptsList from '@/components/prompts/PromptsList';

const PromptsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <PromptsList />
    </div>
  );
};

export default PromptsPage;