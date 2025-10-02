import React, { useState } from 'react';
import { GitPullRequest, GitMerge, Clock, User, ExternalLink, AlertCircle, FileSearch, Share2 } from 'lucide-react';
import type { GitPullRequest as GitPR } from '../../types/git.types';
import ReviewPanel from '../review/ReviewPanel';
import DiagramPanel from '../diagram/DiagramPanel';

interface PullRequestListProps {
  pullRequests: GitPR[];
  loading: boolean;
  error: string | null;
  onPullRequestClick?: (pr: GitPR) => void;
}

const PullRequestList: React.FC<PullRequestListProps> = ({
  pullRequests,
  loading,
  error,
  onPullRequestClick,
}) => {
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [selectedPRForReview, setSelectedPRForReview] = useState<GitPR | null>(null);
  const [diagramPanelOpen, setDiagramPanelOpen] = useState(false);
  const [selectedPRForDiagram, setSelectedPRForDiagram] = useState<GitPR | null>(null);

  const handleOpenReview = (pr: GitPR, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPRForReview(pr);
    setReviewPanelOpen(true);
  };

  const handleOpenDiagram = (pr: GitPR, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPRForDiagram(pr);
    setDiagramPanelOpen(true);
  };
  const getStatusColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'open':
        return 'text-green-600 bg-green-50';
      case 'closed':
        return 'text-red-600 bg-red-50';
      case 'merged':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'open':
        return <GitPullRequest className="w-4 h-4" />;
      case 'merged':
        return <GitMerge className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading pull requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (pullRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <GitPullRequest className="w-12 h-12 text-gray-400 mb-4" />
        <div className="text-gray-500">No pull requests found</div>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-200">
        {pullRequests.map((pr) => (
        <div
          key={pr.id}
          className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onPullRequestClick?.(pr)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                {getStatusIcon(pr.state)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                        {pr.title}
                        <span className="ml-2 text-gray-500">#{pr.number}</span>
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{pr.author?.username || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {pr.createdAt
                              ? new Date(pr.createdAt).toLocaleDateString()
                              : 'Unknown date'}
                          </span>
                        </div>
                        {pr.sourceBranch && pr.targetBranch && (
                          <div className="flex items-center gap-1">
                            <GitMerge className="w-3 h-3" />
                            <span>
                              {pr.sourceBranch} → {pr.targetBranch}
                            </span>
                          </div>
                        )}
                      </div>
                      {pr.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {pr.description}
                        </p>
                      )}
                      {pr.repository && (
                        <div className="mt-2 text-xs text-gray-500">
                          Repository: <span className="font-medium">{pr.repository.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(pr.state === 'open' || pr.status === 'open') && (
                        <>
                          <button
                            onClick={(e) => handleOpenDiagram(pr, e)}
                            className="px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full border border-purple-200 flex items-center gap-1"
                            title="Generate Architecture Diagram"
                          >
                            <Share2 className="w-3 h-3" />
                            Diagram
                          </button>
                          <button
                            onClick={(e) => handleOpenReview(pr, e)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full border border-blue-200 flex items-center gap-1"
                            title="Open Review Panel"
                          >
                            <FileSearch className="w-3 h-3" />
                            Review
                          </button>
                        </>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          pr.state || pr.status
                        )}`}
                      >
                        {pr.state || pr.status}
                      </span>
                      {pr.url && (
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-gray-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        ))}
      </div>

      {selectedPRForReview && (
        <ReviewPanel
          pullRequestId={selectedPRForReview.id}
          pullRequestTitle={selectedPRForReview.title}
          isOpen={reviewPanelOpen}
          onClose={() => {
            setReviewPanelOpen(false);
            setSelectedPRForReview(null);
          }}
        />
      )}

      {selectedPRForDiagram && (
        <DiagramPanel
          pullRequestId={selectedPRForDiagram.id}
          pullRequestTitle={selectedPRForDiagram.title}
          pullRequestNumber={selectedPRForDiagram.number}
          projectId={selectedPRForDiagram.repository?.remoteId || selectedPRForDiagram.repository?.name}
          isOpen={diagramPanelOpen}
          onClose={() => {
            setDiagramPanelOpen(false);
            setSelectedPRForDiagram(null);
          }}
        />
      )}
    </>
  );
};

export default PullRequestList;