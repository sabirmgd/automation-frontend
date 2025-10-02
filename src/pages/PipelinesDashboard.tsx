import { useState } from 'react';
import { PipelineAnalysis } from '../components/pipelines';
import { ProjectSelector } from '../components/ProjectSelector';

export function PipelinesDashboard() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [platform, setPlatform] = useState<'github' | 'gitlab'>('gitlab');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pipeline Analysis Dashboard</h1>
        <div className="flex gap-4">
          <ProjectSelector
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as 'github' | 'gitlab')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="gitlab">GitLab</option>
            <option value="github">GitHub</option>
          </select>
        </div>
      </div>

      <PipelineAnalysis
        projectId={selectedProject}
        platform={platform}
      />
    </div>
  );
}