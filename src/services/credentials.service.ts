import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

export type ServiceType =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'jira'
  | 'linear'
  | 'asana'
  | 'jenkins'
  | 'circleci'
  | 'github-actions'
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'api'
  | 'webhook'
  | 'custom';

export type CredentialType =
  | 'ssh_key'
  | 'pat' // Personal Access Token
  | 'api_key'
  | 'oauth'
  | 'basic_auth'
  | 'bearer_token'
  | 'service_account';

export type Credential = {
  id: string;
  name: string;
  service: ServiceType;
  type: CredentialType;
  projectId?: string;
  description?: string;
  metadata?: {
    username?: string;
    endpoint?: string;
    region?: string;
    permissions?: string[];
    scope?: string;
  };
  secret?: string; // Only returned when explicitly requested
  status: 'active' | 'expired' | 'invalid';
  isDefault?: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastValidatedAt?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCredentialDto {
  name: string;
  service: ServiceType;
  type: CredentialType;
  projectId?: string;
  description?: string;
  metadata?: {
    username?: string;
    endpoint?: string;
    region?: string;
    permissions?: string[];
    scope?: string;
  };
  secret: string;
  isDefault?: boolean;
  expiresAt?: Date;
}

export interface UpdateCredentialDto {
  name?: string;
  description?: string;
  metadata?: {
    username?: string;
    endpoint?: string;
    region?: string;
    permissions?: string[];
    scope?: string;
  };
  secret?: string;
  isDefault?: boolean;
  expiresAt?: Date;
}

class CredentialsService {
  async getAllCredentials(projectId?: string): Promise<Credential[]> {
    try {
      const params = projectId ? { projectId } : {};
      const response = await axios.get(`${API_BASE}/credentials`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch credentials:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch credentials');
    }
  }

  async getCredentialsByService(service: ServiceType, projectId?: string): Promise<Credential[]> {
    try {
      const params = { service, ...(projectId && { projectId }) };
      const response = await axios.get(`${API_BASE}/credentials`, { params });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch ${service} credentials:`, error);
      throw new Error(error.response?.data?.message || `Failed to fetch ${service} credentials`);
    }
  }

  async getCredential(id: string, includeSecret: boolean = false): Promise<Credential> {
    try {
      const params = includeSecret ? { includeSecret: true } : {};
      const response = await axios.get(`${API_BASE}/credentials/${id}`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch credential:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch credential');
    }
  }

  async createCredential(data: CreateCredentialDto): Promise<Credential> {
    try {
      const response = await axios.post(`${API_BASE}/credentials`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create credential:', error);
      throw new Error(error.response?.data?.message || 'Failed to create credential');
    }
  }

  async updateCredential(id: string, data: UpdateCredentialDto): Promise<Credential> {
    try {
      const response = await axios.patch(`${API_BASE}/credentials/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update credential:', error);
      throw new Error(error.response?.data?.message || 'Failed to update credential');
    }
  }

  async deleteCredential(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/credentials/${id}`);
    } catch (error: any) {
      console.error('Failed to delete credential:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete credential');
    }
  }

  async validateCredential(id: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await axios.post(`${API_BASE}/credentials/${id}/validate`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to validate credential:', error);
      throw new Error(error.response?.data?.message || 'Failed to validate credential');
    }
  }

  async rotateCredential(id: string, newSecret: string): Promise<Credential> {
    try {
      const response = await axios.post(`${API_BASE}/credentials/${id}/rotate`, { secret: newSecret });
      return response.data;
    } catch (error: any) {
      console.error('Failed to rotate credential:', error);
      throw new Error(error.response?.data?.message || 'Failed to rotate credential');
    }
  }

  async getCredentialUsage(id: string): Promise<{
    totalUsage: number;
    recentUsage: Array<{ timestamp: Date; service: string; action: string }>;
  }> {
    try {
      const response = await axios.get(`${API_BASE}/credentials/${id}/usage`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch credential usage:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch credential usage');
    }
  }

  async testCredential(data: CreateCredentialDto): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await axios.post(`${API_BASE}/credentials/test`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to test credential:', error);
      throw new Error(error.response?.data?.message || 'Failed to test credential');
    }
  }

  async bulkValidate(ids: string[]): Promise<Record<string, { valid: boolean; message?: string }>> {
    try {
      const response = await axios.post(`${API_BASE}/credentials/bulk-validate`, { ids });
      return response.data;
    } catch (error: any) {
      console.error('Failed to bulk validate credentials:', error);
      throw new Error(error.response?.data?.message || 'Failed to bulk validate credentials');
    }
  }
}

export default new CredentialsService();