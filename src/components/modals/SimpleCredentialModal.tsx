import { useState } from 'react';
import { X, Eye, EyeOff, GitBranch, Layers } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';

interface SimpleCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  credential?: any;
}

const SimpleCredentialModal = ({ isOpen, onClose, onSubmit, credential }: SimpleCredentialModalProps) => {
  const { selectedProject } = useProjectContext();
  const [formData, setFormData] = useState({
    name: credential?.name || '',
    description: credential?.description || '',
    service: credential?.service || 'github',
    type: credential?.type || 'pat',
    secret: '',
    metadata: {
      username: credential?.metadata?.username || '',
      endpoint: credential?.metadata?.endpoint || '',
    },
    isDefault: credential?.isDefault || false,
  });
  const [serviceCategory, setServiceCategory] = useState(
    ['github', 'gitlab'].includes(credential?.service || 'github') ? 'git' : 'jira'
  );
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dataToSubmit = {
        ...formData,
        projectId: selectedProject?.id,
      };
      await onSubmit(dataToSubmit);
      onClose();
      setFormData({
        name: '',
        description: '',
        service: 'github',
        type: 'pat',
        secret: '',
        metadata: { username: '', endpoint: '' },
        isDefault: false,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save credential');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {credential ? 'Edit Credential' : 'Add Credential'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setServiceCategory('git');
                  setFormData({ ...formData, service: 'github', type: 'pat' });
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  serviceCategory === 'git'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <GitBranch className="w-5 h-5" />
                Git
              </button>
              <button
                type="button"
                onClick={() => {
                  setServiceCategory('jira');
                  setFormData({ ...formData, service: 'jira', type: 'api_key' });
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  serviceCategory === 'jira'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Layers className="w-5 h-5" />
                Jira
              </button>
            </div>
          </div>

          {serviceCategory === 'git' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Git Provider *
              </label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                formData.service === 'github' ? 'e.g., GitHub Main' :
                formData.service === 'gitlab' ? 'e.g., GitLab Production' :
                'e.g., Jira Cloud'
              }
            />
          </div>

          {formData.service === 'jira' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jira URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.metadata.endpoint}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, endpoint: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourcompany.atlassian.net"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.metadata.username}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, username: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@company.com"
                />
              </div>
            </>
          )}

          {['github', 'gitlab'].includes(formData.service) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.service === 'github' ? 'GitHub' : 'GitLab'} URL (optional)
              </label>
              <input
                type="url"
                value={formData.metadata.endpoint}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, endpoint: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  formData.service === 'github'
                    ? "Leave empty for github.com"
                    : "Leave empty for gitlab.com"
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {['github', 'gitlab'].includes(formData.service) ? 'Personal Access Token' : 'API Token'} *
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                required
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  formData.service === 'github' ? 'ghp_xxxxxxxxxxxx' :
                  formData.service === 'gitlab' ? 'glpat-xxxxxxxxxxxx' :
                  'Enter API token'
                }
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.service === 'github' && (
              <p className="mt-1 text-xs text-gray-500">
                Create token at: Settings → Developer settings → Personal access tokens
              </p>
            )}
            {formData.service === 'gitlab' && (
              <p className="mt-1 text-xs text-gray-500">
                Create token at: Settings → Access Tokens with 'api' scope
              </p>
            )}
            {formData.service === 'jira' && (
              <p className="mt-1 text-xs text-gray-500">
                Create token at: <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Atlassian Account Settings</a>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Set as default for {
                formData.service === 'github' ? 'GitHub' :
                formData.service === 'gitlab' ? 'GitLab' :
                'Jira'
              }
            </label>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : credential ? 'Update' : 'Add Credential'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCredentialModal;