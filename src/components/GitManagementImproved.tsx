import React, { useState, useEffect, useMemo } from 'react';
import {
  GitBranch,
  GitCommit,
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
  Activity,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
  FolderGit,
  Code,
  Users,
  Star,
  GitFork,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useGitCredentials, useGitRepositories, useGitPullRequests } from '../hooks/useGit';
import { GitProvider, CredentialType, type GitRepository } from '../types/git.types';
import PullRequestList from './pullRequests/PullRequestList';
import CredentialModal from './modals/CredentialModal';
import RepositoryModal from './modals/RepositoryModal';
import EditRepositoryModal from './modals/EditRepositoryModal';
import { useProjectContext } from '../context/ProjectContext';
import { PipelineAnalysisDashboard } from './pipelines/PipelineAnalysisDashboard';

const GitManagementImproved = ({ projectId }: { projectId?: string }) => {
  const { selectedProject } = useProjectContext();
  const [selectedProvider, setSelectedProvider] = useState<GitProvider | undefined>(undefined);
  const [selectedRepo, setSelectedRepo] = useState<GitRepository | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'pullrequests' | 'pipelines' | 'credentials'>('overview');
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditRepoModal, setShowEditRepoModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState<GitRepository | null>(null);
  const [showHotOnly, setShowHotOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [activeRepoMenu, setActiveRepoMenu] = useState<string | null>(null);

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
    importRepository,
    updateRepository,
    deleteRepository,
    syncRepository,
    syncProjectRepositories,
  } = useGitRepositories(effectiveProjectId, selectedProvider);

  const {
    pullRequests,
    loading: prLoading,
  } = useGitPullRequests(selectedRepo?.id || '');

  // Auto-select first repository when repositories are loaded
  useEffect(() => {
    if (repositories && repositories.length > 0 && !selectedRepo) {
      const ossBackend = repositories.find(r => r.name?.includes('ossBackend'));
      setSelectedRepo(ossBackend || repositories[0]);
    }
  }, [repositories]);

  // Filter and sort repositories with client-side search
  const filteredAndSortedRepositories = useMemo(() => {
    let filtered = repositories;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.namespace?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by hot status if enabled
    if (showHotOnly) {
      filtered = filtered.filter(repo => repo.isHot);
    }

    // Sort: hot repos first, then alphabetically
    return [...filtered].sort((a, b) => {
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [repositories, showHotOnly, searchQuery]);

  const getProviderIcon = (provider: string, size = "w-5 h-5") => {
    switch (provider.toLowerCase()) {
      case 'github':
        return <Github className={size} />;
      case 'gitlab':
        return <Gitlab className={size} />;
      default:
        return <Server className={size} />;
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

  const toggleRepoHotStatus = async (repo: GitRepository) => {
    try {
      await updateRepository(repo.id, { isHot: !repo.isHot });
    } catch (error) {
      console.error('Failed to update repository hot status:', error);
    }
  };

  const handleRepoAction = async (action: string, repo: GitRepository) => {
    setActiveRepoMenu(null);
    switch (action) {
      case 'sync':
        await syncRepository(repo.id);
        break;
      case 'edit':
        setEditingRepo(repo);
        setShowEditRepoModal(true);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${repo.name}"?`)) {
          await deleteRepository(repo.id);
          if (selectedRepo?.id === repo.id) {
            setSelectedRepo(null);
          }
        }
        break;
      case 'hot':
        await toggleRepoHotStatus(repo);
        break;
      case 'open':
        if (repo.url) {
          window.open(repo.url, '_blank');
        }
        break;
    }
  };

  // Calculate stats for selected repository or all
  const stats = useMemo(() => {
    if (selectedRepo) {
      return {
        branches: selectedRepo.branches?.length || 1,
        commits: selectedRepo.metadata?.size || 0,
        openPRs: pullRequests.filter(pr => pr.state === 'open').length,
        totalPRs: pullRequests.length,
        stars: selectedRepo.metadata?.stars || 0,
        forks: selectedRepo.metadata?.forks || 0,
      };
    }
    return {
      totalRepos: repositories.length,
      activeRepos: repositories.filter(r => r.isHot).length,
      totalCredentials: credentials.length,
      providers: [...new Set(repositories.map(r => r.provider))].length,
    };
  }, [selectedRepo, repositories, pullRequests, credentials]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Git Management</h1>
        <p className="text-gray-600 mt-2">
          {selectedRepo
            ? `Managing ${selectedRepo.name}`
            : 'Select a repository to view details'}
        </p>
      </div>

      {/* Project Indicator */}
      {selectedProject && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">Project:</span>
            <span className="font-medium text-blue-900">{selectedProject.name}</span>
            {selectedProject.gitlabId && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                GitLab: {selectedProject.gitlabId}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {selectedRepo ? (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Branches</p>
                  <p className="text-xl font-bold text-gray-900">{stats.branches}</p>
                </div>
                <GitBranch className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Open PRs</p>
                  <p className="text-xl font-bold text-green-600">{stats.openPRs}</p>
                </div>
                <GitPullRequest className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Stars</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.stars}</p>
                </div>
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Forks</p>
                  <p className="text-xl font-bold text-blue-600">{stats.forks}</p>
                </div>
                <GitFork className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Repositories</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalRepos}</p>
                </div>
                <GitBranch className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Active</p>
                  <p className="text-xl font-bold text-orange-600">{stats.activeRepos}</p>
                </div>
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Credentials</p>
                  <p className="text-xl font-bold text-blue-600">{stats.totalCredentials}</p>
                </div>
                <Key className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Providers</p>
                  <p className="text-xl font-bold text-purple-600">{stats.providers}</p>
                </div>
                <Server className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content - Two Panel Layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Panel - Repository List */}
        <div className={`${leftPanelCollapsed ? 'w-16' : 'w-96'} transition-all duration-300 bg-white rounded-lg shadow-sm border flex flex-col`}>
          {/* Panel Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!leftPanelCollapsed && (
                <>
                  <h2 className="text-lg font-semibold">Repositories</h2>
                  <button
                    onClick={() => setLeftPanelCollapsed(true)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </>
              )}
              {leftPanelCollapsed && (
                <button
                  onClick={() => setLeftPanelCollapsed(false)}
                  className="p-1 hover:bg-gray-100 rounded mx-auto"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {!leftPanelCollapsed && (
              <>
                {/* Search and Filters */}
                <div className="mt-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowHotOnly(!showHotOnly)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        showHotOnly
                          ? 'bg-orange-100 text-orange-700 border border-orange-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span className="font-medium">Hot Only</span>
                    </button>

                    <select
                      value={selectedProvider || ''}
                      onChange={(e) => setSelectedProvider(e.target.value ? e.target.value as GitProvider : undefined)}
                      className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Providers</option>
                      <option value={GitProvider.GITHUB}>GitHub</option>
                      <option value={GitProvider.GITLAB}>GitLab</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 inline mr-1" />
                    Import
                  </button>
                  <button
                    onClick={() => setShowRepoModal(true)}
                    className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" />
                    Create
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Repository List */}
          <div className="flex-1 overflow-y-auto">
            {!leftPanelCollapsed ? (
              <div className="p-2 space-y-1">
                {repoLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading repositories...
                  </div>
                ) : filteredAndSortedRepositories.length === 0 ? (
                  <div className="p-8 text-center">
                    <FolderGit className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-3">
                      {searchQuery
                        ? 'No repositories match your search'
                        : showHotOnly
                          ? 'No hot repositories'
                          : 'No repositories yet'}
                    </p>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Import your first repository →
                    </button>
                  </div>
                ) : (
                  filteredAndSortedRepositories.map((repo) => (
                    <div
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className={`p-3 rounded-lg cursor-pointer transition-all relative ${
                        selectedRepo?.id === repo.id
                          ? 'bg-blue-50 border-blue-300 border'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getProviderIcon(repo.provider, "w-4 h-4")}
                            <span className="font-medium text-sm truncate">{repo.name}</span>
                            {repo.isHot && (
                              <Flame className="w-3.5 h-3.5 text-orange-500" />
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-gray-600 truncate">{repo.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {repo.visibility === 'private' ? (
                              <span className="flex items-center gap-1">
                                <EyeOff className="w-3 h-3" />
                                Private
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Public
                              </span>
                            )}
                            {repo.defaultBranch && (
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {repo.defaultBranch}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveRepoMenu(activeRepoMenu === repo.id ? null : repo.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>

                          {activeRepoMenu === repo.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRepoAction('sync', repo);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Sync Repository
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRepoAction('hot', repo);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Flame className="w-4 h-4" />
                                {repo.isHot ? 'Remove from Hot' : 'Mark as Hot'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRepoAction('edit', repo);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              {repo.url && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRepoAction('open', repo);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Open in Browser
                                </button>
                              )}
                              <hr className="my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRepoAction('delete', repo);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Collapsed view - just icons
              <div className="p-2 space-y-1">
                {filteredAndSortedRepositories.slice(0, 8).map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      setSelectedRepo(repo);
                      setLeftPanelCollapsed(false);
                    }}
                    className={`w-full p-2 rounded-lg flex justify-center ${
                      selectedRepo?.id === repo.id
                        ? 'bg-blue-50 border-blue-300 border'
                        : 'hover:bg-gray-50'
                    }`}
                    title={repo.name}
                  >
                    {getProviderIcon(repo.provider, "w-5 h-5")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Repository Details */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border flex flex-col">
          {selectedRepo ? (
            <>
              {/* Repository Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getProviderIcon(selectedRepo.provider, "w-6 h-6")}
                      <h2 className="text-2xl font-bold">{selectedRepo.name}</h2>
                      {selectedRepo.isHot && (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                          <Flame className="w-3 h-3" />
                          Hot
                        </span>
                      )}
                      {selectedRepo.visibility && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedRepo.visibility === 'private'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedRepo.visibility}
                        </span>
                      )}
                    </div>
                    {selectedRepo.description && (
                      <p className="text-gray-600 mb-3">{selectedRepo.description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      {selectedRepo.defaultBranch && (
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-4 h-4" />
                          {selectedRepo.defaultBranch}
                        </span>
                      )}
                      {selectedRepo.metadata?.language && (
                        <span className="flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          {selectedRepo.metadata.language}
                        </span>
                      )}
                      {selectedRepo.lastSyncedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Synced {new Date(selectedRepo.lastSyncedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => syncRepository(selectedRepo.id)}
                      className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync
                    </button>
                    {selectedRepo.url && (
                      <a
                        href={selectedRepo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail Tabs */}
              <div className="border-b">
                <nav className="flex gap-1 px-6">
                  <button
                    onClick={() => setActiveDetailTab('overview')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeDetailTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('pullrequests')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      activeDetailTab === 'pullrequests'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Pull Requests
                    {pullRequests.filter(pr => pr.state === 'open').length > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        {pullRequests.filter(pr => pr.state === 'open').length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('pipelines')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      activeDetailTab === 'pipelines'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    Pipelines
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeDetailTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Repository Info Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Stars</span>
                          <Star className="w-4 h-4 text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold">{selectedRepo.metadata?.stars || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Forks</span>
                          <GitFork className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold">{selectedRepo.metadata?.forks || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Open Issues</span>
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold">{selectedRepo.metadata?.openIssues || 0}</p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Repository Details</h3>
                        <dl className="space-y-2">
                          {selectedRepo.url && (
                            <div className="flex">
                              <dt className="w-32 text-sm text-gray-600">URL:</dt>
                              <dd className="flex-1">
                                <a href={selectedRepo.url} target="_blank" rel="noopener noreferrer"
                                   className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                  {selectedRepo.url}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </dd>
                            </div>
                          )}
                          {selectedRepo.localPath && (
                            <div className="flex">
                              <dt className="w-32 text-sm text-gray-600">Local Path:</dt>
                              <dd className="flex-1 text-sm">{selectedRepo.localPath}</dd>
                            </div>
                          )}
                          {selectedRepo.namespace && (
                            <div className="flex">
                              <dt className="w-32 text-sm text-gray-600">Namespace:</dt>
                              <dd className="flex-1 text-sm">{selectedRepo.namespace}</dd>
                            </div>
                          )}
                          {selectedRepo.createdAt && (
                            <div className="flex">
                              <dt className="w-32 text-sm text-gray-600">Created:</dt>
                              <dd className="flex-1 text-sm">{new Date(selectedRepo.createdAt).toLocaleDateString()}</dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {/* Recent Activity Placeholder */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">Activity timeline coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'pullrequests' && (
                  <PullRequestList
                    pullRequests={pullRequests}
                    loading={prLoading}
                    error={null}
                    onPullRequestClick={(pr) => {
                      if (pr.url) {
                        window.open(pr.url, '_blank');
                      }
                    }}
                  />
                )}

                {activeDetailTab === 'pipelines' && (
                  <PipelineAnalysisDashboard
                    repositoryId={selectedRepo.id}
                    projectId={selectedRepo.remoteId || `${selectedRepo.namespace}/${selectedRepo.name}`}
                    platform={selectedRepo.provider.toLowerCase() as 'github' | 'gitlab'}
                  />
                )}
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <FolderGit className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Repository Selected</h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Select a repository from the list to view its details, pull requests, and pipeline information.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
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
            </div>
          )}
        </div>
      </div>

      {/* Credentials Section (Separate at bottom) */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Credentials</h2>
          <button
            onClick={() => setShowCredentialModal(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Credential
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          {credLoading ? (
            <div className="p-6 text-center text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading credentials...
            </div>
          ) : credentials.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No credentials configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {credentials.map((credential) => (
                <div key={credential.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(credential.provider, "w-4 h-4")}
                      <span className="font-medium text-sm">{credential.name}</span>
                    </div>
                    {credential.isDefault && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Default</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                    {getCredentialTypeIcon(credential.type)}
                    <span>{credential.type.replace(/_/g, ' ')}</span>
                  </div>
                  {credential.username && (
                    <p className="text-xs text-gray-600 mb-2">User: {credential.username}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => validateCredential(credential.id)}
                      className="flex-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
                    >
                      Validate
                    </button>
                    <button
                      onClick={() => deleteCredential(credential.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

export default GitManagementImproved;