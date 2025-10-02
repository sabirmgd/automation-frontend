import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import type {
  ReviewComment,
  ReviewSummary,
  GenerateReviewRequest,
  GenerateReviewResponse,
  ApproveCommentsRequest,
  ApproveCommentsResponse,
  PostCommentsRequest,
  PostCommentsResponse,
  ReviewCommentFilters,
} from '../types/review.types';

class ReviewService {
  private baseUrl = `${API_CONFIG.BASE_URL}/git/review`;

  async generateReview(request: GenerateReviewRequest): Promise<GenerateReviewResponse> {
    const response = await axios.post(`${this.baseUrl}/generate`, request);
    return response.data;
  }

  async getReviewComments(
    pullRequestId: string,
    filters?: ReviewCommentFilters
  ): Promise<ReviewComment[]> {
    const params = new URLSearchParams();

    if (filters?.approved !== undefined) params.append('approved', String(filters.approved));
    if (filters?.posted !== undefined) params.append('posted', String(filters.posted));
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.suggestionType) params.append('suggestionType', filters.suggestionType);
    if (filters?.reviewSessionId) params.append('reviewSessionId', filters.reviewSessionId);

    const response = await axios.get(
      `${this.baseUrl}/pull-request/${pullRequestId}/comments?${params.toString()}`
    );
    return response.data;
  }

  async approveComments(request: ApproveCommentsRequest): Promise<ApproveCommentsResponse> {
    const response = await axios.patch(`${this.baseUrl}/comments/approve`, request);
    return response.data;
  }

  async postComments(request: PostCommentsRequest): Promise<PostCommentsResponse> {
    const response = await axios.post(`${this.baseUrl}/comments/post`, request);
    return response.data;
  }

  async getReviewSummary(pullRequestId: string): Promise<ReviewSummary> {
    const response = await axios.get(`${this.baseUrl}/pull-request/${pullRequestId}/summary`);
    return response.data;
  }

  async deleteComments(commentIds: string[]): Promise<{ deleted: number }> {
    const response = await axios.delete(`${this.baseUrl}/comments`, {
      data: { commentIds },
    });
    return response.data;
  }
}

export default new ReviewService();