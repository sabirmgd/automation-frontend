import { useState, useEffect } from 'react';
import { X, GitBranch, Globe, Lock, Eye, Folder } from 'lucide-react';
import { GitProvider, RepositoryVisibility } from '../../types/git.types';
import type { CreateGitRepositoryDto, GitCredential } from '../../types/git.types';

interface RepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGitRepositoryDto) => Promise<void>;
  projectId: string;
  credentials: GitCredential[];
  mode?: 'create' | 'import';
}

const RepositoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  credentials,
  mode = 'create'
}: RepositoryModalProps) => {
  const [formData, setFormData] = useState<CreateGitRepositoryDto>({
    projectId,
    provider: GitProvider.GITHUB,
    name: '',
    description: '',
    url: '',
    visibility: RepositoryVisibility.PRIVATE,
    credentialId: '',
    defaultBranch: 'main',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter credentials by selected provider
  const filteredCredentials = credentials.filter(
    c => c.provider === formData.provider
  );

  useEffect(() => {
    // Auto-select default credential when provider changes
    const defaultCred = filteredCredentials.find(c => c.isDefault);
    if (defaultCred) {
      setFormData(prev => ({ ...prev, credentialId: defaultCred.id }));
    } else if (filteredCredentials.length > 0) {
      setFormData(prev => ({ ...prev, credentialId: filteredCredentials[0].id }));
    } else {
      setFormData(prev => ({ ...prev, credentialId: '' }));
    }
  }, [formData.provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Auto-generate URL if not provided
      if (!formData.url && mode === 'create') {
        const provider = formData.provider.toLowerCase();
        const domain = provider === 'github' ? 'github.com' :
                      provider === 'gitlab' ? 'gitlab.com' :
                      'bitbucket.org';
        formData.url = `https://${domain}/${formData.namespace || 'username'}/${formData.name}`;
      }

      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        projectId,
        provider: GitProvider.GITHUB,
        name: '',
        description: '',
        url: '',
        visibility: RepositoryVisibility.PRIVATE,
        credentialId: '',
        defaultBranch: 'main',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create repository');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'import' ? 'Import Repository' : 'Create Repository'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider *
              </label>
              <select
                required
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as GitProvider })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={GitProvider.GITHUB}>GitHub</option>
                <option value={GitProvider.GITLAB}>GitLab</option>
                <option value={GitProvider.BITBUCKET}>Bitbucket</option>
                <option value={GitProvider.LOCAL}>Local</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credential *
              </label>
              <select
                required={formData.provider !== GitProvider.LOCAL}
                value={formData.credentialId || ''}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={filteredCredentials.length === 0}
              >
                {filteredCredentials.length === 0 ? (
                  <option value="">No credentials for {formData.provider}</option>
                ) : (
                  <>
                    <option value="">Select credential</option>
                    {filteredCredentials.map(cred => (
                      <option key={cred.id} value={cred.id}>
                        {cred.name} {cred.isDefault && '(default)'}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {filteredCredentials.length === 0 && formData.provider !== GitProvider.LOCAL && (
                <p className="mt-1 text-xs text-red-600">
                  Please create a credential for {formData.provider} first
                </p>
              )}
            </div>
          </div>

          {mode === 'import' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repository URL *
              </label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => {
                  const url = e.target.value;
                  setFormData({ ...formData, url });

                  // Try to extract owner and name from URL
                  // Support formats like:
                  // https://github.com/owner/repo
                  // https://github.com/owner/repo.git
                  // git@github.com:owner/repo.git
                  const githubMatch = url.match(/github\.com[:/]([^/]+)\/([^/\.]+)(?:\.git)?$/);
                  const gitlabMatch = url.match(/gitlab\.com[:/]([^/]+)\/([^/\.]+)(?:\.git)?$/);
                  const bitbucketMatch = url.match(/bitbucket\.org[:/]([^/]+)\/([^/\.]+)(?:\.git)?$/);

                  if (githubMatch || gitlabMatch || bitbucketMatch) {
                    const match = githubMatch || gitlabMatch || bitbucketMatch;
                    const [, owner, repo] = match;
                    setFormData(prev => ({
                      ...prev,
                      namespace: owner,
                      name: repo
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/username/repo"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Namespace/Organization
                  </label>
                  <input
                    type="text"
                    value={formData.namespace || ''}
                    onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="username or organization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="my-awesome-project"
                    pattern="[a-z0-9-_]+"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="A brief description of the repository"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as RepositoryVisibility })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={RepositoryVisibility.PRIVATE}>
                  <Lock className="w-4 h-4 inline mr-1" />
                  Private
                </option>
                <option value={RepositoryVisibility.PUBLIC}>
                  <Globe className="w-4 h-4 inline mr-1" />
                  Public
                </option>
                <option value={RepositoryVisibility.INTERNAL}>
                  <Eye className="w-4 h-4 inline mr-1" />
                  Internal
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Branch
              </label>
              <input
                type="text"
                value={formData.defaultBranch || 'main'}
                onChange={(e) => setFormData({ ...formData, defaultBranch: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="main"
              />
            </div>
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local Path (optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Folder className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.localPath || ''}
                  onChange={(e) => setFormData({ ...formData, localPath: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/Users/username/projects/repo-name"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the full path where you want to clone this repository locally
              </p>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (filteredCredentials.length === 0 && formData.provider !== GitProvider.LOCAL)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {mode === 'import' ? 'Importing...' : 'Creating...'}
              </>
            ) : (
              <>
                <GitBranch className="w-4 h-4" />
                {mode === 'import' ? 'Import Repository' : 'Create Repository'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepositoryModal;