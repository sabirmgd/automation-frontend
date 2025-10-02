import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  FileCode,
  Check,
  Send,
  Trash2
} from 'lucide-react';
import type { ReviewComment } from '../../types/review.types';
import { CommentSeverity, SuggestionType } from '../../types/review.types';

interface CommentCardProps {
  comment: ReviewComment;
  isSelected: boolean;
  onToggleSelect: (commentId: string) => void;
  onApprove: (commentId: string) => void;
  onPost: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  isSelected,
  onToggleSelect,
  onApprove,
  onPost,
  onDelete,
}) => {
  const getSeverityIcon = (severity: CommentSeverity) => {
    switch (severity) {
      case CommentSeverity.CRITICAL:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case CommentSeverity.MAJOR:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case CommentSeverity.MINOR:
        return <Info className="w-5 h-5 text-yellow-500" />;
      case CommentSeverity.INFO:
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: CommentSeverity) => {
    switch (severity) {
      case CommentSeverity.CRITICAL:
        return 'border-red-500 bg-red-50';
      case CommentSeverity.MAJOR:
        return 'border-orange-500 bg-orange-50';
      case CommentSeverity.MINOR:
        return 'border-yellow-500 bg-yellow-50';
      case CommentSeverity.INFO:
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getTypeLabel = (type: SuggestionType) => {
    switch (type) {
      case SuggestionType.ERROR:
        return 'Error';
      case SuggestionType.WARNING:
        return 'Warning';
      case SuggestionType.IMPROVEMENT:
        return 'Improvement';
      case SuggestionType.SECURITY:
        return 'Security';
      case SuggestionType.PERFORMANCE:
        return 'Performance';
      case SuggestionType.BEST_PRACTICE:
        return 'Best Practice';
      default:
        return 'Comment';
    }
  };

  const getTypeColor = (type: SuggestionType) => {
    switch (type) {
      case SuggestionType.ERROR:
        return 'text-red-700 bg-red-100';
      case SuggestionType.WARNING:
        return 'text-orange-700 bg-orange-100';
      case SuggestionType.SECURITY:
        return 'text-purple-700 bg-purple-100';
      case SuggestionType.PERFORMANCE:
        return 'text-green-700 bg-green-100';
      case SuggestionType.BEST_PRACTICE:
        return 'text-blue-700 bg-blue-100';
      case SuggestionType.IMPROVEMENT:
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div
      className={`relative border-l-4 rounded-lg p-4 mb-4 transition-all ${
        getSeverityColor(comment.severity)
      } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(comment.id)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getSeverityIcon(comment.severity)}
              <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(comment.suggestionType)}`}>
                {getTypeLabel(comment.suggestionType)}
              </span>
              {comment.approved && (
                <span className="px-2 py-1 text-xs font-medium rounded text-green-700 bg-green-100">
                  <CheckCircle className="inline w-3 h-3 mr-1" />
                  Approved
                </span>
              )}
              {comment.posted && (
                <span className="px-2 py-1 text-xs font-medium rounded text-blue-700 bg-blue-100">
                  <Send className="inline w-3 h-3 mr-1" />
                  Posted
                </span>
              )}
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <FileCode className="w-4 h-4" />
                <span className="font-mono">{comment.file}</span>
                <span className="text-gray-400">•</span>
                <span>
                  {comment.endLine && comment.endLine > comment.startLine
                    ? `Lines ${comment.startLine}-${comment.endLine}`
                    : `Line ${comment.startLine}`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="font-semibold text-gray-900">{comment.action}</p>
                <p className="text-sm text-gray-700 mt-1">{comment.reason}</p>
              </div>

              {comment.patch && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Suggested change:</p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <code>{comment.patch}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-4">
          {!comment.approved && !comment.posted && (
            <button
              onClick={() => onApprove(comment.id)}
              className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
              title="Approve comment"
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {comment.approved && !comment.posted && (
            <button
              onClick={() => onPost(comment.id)}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="Post comment"
            >
              <Send className="w-4 h-4" />
            </button>
          )}

          {!comment.posted && (
            <button
              onClick={() => onDelete(comment.id)}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
              title="Delete comment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {comment.approvedBy && (
        <div className="mt-2 text-xs text-gray-500">
          Approved by {comment.approvedBy} at {new Date(comment.approvedAt!).toLocaleString()}
        </div>
      )}

      {comment.postedAt && (
        <div className="mt-2 text-xs text-gray-500">
          Posted at {new Date(comment.postedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default CommentCard;