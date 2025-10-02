import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Shield,
  Clock,
  AlertCircle,
  Check,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  Github,
  Gitlab,
  Server,
  Cloud,
  Settings,
  Search,
  Filter,
  ChevronDown,
  Layers,
} from 'lucide-react';
import credentialsService from '../services/credentials.service';
import type { Credential, CredentialType, ServiceType } from '../services/credentials.service';
import { useProjectContext } from '../context/ProjectContext';
import SimpleCredentialModal from '../components/modals/SimpleCredentialModal';

const CredentialsManagement = () => {
  const { selectedProject } = useProjectContext();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceType | 'all'>('all');
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());
  const [validatingCredentials, setValidatingCredentials] = useState<Set<string>>(new Set());

  const serviceCategories = {
    'Git': ['github', 'gitlab', 'bitbucket'],
    'Project Management': ['jira'],
  };

  useEffect(() => {
    loadCredentials();
  }, [selectedProject]);

  const loadCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await credentialsService.getAllCredentials(selectedProject?.id);
      setCredentials(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    try {
      await credentialsService.deleteCredential(id);
      await loadCredentials();
    } catch (err: any) {
      setError(err.message || 'Failed to delete credential');
    }
  };

  const handleValidateCredential = async (id: string) => {
    setValidatingCredentials(prev => new Set([...prev, id]));
    try {
      await credentialsService.validateCredential(id);
      await loadCredentials();
    } catch (err: any) {
      setError(err.message || 'Failed to validate credential');
    } finally {
      setValidatingCredentials(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getServiceIcon = (service: ServiceType) => {
    switch (service) {
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'gitlab':
        return <Gitlab className="w-5 h-5 text-orange-600" />;
      case 'jira':
        return <Layers className="w-5 h-5 text-blue-600" />;
      case 'jenkins':
        return <Server className="w-5 h-5 text-red-600" />;
      case 'aws':
      case 'gcp':
      case 'azure':
        return <Cloud className="w-5 h-5 text-blue-600" />;
      default:
        return <Settings className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCredentialTypeIcon = (type: CredentialType) => {
    switch (type) {
      case 'ssh_key':
        return <Key className="w-4 h-4" />;
      case 'pat':
      case 'api_key':
        return <Shield className="w-4 h-4" />;
      case 'oauth':
        return <Key className="w-4 h-4 text-green-600" />;
      case 'basic_auth':
        return <Settings className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: 'active' | 'expired' | 'invalid') => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            <Check className="w-3 h-3" />
            Active
          </span>
        );
      case 'expired':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        );
      case 'invalid':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Invalid
          </span>
        );
    }
  };

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cred.service.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesService = false;
    if (selectedService === 'all') {
      matchesService = true;
    } else if (selectedService === 'git') {
      // Match any git service
      matchesService = ['github', 'gitlab', 'bitbucket'].includes(cred.service);
    } else {
      matchesService = cred.service === selectedService;
    }

    return matchesSearch && matchesService;
  });

  const groupedCredentials = Object.entries(serviceCategories).reduce((acc, [category, services]) => {
    const categoryCredentials = filteredCredentials.filter(cred =>
      services.includes(cred.service)
    );
    if (categoryCredentials.length > 0) {
      acc[category] = categoryCredentials;
    }
    return acc;
  }, {} as Record<string, Credential[]>);

  const stats = {
    total: credentials.length,
    active: credentials.filter(c => c.status === 'active').length,
    expiring: credentials.filter(c => c.status === 'expired').length,
    invalid: credentials.filter(c => c.status === 'invalid').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Credentials Management</h1>
        <p className="text-gray-600 mt-2">
          Manage authentication credentials for all your integrations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Credentials</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Key className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Invalid</p>
              <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value as ServiceType | 'all')}
              className="pl-10 pr-8 py-2 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Credentials</option>
              <option value="git">Git</option>
              <option value="jira">Jira</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={() => {
            setEditingCredential(null);
            setShowCredentialModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Credential
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Credentials List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Loading credentials...</p>
        </div>
      ) : Object.keys(groupedCredentials).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Key className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-600">
            {searchTerm || selectedService !== 'all'
              ? 'No credentials match your filters'
              : 'No credentials found. Add your first credential to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCredentials).map(([category, categoryCredentials]) => (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  {category} ({categoryCredentials.length})
                </h2>
              </div>
              <div className="divide-y">
                {categoryCredentials.map((credential) => (
                  <div key={credential.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getServiceIcon(credential.service)}
                          <h3 className="text-lg font-semibold text-gray-900">{credential.name}</h3>
                          {getCredentialTypeIcon(credential.type)}
                          <span className="text-sm text-gray-600">
                            {credential.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {credential.isDefault && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Default
                            </span>
                          )}
                          {getStatusBadge(credential.status)}
                        </div>

                        {credential.description && (
                          <p className="text-sm text-gray-600 mb-2">{credential.description}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          {credential.metadata?.username && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Username:</span>
                              <span className="font-medium">{credential.metadata.username}</span>
                            </div>
                          )}
                          {credential.metadata?.endpoint && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Endpoint:</span>
                              <span className="font-medium">{credential.metadata.endpoint}</span>
                            </div>
                          )}
                          {credential.expiresAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-gray-500">Expires:</span>
                              <span className="font-medium">
                                {new Date(credential.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {credential.secret && showSecrets.has(credential.id) && (
                          <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs">
                            {credential.secret.substring(0, 50)}...
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          {credential.lastUsedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last used: {new Date(credential.lastUsedAt).toLocaleString()}
                            </div>
                          )}
                          {credential.usageCount > 0 && (
                            <div>Used {credential.usageCount} times</div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleSecretVisibility(credential.id)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title={showSecrets.has(credential.id) ? "Hide secret" : "Show secret"}
                        >
                          {showSecrets.has(credential.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleValidateCredential(credential.id)}
                          disabled={validatingCredentials.has(credential.id)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Validate credential"
                        >
                          <RefreshCw className={`w-4 h-4 ${validatingCredentials.has(credential.id) ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCredential(credential);
                            setShowCredentialModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit credential"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCredential(credential.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete credential"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <SimpleCredentialModal
        isOpen={showCredentialModal}
        onClose={() => {
          setShowCredentialModal(false);
          setEditingCredential(null);
        }}
        onSubmit={async (data) => {
          if (editingCredential) {
            await credentialsService.updateCredential(editingCredential.id, data);
          } else {
            await credentialsService.createCredential(data);
          }
          await loadCredentials();
          setShowCredentialModal(false);
          setEditingCredential(null);
        }}
        credential={editingCredential}
      />
    </div>
  );
};

export default CredentialsManagement;