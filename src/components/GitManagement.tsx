import React, { useState, useEffect, useMemo } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Clock,
  Check,
  AlertCircle,
  Plus,
  Key,
  Settings,
  Github,
  Gitlab,
  RefreshCw,
  Trash2,
  ExternalLink,
  Shield,
  Server,
  Edit,
  Flame,
} from 'lucide-react';
import { useGitCredentials, useGitRepositories, useGitPullRequests } from '../hooks/useGit';
import { GitProvider, CredentialType, type GitRepository } from '../types/git.types';
import CredentialModal from './modals/CredentialModal';
import RepositoryModal from './modals/RepositoryModal';
import EditRepositoryModal from './modals/EditRepositoryModal';
import { useProjectContext } from '../context/ProjectContext';

const GitManagement = ({ projectId }: { projectId?: string }) => {
  const { selectedProject } = useProjectContext();
  const [activeTab, setActiveTab] = useState<'repositories' | 'credentials' | 'pullrequests'>('repositories');
  const [selectedProvider, setSelectedProvider] = useState<GitProvider | undefined>(undefined);
  const [selectedRepo, setSelectedRepo] = useState<GitRepository | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditRepoModal, setShowEditRepoModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState<GitRepository | null>(null);
  const [showHotOnly, setShowHotOnly] = useState(true);

  // Use selectedProject's id if no projectId is passed
  const effectiveProjectId = projectId || selectedProject?.id;

  // Hooks
  const {
    credentials,
    loading: credLoading,
    error: credError,
    createCredential,
    deleteCredential,
    validateCredential,
  } = useGitCredentials(selectedProvider, effectiveProjectId);

  const {
    repositories,
    loading: repoLoading,
    error: repoError,
    createRepository,
    // createRemoteRepository, // Reserved for future use
    importRepository,
    updateRepository,
    deleteRepository,
    syncRepository,
    syncProjectRepositories,
  } = useGitRepositories(effectiveProjectId, selectedProvider);

  const {
    pullRequests,
    loading: prLoading,
    // createPullRequest, // Will be used when modal is implemented
    mergePullRequest,
  } = useGitPullRequests(selectedRepo?.id || '');

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'gitlab':
        return <Gitlab className="w-5 h-5" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };

  const getCredentialTypeIcon = (type: CredentialType) => {
    switch (type) {
      case CredentialType.SSH_KEY:
        return <Key className="w-4 h-4" />;
      case CredentialType.PERSONAL_ACCESS_TOKEN:
      case CredentialType.API_KEY:
        return <Shield className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            <Check className="w-3 h-3" />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const getPRStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Open</span>;
      case 'merged':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">Merged</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Closed</span>;
      default:
        return null;
    }
  };

  // Filter and sort repositories
  const filteredAndSortedRepositories = useMemo(() => {
    let filtered = repositories;

    // Filter by hot status if enabled
    if (showHotOnly) {
      filtered = filtered.filter(repo => repo.isHot);
    }

    // Sort: hot repos first, then alphabetically
    return [...filtered].sort((a, b) => {
      // Hot repos always come first
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [repositories, showHotOnly]);

  const toggleRepoHotStatus = async (repo: GitRepository) => {
    try {
      await updateRepository(repo.id, { isHot: !repo.isHot });
    } catch (error) {
      console.error('Failed to update repository hot status:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Git Management</h1>
        <p className="text-gray-600 mt-2">Manage Git repositories, credentials, and pull requests</p>
      </div>

      {/* Project Indicator */}
      {selectedProject && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">Filtered by project:</span>
            <span className="font-medium text-blue-900">{selectedProject.name}</span>
            {selectedProject.gitlabId && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                GitLab: {selectedProject.gitlabId}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Repositories</p>
              <p className="text-2xl font-bold text-gray-900">{repositories.length}</p>
            </div>
            <GitBranch className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Credentials</p>
              <p className="text-2xl font-bold text-blue-600">{credentials.length}</p>
            </div>
            <Key className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open PRs</p>
              <p className="text-2xl font-bold text-green-600">
                {pullRequests.filter(pr => pr.state === 'open').length}
              </p>
            </div>
            <GitPullRequest className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Commits</p>
              <p className="text-2xl font-bold text-purple-600">
                {repositories.reduce((acc, repo) => acc + (repo.metadata?.size || 0), 0)}
              </p>
            </div>
            <GitCommit className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Provider Filter */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Filter by Provider:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedProvider(undefined)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              !selectedProvider
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedProvider(GitProvider.GITHUB)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              selectedProvider === GitProvider.GITHUB
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Github className="w-4 h-4" />
            GitHub
          </button>
          <button
            onClick={() => setSelectedProvider(GitProvider.GITLAB)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              selectedProvider === GitProvider.GITLAB
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Gitlab className="w-4 h-4" />
            GitLab
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('repositories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'repositories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Repositories
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'credentials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Credentials
          </button>
          <button
            onClick={() => setActiveTab('pullrequests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pullrequests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pull Requests
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'repositories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Repositories</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHotOnly(!showHotOnly)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    showHotOnly
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  <Flame className={`w-4 h-4 ${showHotOnly ? 'text-orange-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">Hot Only</span>
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {effectiveProjectId && (
                <button
                  onClick={() => syncProjectRepositories && syncProjectRepositories()}
                  className="px-4 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync All Repositories
                </button>
              )}
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Import Repository
              </button>
              <button
                onClick={() => setShowRepoModal(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Repository
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="divide-y">
              {repoLoading ? (
                <div className="p-6 text-center text-gray-500">Loading repositories...</div>
              ) : repoError ? (
                <div className="p-6 text-center text-red-500">Error: {repoError}</div>
              ) : filteredAndSortedRepositories.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {showHotOnly ? 'No hot repositories found' : 'No repositories found'}
                </div>
              ) : (
                filteredAndSortedRepositories.map((repo) => (
                  <div key={repo.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getProviderIcon(repo.provider)}
                          <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
                          {repo.isHot && (
                            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                              <Flame className="w-3 h-3" />
                              Hot
                            </span>
                          )}
                          {repo.visibility && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              repo.visibility === 'private'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {repo.visibility}
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
                          {repo.metadata?.language && (
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                              <span>{repo.metadata.language}</span>
                            </div>
                          )}
                          {repo.metadata?.stars !== undefined && (
                            <div className="flex items-center gap-1">
                              ⭐ <span>{repo.metadata.stars}</span>
                            </div>
                          )}
                          {repo.metadata?.forks !== undefined && (
                            <div className="flex items-center gap-1">
                              🍴 <span>{repo.metadata.forks}</span>
                            </div>
                          )}
                        </div>
                        {repo.localPath && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            📁 Local: {repo.localPath}
                          </div>
                        )}
                        {repo.lastSyncedAt && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Last synced: {new Date(repo.lastSyncedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleRepoHotStatus(repo)}
                          className={`p-2 rounded-lg transition-colors ${
                            repo.isHot
                              ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                              : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                          }`}
                          title={repo.isHot ? 'Remove from hot' : 'Mark as hot'}
                        >
                          <Flame className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => syncRepository(repo.id)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Sync Repository"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRepo(repo);
                            setShowEditRepoModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Repository"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedRepo(repo)}
                          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => deleteRepository(repo.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Repository"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Git Credentials</h2>
            <button
              onClick={() => setShowCredentialModal(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Credential
            </button>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="divide-y">
              {credLoading ? (
                <div className="p-6 text-center text-gray-500">Loading credentials...</div>
              ) : credError ? (
                <div className="p-6 text-center text-red-500">Error: {credError}</div>
              ) : credentials.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No credentials found</div>
              ) : (
                credentials.map((credential) => (
                  <div key={credential.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getProviderIcon(credential.provider)}
                          <h3 className="text-lg font-semibold text-gray-900">{credential.name}</h3>
                          {getCredentialTypeIcon(credential.type)}
                          <span className="text-sm text-gray-600">{credential.type.replace(/_/g, ' ')}</span>
                          {credential.isDefault && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Default</span>
                          )}
                          {getStatusBadge(credential.isActive ? 'active' : 'inactive')}
                        </div>
                        {credential.description && (
                          <p className="text-sm text-gray-600 mb-2">{credential.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {credential.username && (
                            <div>Username: <span className="font-medium">{credential.username}</span></div>
                          )}
                          {credential.expiresAt && (
                            <div>
                              Expires: <span className="font-medium">
                                {new Date(credential.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          {credential.lastUsedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last used: {new Date(credential.lastUsedAt).toLocaleString()}
                            </div>
                          )}
                          {credential.lastValidatedAt && (
                            <div className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Validated: {new Date(credential.lastValidatedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => validateCredential(credential.id)}
                          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Validate
                        </button>
                        <button
                          onClick={() => deleteCredential(credential.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Credential"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pullrequests' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Pull Requests</h2>
            <button
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={!selectedRepo}
            >
              <Plus className="w-4 h-4" />
              New Pull Request
            </button>
          </div>

          {!selectedRepo ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Please select a repository from the Repositories tab to view its pull requests.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  {getProviderIcon(selectedRepo.provider)}
                  <span className="font-medium">{selectedRepo.name}</span>
                </div>
              </div>
              <div className="divide-y">
                {prLoading ? (
                  <div className="p-6 text-center text-gray-500">Loading pull requests...</div>
                ) : pullRequests.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No pull requests found</div>
                ) : (
                  pullRequests.map((pr) => (
                    <div key={pr.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <GitMerge className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-base font-semibold text-gray-900">
                                  {pr.title} <span className="text-gray-500 font-normal">#{pr.number}</span>
                                </h3>
                                {getPRStatusBadge(pr.state)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {pr.sourceBranch} → {pr.targetBranch} •
                                opened {new Date(pr.createdAt).toLocaleDateString()} by {pr.author.username}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{pr.commits} commits</span>
                                <span>{pr.comments} comments</span>
                                <span className="text-green-600">+{pr.additions}</span>
                                <span className="text-red-600">-{pr.deletions}</span>
                                <span>{pr.changedFiles} files</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {pr.state === 'open' && (
                          <button
                            onClick={() => mergePullRequest(pr.number)}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Merge
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CredentialModal
        isOpen={showCredentialModal}
        onClose={() => setShowCredentialModal(false)}
        onSubmit={async (data) => {
          await createCredential(data);
          setShowCredentialModal(false);
        }}
      />

      <RepositoryModal
        isOpen={showRepoModal}
        onClose={() => setShowRepoModal(false)}
        onSubmit={async (data) => {
          await createRepository(data);
          setShowRepoModal(false);
        }}
        projectId={effectiveProjectId || ''}
        credentials={credentials}
        mode="create"
      />

      <RepositoryModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSubmit={async (data) => {
          await importRepository(
            data.projectId,
            data.provider,
            data.namespace || '',
            data.name,
            data.credentialId
          );
          setShowImportModal(false);
        }}
        projectId={effectiveProjectId || ''}
        credentials={credentials}
        mode="import"
      />

      <EditRepositoryModal
        isOpen={showEditRepoModal}
        onClose={() => {
          setShowEditRepoModal(false);
          setEditingRepo(null);
        }}
        onSubmit={async (id, data) => {
          await updateRepository(id, data);
          setShowEditRepoModal(false);
          setEditingRepo(null);
        }}
        repository={editingRepo}
        credentials={credentials}
      />
    </div>
  );
};

export default GitManagement;