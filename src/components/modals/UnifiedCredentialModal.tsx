import { useState } from 'react';
import { X, Key, Eye, EyeOff, Shield } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import type { ServiceType, CredentialType } from '../../services/credentials.service';

interface UnifiedCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  credential?: any; // For editing
}

const UnifiedCredentialModal = ({ isOpen, onClose, onSubmit, credential }: UnifiedCredentialModalProps) => {
  const { selectedProject } = useProjectContext();
  const [formData, setFormData] = useState({
    name: credential?.name || '',
    description: credential?.description || '',
    service: credential?.service || 'github',
    type: credential?.type || 'pat',
    secret: '',
    metadata: credential?.metadata || {},
    isDefault: credential?.isDefault || false,
  });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceTypes = {
    'Git Providers': ['github', 'gitlab', 'bitbucket'],
    'Project Management': ['jira', 'linear', 'asana'],
    'CI/CD': ['jenkins', 'circleci', 'github-actions'],
    'Cloud Providers': ['aws', 'gcp', 'azure'],
    'Databases': ['postgresql', 'mysql', 'mongodb', 'redis'],
    'Other': ['api', 'webhook', 'custom'],
  };

  const credentialTypes = {
    github: ['pat', 'ssh_key', 'oauth'],
    gitlab: ['pat', 'ssh_key', 'oauth'],
    bitbucket: ['pat', 'ssh_key', 'oauth'],
    jira: ['api_key', 'basic_auth'],
    aws: ['api_key', 'service_account'],
    postgresql: ['basic_auth'],
    mysql: ['basic_auth'],
    default: ['api_key', 'bearer_token', 'basic_auth'],
  };

  const getAvailableTypes = (service: string) => {
    return credentialTypes[service] || credentialTypes.default;
  };

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
      // Reset form
      setFormData({
        name: '',
        description: '',
        service: 'github',
        type: 'pat',
        secret: '',
        metadata: {},
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {credential ? 'Edit Credential' : 'Add Credential'}
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
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Production API Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service *
              </label>
              <select
                required
                value={formData.service}
                onChange={(e) => setFormData({
                  ...formData,
                  service: e.target.value,
                  type: getAvailableTypes(e.target.value)[0] // Reset type when service changes
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(serviceTypes).map(([category, services]) => (
                  <optgroup key={category} label={category}>
                    {services.map(service => (
                      <option key={service} value={service}>
                        {service.charAt(0).toUpperCase() + service.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
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
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credential Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CredentialType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getAvailableTypes(formData.service).map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Username field for basic auth or when needed */}
          {(formData.type === 'basic_auth' || ['jira', 'postgresql', 'mysql'].includes(formData.service)) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username {formData.type === 'basic_auth' && '*'}
              </label>
              <input
                type="text"
                required={formData.type === 'basic_auth'}
                value={formData.metadata.username || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, username: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
          )}

          {/* Endpoint field for services that need it */}
          {['jira', 'jenkins', 'postgresql', 'mysql', 'mongodb', 'redis', 'api', 'webhook'].includes(formData.service) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint/Host
              </label>
              <input
                type="text"
                value={formData.metadata.endpoint || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, endpoint: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  ['postgresql', 'mysql', 'mongodb', 'redis'].includes(formData.service)
                    ? "e.g., localhost or db.example.com"
                    : "e.g., https://api.example.com"
                }
              />
            </div>
          )}

          {/* Database specific fields */}
          {['postgresql', 'mysql', 'mongodb'].includes(formData.service) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={formData.metadata.database || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, database: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Database name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.metadata.port || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, port: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      formData.service === 'postgresql' ? '5432' :
                      formData.service === 'mysql' ? '3306' :
                      formData.service === 'mongodb' ? '27017' : '6379'
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* Cloud provider specific fields */}
          {['aws', 'gcp', 'azure'].includes(formData.service) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                type="text"
                value={formData.metadata.region || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, region: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., us-west-2"
              />
            </div>
          )}

          {/* Secret/Password/Token field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.type === 'ssh_key' ? 'Private Key' :
               formData.type === 'basic_auth' ? 'Password' :
               formData.type === 'api_key' ? 'API Key' :
               formData.type === 'pat' ? 'Personal Access Token' :
               'Secret'} *
            </label>
            <div className="relative">
              {formData.type === 'ssh_key' ? (
                <textarea
                  required
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  rows={6}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                />
              ) : (
                <>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    required
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${formData.type === 'basic_auth' ? 'password' : 'secret'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>
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
              Set as default for this service
            </label>
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
                {credential ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                {credential ? 'Update Credential' : 'Create Credential'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCredentialModal;