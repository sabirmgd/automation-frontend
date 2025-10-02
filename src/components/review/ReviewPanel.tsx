import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Send,
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { useReview } from '../../hooks/useReview';
import CommentCard from './CommentCard';
import { CommentSeverity } from '../../types/review.types';

interface ReviewPanelProps {
  pullRequestId: string;
  pullRequestTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({
  pullRequestId,
  pullRequestTitle,
  isOpen,
  onClose,
}) => {
  const {
    comments,
    summary,
    loading,
    generating,
    approving,
    posting,
    selectedCommentIds,
    generateReview,
    loadComments,
    approveComments,
    postComments,
    postAllApproved,
    deleteComments,
    toggleCommentSelection,
    selectAllComments,
    clearSelection,
    refreshSummary,
  } = useReview();

  const [severityFilter, setSeverityFilter] = useState<CommentSeverity | 'all'>('all');
  const [showOnlyUnapproved, setShowOnlyUnapproved] = useState(false);
  const [showOnlyUnposted, setShowOnlyUnposted] = useState(false);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComments(pullRequestId);
      refreshSummary(pullRequestId);
    }
  }, [isOpen, pullRequestId]);

  const handleGenerateReview = async () => {
    await generateReview({
      pullRequestId,
      extraInstructions: extraInstructions || undefined,
      autoApprove: false,
    });
    setShowInstructions(false);
    setExtraInstructions('');
  };

  const handleApproveSelected = async () => {
    const selectedIds = Array.from(selectedCommentIds);
    if (selectedIds.length > 0) {
      await approveComments(selectedIds, 'current-user');
    }
  };

  const handlePostSelected = async () => {
    const selectedIds = Array.from(selectedCommentIds);
    if (selectedIds.length > 0) {
      await postComments(pullRequestId, selectedIds);
    }
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Array.from(selectedCommentIds);
    if (selectedIds.length > 0) {
      if (confirm(`Delete ${selectedIds.length} comments? This cannot be undone.`)) {
        await deleteComments(selectedIds);
      }
    }
  };

  const filteredComments = comments.filter(comment => {
    if (severityFilter !== 'all' && comment.severity !== severityFilter) return false;
    if (showOnlyUnapproved && comment.approved) return false;
    if (showOnlyUnposted && comment.posted) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black bg-opacity-50" onClick={onClose} />
      <div className="w-[800px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Panel</h2>
            <p className="text-sm text-gray-600 mt-1">{pullRequestTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {summary && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="font-medium">{summary.criticalCount}</span>
                  <span className="text-gray-600">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">{summary.majorCount}</span>
                  <span className="text-gray-600">Major</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{summary.minorCount}</span>
                  <span className="text-gray-600">Minor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{summary.infoCount}</span>
                  <span className="text-gray-600">Info</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {summary.approvedCount} approved
                </span>
                <span className="text-blue-600 font-medium">
                  {summary.postedCount} posted
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!showInstructions && comments.length === 0 && (
                <button
                  onClick={() => setShowInstructions(true)}
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Generate Review
                    </>
                  )}
                </button>
              )}

              {comments.length > 0 && (
                <>
                  <button
                    onClick={() => setShowInstructions(true)}
                    disabled={generating}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm flex items-center gap-1"
                    title="Re-review with updated code"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Re-reviewing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Re-review
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => loadComments(pullRequestId)}
                    disabled={loading}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>

                  {selectedCommentIds.size > 0 ? (
                    <button
                      onClick={clearSelection}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Clear selection"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={selectAllComments}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Select all"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}

                  {selectedCommentIds.size > 0 && (
                    <>
                      <button
                        onClick={handleApproveSelected}
                        disabled={approving}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve ({selectedCommentIds.size})
                      </button>

                      <button
                        onClick={handlePostSelected}
                        disabled={posting}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-1"
                      >
                        <Send className="w-4 h-4" />
                        Post ({selectedCommentIds.size})
                      </button>

                      <button
                        onClick={handleDeleteSelected}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete ({selectedCommentIds.size})
                      </button>
                    </>
                  )}

                  {summary && summary.approvedCount > summary.postedCount && (
                    <button
                      onClick={() => postAllApproved(pullRequestId)}
                      disabled={posting}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      Post All Approved ({summary.approvedCount - summary.postedCount})
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as CommentSeverity | 'all')}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="all">All Severities</option>
                <option value={CommentSeverity.CRITICAL}>Critical</option>
                <option value={CommentSeverity.MAJOR}>Major</option>
                <option value={CommentSeverity.MINOR}>Minor</option>
                <option value={CommentSeverity.INFO}>Info</option>
              </select>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showOnlyUnapproved}
                  onChange={(e) => setShowOnlyUnapproved(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Unapproved only
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showOnlyUnposted}
                  onChange={(e) => setShowOnlyUnposted(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Unposted only
              </label>
            </div>
          </div>

          {showInstructions && (
            <div className="mt-3 space-y-2">
              {comments.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <strong>Re-review:</strong> This will generate a fresh review of the current code, replacing existing comments.
                </div>
              )}
              <textarea
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="Optional: Add specific instructions for the review (e.g., focus on security, check for memory leaks, etc.)"
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateReview}
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {comments.length > 0 ? 'Re-reviewing...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {comments.length > 0 ? 'Re-review PR' : 'Generate Review'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowInstructions(false);
                    setExtraInstructions('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredComments.length > 0 ? (
            <div className="space-y-2">
              {filteredComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  isSelected={selectedCommentIds.has(comment.id)}
                  onToggleSelect={toggleCommentSelection}
                  onApprove={(id) => approveComments([id], 'current-user')}
                  onPost={(id) => postComments(pullRequestId, [id])}
                  onDelete={(id) => {
                    if (confirm('Delete this comment?')) {
                      deleteComments([id]);
                    }
                  }}
                />
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="text-center py-12 text-gray-500">
              No comments match the current filters
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No review comments yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Generate Review" to create an AI-powered code review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPanel;