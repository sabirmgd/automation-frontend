import { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Clock,
  Check,
  AlertCircle,
  RefreshCw,
  Github,
  Gitlab,
  Server,
  ExternalLink,
  Star,
  GitFork,
  Lock,
  Unlock
} from 'lucide-react';
import gitService from '../services/git.service';
import { GitRepository, GitProvider } from '../types/git.types';
import { useProjectContext } from '../context/ProjectContext';

const Git = () => {
  const [repositories, setRepositories] = useState<GitRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    credentialsUsed: string[];
    errors: Array<{ credential: string; error: string }>;
    syncedAt?: Date;
  } | null>(null);
  const { selectedProject } = useProjectContext();

  // Load repositories for the selected project
  useEffect(() => {
    if (selectedProject?.id) {
      loadRepositories();
    }
  }, [selectedProject]);

  const loadRepositories = async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    setError(null);
    try {
      const repos = await gitService.getRepositories(selectedProject.id);
      setRepositories(repos);
    } catch (err: any) {
      setError(err.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const syncRepositories = async () => {
    if (!selectedProject?.id) {
      setError('Please select a project first');
      return;
    }

    console.log('[Git Component] Starting sync for project:', selectedProject.id, selectedProject.name);
    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await gitService.syncProjectRepositories(selectedProject.id);
      console.log('[Git Component] Sync result:', result);

      setRepositories(result.repositories);
      setSyncResult({
        credentialsUsed: result.credentialsUsed,
        errors: result.errors,
        syncedAt: result.syncedAt
      });

      if (result.errors.length > 0) {
        console.warn('[Git Component] Sync had errors:', result.errors);
        setError(`Sync completed with ${result.errors.length} error(s)`);
      } else {
        console.log('[Git Component] Sync completed successfully');
      }
    } catch (err: any) {
      console.error('[Git Component] Sync failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to sync repositories');
    } finally {
      setSyncing(false);
    }
  };

  const getProviderIcon = (provider: GitProvider) => {
    switch (provider) {
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'gitlab':
        return <Gitlab className="w-5 h-5" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <Lock className="w-4 h-4 text-gray-500" />;
      case 'public':
        return <Unlock className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    return 'Just now';
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Git Repositories</h1>
            <p className="text-gray-600 mt-2">
              {selectedProject
                ? `Repositories for ${selectedProject.name}`
                : 'Select a project to view repositories'}
            </p>
          </div>
          <button
            onClick={syncRepositories}
            disabled={!selectedProject || syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Repositories'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {syncResult && syncResult.credentialsUsed.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            <h3 className="font-semibold">Successfully synced repositories</h3>
          </div>
          <div className="text-sm text-green-600 mt-2 space-y-1">
            <p>Last synced: {formatDate(syncResult.syncedAt)}</p>
            <p>Credentials used: {syncResult.credentialsUsed.length}</p>
            {syncResult.errors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="font-medium text-yellow-700">Some credentials had issues:</p>
                {syncResult.errors.map((err, idx) => (
                  <p key={idx} className="text-yellow-600 ml-2 text-xs mt-1">
                    • {err.credential}: {err.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Repositories</p>
              <p className="text-2xl font-bold text-gray-900">{repositories.length}</p>
            </div>
            <GitBranch className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">GitHub Repos</p>
              <p className="text-2xl font-bold text-gray-900">
                {repositories.filter(r => r.provider === 'github').length}
              </p>
            </div>
            <Github className="w-8 h-8 text-gray-900" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">GitLab Repos</p>
              <p className="text-2xl font-bold text-orange-600">
                {repositories.filter(r => r.provider === 'gitlab').length}
              </p>
            </div>
            <Gitlab className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Repositories</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">Loading repositories...</p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="p-12 text-center">
            <GitBranch className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-600">
              {selectedProject
                ? 'No repositories found. Click "Sync Repositories" to fetch from your Git providers.'
                : 'Select a project to view its repositories'}
            </p>
            {selectedProject && (
              <div className="mt-4 text-sm text-gray-500">
                <p>Make sure you have:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Added Git credentials for this project</li>
                  <li>• Set default credentials for your providers</li>
                  <li>• Have access to repositories in your Git accounts</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {repositories.map((repo) => (
              <div key={repo.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(repo.provider)}
                        <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
                      </div>
                      {getVisibilityIcon(repo.visibility)}
                      {repo.credentialId && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          <Check className="w-3 h-3 inline mr-1" />
                          Authenticated
                        </span>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-sm text-gray-600 mb-2">{repo.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-4 h-4" />
                        <span className="font-medium">{repo.defaultBranch || 'main'}</span>
                      </div>

                      {repo.metadata?.stars !== undefined && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>{repo.metadata.stars}</span>
                        </div>
                      )}

                      {repo.metadata?.forks !== undefined && (
                        <div className="flex items-center gap-1">
                          <GitFork className="w-4 h-4" />
                          <span>{repo.metadata.forks}</span>
                        </div>
                      )}

                      {repo.metadata?.language && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {repo.metadata.language}
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Updated {formatDate(repo.lastSyncedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </a>
                    <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors">
                      Clone
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Git;