import { useState, useCallback } from 'react';
import reviewService from '../services/review.service';
import { useToast } from './use-toast';
import type {
  ReviewComment,
  ReviewSummary,
  GenerateReviewRequest,
  ApproveCommentsRequest,
  PostCommentsRequest,
  ReviewCommentFilters,
  CommentSeverity,
} from '../types/review.types';

interface UseReviewReturn {
  comments: ReviewComment[];
  summary: ReviewSummary | null;
  loading: boolean;
  generating: boolean;
  approving: boolean;
  posting: boolean;
  error: string | null;
  selectedCommentIds: Set<string>;
  reviewSessionId: string | null;
  generateReview: (request: GenerateReviewRequest) => Promise<void>;
  loadComments: (pullRequestId: string, filters?: ReviewCommentFilters) => Promise<void>;
  approveComments: (commentIds: string[], approvedBy: string) => Promise<void>;
  postComments: (pullRequestId: string, commentIds?: string[]) => Promise<void>;
  postAllApproved: (pullRequestId: string) => Promise<void>;
  deleteComments: (commentIds: string[]) => Promise<void>;
  toggleCommentSelection: (commentId: string) => void;
  selectAllComments: () => void;
  clearSelection: () => void;
  filterBySeverity: (severity: CommentSeverity | null) => void;
  refreshSummary: (pullRequestId: string) => Promise<void>;
}

export function useReview(): UseReviewReturn {
  const { toast } = useToast();
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<string>>(new Set());
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ReviewCommentFilters>({});

  const generateReview = useCallback(async (request: GenerateReviewRequest) => {
    try {
      setGenerating(true);
      setError(null);

      const response = await reviewService.generateReview(request);

      setComments(response.comments);
      setSummary(response.summary);
      setReviewSessionId(response.reviewSessionId);

      toast({
        title: 'Review Generated',
        description: `Generated ${response.comments.length} review comments`,
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate review';
      setError(errorMsg);
      toast({
        title: 'Generation Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }, [toast]);

  const loadComments = useCallback(async (
    pullRequestId: string,
    filters?: ReviewCommentFilters
  ) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters || {});

      const loadedComments = await reviewService.getReviewComments(pullRequestId, filters);
      setComments(loadedComments);

      if (filters?.reviewSessionId) {
        setReviewSessionId(filters.reviewSessionId);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load comments';
      setError(errorMsg);
      toast({
        title: 'Load Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const approveComments = useCallback(async (
    commentIds: string[],
    approvedBy: string
  ) => {
    try {
      setApproving(true);
      setError(null);

      const request: ApproveCommentsRequest = {
        commentIds,
        approvedBy,
      };

      const response = await reviewService.approveComments(request);

      setComments(prevComments =>
        prevComments.map(comment =>
          commentIds.includes(comment.id)
            ? { ...comment, approved: true, approvedBy, approvedAt: new Date() }
            : comment
        )
      );

      if (summary) {
        setSummary({
          ...summary,
          approvedCount: summary.approvedCount + response.approved,
        });
      }

      toast({
        title: 'Comments Approved',
        description: `Approved ${response.approved} comments${response.failed > 0 ? `, ${response.failed} failed` : ''}`,
      });

      setSelectedCommentIds(new Set());
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to approve comments';
      setError(errorMsg);
      toast({
        title: 'Approval Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setApproving(false);
    }
  }, [summary, toast]);

  const postComments = useCallback(async (
    pullRequestId: string,
    commentIds?: string[]
  ) => {
    try {
      setPosting(true);
      setError(null);

      const request: PostCommentsRequest = {
        pullRequestId,
        commentIds,
        postAll: false,
      };

      const response = await reviewService.postComments(request);

      setComments(prevComments =>
        prevComments.map(comment =>
          commentIds?.includes(comment.id)
            ? { ...comment, posted: true, postedAt: new Date() }
            : comment
        )
      );

      if (summary) {
        setSummary({
          ...summary,
          postedCount: summary.postedCount + response.posted,
        });
      }

      toast({
        title: 'Comments Posted',
        description: `Posted ${response.posted} comments${response.failed > 0 ? `, ${response.failed} failed` : ''}`,
      });

      if (response.errors.length > 0) {
        console.error('Post errors:', response.errors);
      }

      setSelectedCommentIds(new Set());
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to post comments';
      setError(errorMsg);
      toast({
        title: 'Post Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
  }, [summary, toast]);

  const postAllApproved = useCallback(async (pullRequestId: string) => {
    try {
      setPosting(true);
      setError(null);

      const request: PostCommentsRequest = {
        pullRequestId,
        postAll: true,
      };

      const response = await reviewService.postComments(request);

      setComments(prevComments =>
        prevComments.map(comment =>
          comment.approved && !comment.posted
            ? { ...comment, posted: true, postedAt: new Date() }
            : comment
        )
      );

      if (summary) {
        setSummary({
          ...summary,
          postedCount: summary.approvedCount,
        });
      }

      toast({
        title: 'All Approved Comments Posted',
        description: `Posted ${response.posted} comments${response.failed > 0 ? `, ${response.failed} failed` : ''}`,
      });

      if (response.errors.length > 0) {
        console.error('Post errors:', response.errors);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to post comments';
      setError(errorMsg);
      toast({
        title: 'Post Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
  }, [summary, toast]);

  const deleteComments = useCallback(async (commentIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewService.deleteComments(commentIds);

      setComments(prevComments =>
        prevComments.filter(comment => !commentIds.includes(comment.id))
      );

      toast({
        title: 'Comments Deleted',
        description: `Deleted ${response.deleted} comments`,
      });

      setSelectedCommentIds(new Set());
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete comments';
      setError(errorMsg);
      toast({
        title: 'Delete Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleCommentSelection = useCallback((commentId: string) => {
    setSelectedCommentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  const selectAllComments = useCallback(() => {
    setSelectedCommentIds(new Set(comments.map(c => c.id)));
  }, [comments]);

  const clearSelection = useCallback(() => {
    setSelectedCommentIds(new Set());
  }, []);

  const filterBySeverity = useCallback((severity: CommentSeverity | null) => {
    if (severity) {
      setCurrentFilters(prev => ({ ...prev, severity }));
    } else {
      setCurrentFilters(prev => {
        const { severity: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const refreshSummary = useCallback(async (pullRequestId: string) => {
    try {
      const newSummary = await reviewService.getReviewSummary(pullRequestId);
      setSummary(newSummary);
    } catch (err: any) {
      console.error('Failed to refresh summary:', err);
    }
  }, []);

  return {
    comments,
    summary,
    loading,
    generating,
    approving,
    posting,
    error,
    selectedCommentIds,
    reviewSessionId,
    generateReview,
    loadComments,
    approveComments,
    postComments,
    postAllApproved,
    deleteComments,
    toggleCommentSelection,
    selectAllComments,
    clearSelection,
    filterBySeverity,
    refreshSummary,
  };
}