import { useState, useEffect } from 'react';
import { X, GitBranch, Globe, Lock, Eye, Folder } from 'lucide-react';
import { GitProvider, RepositoryVisibility } from '../../types/git.types';
import type { GitRepository, UpdateGitRepositoryDto, GitCredential } from '../../types/git.types';

interface EditRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateGitRepositoryDto) => Promise<void>;
  repository: GitRepository | null;
  credentials: GitCredential[];
}

const EditRepositoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  repository,
  credentials,
}: EditRepositoryModalProps) => {
  const [formData, setFormData] = useState<UpdateGitRepositoryDto>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when repository changes
  useEffect(() => {
    if (repository) {
      setFormData({
        name: repository.name,
        description: repository.description,
        url: repository.url,
        cloneUrl: repository.cloneUrl,
        sshUrl: repository.sshUrl,
        defaultBranch: repository.defaultBranch,
        namespace: repository.namespace,
        visibility: repository.visibility,
        credentialId: repository.credentialId,
        localPath: repository.localPath,
      });
    }
  }, [repository]);

  // Filter credentials by repository provider
  const filteredCredentials = credentials.filter(
    c => repository && c.provider === repository.provider
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repository) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmit(repository.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update repository');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !repository) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Repository
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
                Provider
              </label>
              <input
                type="text"
                value={repository.provider}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credential
              </label>
              <select
                value={formData.credentialId || ''}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No credential</option>
                {filteredCredentials.map(cred => (
                  <option key={cred.id} value={cred.id}>
                    {cred.name} {cred.isDefault && '(default)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repository Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namespace/Organization
              </label>
              <input
                type="text"
                value={formData.namespace || ''}
                onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repository URL
            </label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clone URL
              </label>
              <input
                type="text"
                value={formData.cloneUrl || ''}
                onChange={(e) => setFormData({ ...formData, cloneUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SSH URL
              </label>
              <input
                type="text"
                value={formData.sshUrl || ''}
                onChange={(e) => setFormData({ ...formData, sshUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={formData.visibility || RepositoryVisibility.PRIVATE}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as RepositoryVisibility })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={RepositoryVisibility.PRIVATE}>
                  Private
                </option>
                <option value={RepositoryVisibility.PUBLIC}>
                  Public
                </option>
                <option value={RepositoryVisibility.INTERNAL}>
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
                value={formData.defaultBranch || ''}
                onChange={(e) => setFormData({ ...formData, defaultBranch: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="main"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local Path
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
              Specify the local directory path where this repository is cloned
            </p>
          </div>
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
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <GitBranch className="w-4 h-4" />
                Update Repository
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRepositoryModal;