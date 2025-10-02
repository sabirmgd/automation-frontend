import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

export interface DiagramData {
  id: string;
  title: string;
  description: string;
  mermaidCode: string;
  type: string;
  validationStatus: 'valid' | 'invalid' | 'pending';
  validationError?: string;
  focusAreas?: string[];
  impactedComponents?: string[];
  suggestedReviewFlow?: string;
  version?: number;
  isLatest?: boolean;
  createdAt?: string;
}

export interface GenerateDiagramFromDiffRequest {
  projectId: number | string;
  mrNumber: number;
  extraInstructions?: string;
  regenerate?: boolean;
}

export interface GenerateDiagramRequest {
  pullRequestId: string;
  extraInstructions?: string;
  regenerate?: boolean;
}

export interface DiagramResponse {
  success: boolean;
  diagramId?: string;
  diagram?: DiagramData;
  supplementaryDiagrams?: DiagramData[];
  formattedComment?: string;
  error?: string;
}

class DiagramService {
  private baseUrl = `${API_CONFIG.BASE_URL}/diagrams`;

  async generateFromDiff(request: GenerateDiagramFromDiffRequest): Promise<DiagramResponse> {
    const response = await axios.post(`${this.baseUrl}/generate-from-diff`, request);
    return response.data;
  }

  async generateDiagram(request: GenerateDiagramRequest): Promise<DiagramResponse> {
    const response = await axios.post(`${this.baseUrl}/generate`, request);
    return response.data;
  }

  async getDiagramsByPullRequest(pullRequestId: string, latestOnly = true): Promise<DiagramData[]> {
    const params = latestOnly ? '?latestOnly=true' : '?latestOnly=false';
    const response = await axios.get(`${this.baseUrl}/pull-request/${pullRequestId}${params}`);
    return response.data.diagrams || [];
  }

  async getDiagram(diagramId: string): Promise<DiagramData> {
    const response = await axios.get(`${this.baseUrl}/${diagramId}`);
    return response.data.diagram;
  }

  async getFormattedComment(diagramId: string): Promise<string> {
    const response = await axios.get(`${this.baseUrl}/${diagramId}/formatted-comment`);
    return response.data.comment;
  }

  async deleteDiagram(diagramId: string): Promise<{ success: boolean }> {
    const response = await axios.delete(`${this.baseUrl}/${diagramId}`);
    return response.data;
  }
}

export default new DiagramService();