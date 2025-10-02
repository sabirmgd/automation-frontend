export const CommentSeverity = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
  INFO: 'info',
} as const;

export type CommentSeverity = typeof CommentSeverity[keyof typeof CommentSeverity];

export const SuggestionType = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  IMPROVEMENT: 'IMPROVEMENT',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
  BEST_PRACTICE: 'BEST_PRACTICE',
} as const;

export type SuggestionType = typeof SuggestionType[keyof typeof SuggestionType];

export const CommentMode = {
  SINGLE_LINE: 'SINGLE_LINE',
  RANGE: 'RANGE',
} as const;

export type CommentMode = typeof CommentMode[keyof typeof CommentMode];

export interface ReviewComment {
  id: string;
  pullRequestId: string;
  file: string;
  startLine: number;
  endLine?: number;
  oldStartLine?: number;
  oldEndLine?: number;
  commentMode: CommentMode;
  severity: CommentSeverity;
  suggestionType: SuggestionType;
  action: string;
  reason: string;
  patch?: string;
  approved: boolean;
  posted: boolean;
  postedAt?: Date;
  gitCommentId?: string;
  approvedBy?: string;
  approvedAt?: Date;
  reviewSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSummary {
  totalComments: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  infoCount: number;
  approvedCount: number;
  postedCount: number;
}

export interface GenerateReviewRequest {
  pullRequestId: string;
  extraInstructions?: string;
  autoApprove?: boolean;
}

export interface GenerateReviewResponse {
  pullRequestId: string;
  reviewSessionId: string;
  comments: ReviewComment[];
  summary: ReviewSummary;
}

export interface ApproveCommentsRequest {
  commentIds: string[];
  approvedBy: string;
}

export interface ApproveCommentsResponse {
  approved: number;
  failed: number;
}

export interface PostCommentsRequest {
  pullRequestId: string;
  commentIds?: string[];
  postAll?: boolean;
}

export interface PostCommentsResponse {
  posted: number;
  failed: number;
  errors: Array<{ commentId: string; error: string }>;
}

export interface ReviewCommentFilters {
  approved?: boolean;
  posted?: boolean;
  severity?: string;
  suggestionType?: string;
  reviewSessionId?: string;
}