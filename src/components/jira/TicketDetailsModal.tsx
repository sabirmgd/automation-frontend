import React, { useState, useEffect } from 'react';
import {
  X, User, Calendar, Tag, AlertCircle, Paperclip, MessageCircle,
  Clock, ChevronDown, ChevronUp, Edit2, Save, XCircle, Plus, Lock, RefreshCw, Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import Skeleton from '../ui/skeleton';
import { Textarea } from '../ui/textarea';
import jiraService from '../../services/jiraService';
import AttachmentCard from './AttachmentCard';
import ImagePreviewModal from './ImagePreviewModal';
import CommentTabs from './CommentTabs';
import HiddenCommentsList from './HiddenCommentsList';
import HiddenCommentInput from './HiddenCommentInput';
import type { HiddenComment, CreateHiddenCommentDto } from '../../types/jira.types';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import * as J2M from 'jira2md';

interface TicketDetailsModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
  ticketKey?: string;
}

interface TicketDetails {
  id: string;
  key: string;
  summary: string;
  description?: string;
  renderedDescription?: string;
  issueType: string;
  status: string;
  priority?: string;
  assignee?: {
    accountId: string;
    displayName: string;
    avatarUrl?: string;
  };
  reporter?: {
    accountId: string;
    displayName: string;
    avatarUrl?: string;
  };
  labels?: string[];
  components?: string[];
  comments: Array<{
    id: string;
    author: {
      accountId: string;
      displayName: string;
      avatarUrl?: string;
    };
    body: string;
    renderedBody?: string;
    created: Date;
    updated: Date;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    content: string;
    thumbnail?: string;
    author: {
      accountId: string;
      displayName: string;
    };
    created: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
  open,
  onClose,
  ticketId,
  ticketKey
}) => {
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [showAllComments, setShowAllComments] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [hiddenComments, setHiddenComments] = useState<HiddenComment[]>([]);
  const [isLoadingHidden, setIsLoadingHidden] = useState(false);
  const [activeCommentTab, setActiveCommentTab] = useState<string>('jira');
  const [showHiddenCommentInput, setShowHiddenCommentInput] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  useEffect(() => {
    if (open && ticketId) {
      fetchTicketDetails();
      fetchHiddenComments();
    }
  }, [open, ticketId]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;

    setLoading(true);
    setError(null);
    try {
      const details = await jiraService.getTicketDetails(ticketId);
      setTicketDetails(details);
      setEditedDescription(details.description || '');
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHiddenComments = async () => {
    if (!ticketId) return;

    setIsLoadingHidden(true);
    try {
      const comments = await jiraService.getHiddenComments(ticketId);
      setHiddenComments(comments);
    } catch (error) {
      console.error('Failed to fetch hidden comments:', error);
    } finally {
      setIsLoadingHidden(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!ticketId || !ticketDetails) return;

    setIsSaving(true);
    try {
      await jiraService.updateTicketDescription(ticketId, editedDescription);
      setTicketDetails({
        ...ticketDetails,
        description: editedDescription
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Failed to update description:', error);
      setError('Failed to update description');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedDescription(ticketDetails?.description || '');
    setIsEditingDescription(false);
    setShowMarkdownPreview(false);
  };

  const convertWikiToMarkdown = (wikiText: string): string => {
    try {
      // J2M.toM converts JIRA wiki markup to markdown
      return J2M.toM(wikiText);
    } catch (error) {
      console.error('Failed to convert JIRA wiki to markdown:', error);
      return wikiText; // Return original text if conversion fails
    }
  };

  const handleImproveDescription = async () => {
    const currentDescription = isEditingDescription ? editedDescription : (ticketDetails?.description || '');

    if (!currentDescription.trim()) {
      setError('No description to improve');
      return;
    }

    setIsImproving(true);
    try {
      const improved = await jiraService.improveTicketDescription(
        currentDescription,
        `Ticket: ${ticketDetails?.key} - ${ticketDetails?.summary}`
      );

      // Use the JIRA-formatted description if available, otherwise fall back to plain description
      setEditedDescription(improved.formattedDescription || improved.description);

      // If not in edit mode, automatically enter edit mode to show the improved version
      if (!isEditingDescription) {
        setIsEditingDescription(true);
      }
    } catch (error) {
      console.error('Failed to improve description:', error);
      setError('Failed to improve description');
    } finally {
      setIsImproving(false);
    }
  };

  const toggleComment = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticketId) return;

    setIsAddingComment(true);
    try {
      await jiraService.addTicketComment(ticketId, newComment);
      // Refresh ticket details to get the new comment
      await fetchTicketDetails();
      setNewComment('');
      setShowCommentInput(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
      setError('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAddHiddenComment = async (dto: CreateHiddenCommentDto) => {
    if (!ticketId) return;

    try {
      const newHiddenComment = await jiraService.createHiddenComment(ticketId, dto);
      setHiddenComments(prev => [newHiddenComment, ...prev]);
      setShowHiddenCommentInput(false);
    } catch (error) {
      console.error('Failed to add hidden comment:', error);
      setError('Failed to add internal note');
    }
  };

  const handleUpdateHiddenComment = async (commentId: string, content: string) => {
    try {
      const updated = await jiraService.updateHiddenComment(commentId, { content });
      setHiddenComments(prev =>
        prev.map(comment => comment.id === commentId ? updated : comment)
      );
    } catch (error) {
      console.error('Failed to update hidden comment:', error);
      setError('Failed to update internal note');
    }
  };

  const handleDeleteHiddenComment = async (commentId: string) => {
    try {
      await jiraService.deleteHiddenComment(commentId);
      setHiddenComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Failed to delete hidden comment:', error);
      setError('Failed to delete internal note');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'in review': return 'bg-yellow-100 text-yellow-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'highest': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low':
      case 'lowest': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDescription = (description: string | undefined, renderedDescription: string | undefined) => {
    if (isEditingDescription) {
      return (
        <div className="space-y-3">
          <div className="flex gap-2 mb-2">
            <Button
              size="sm"
              variant={showMarkdownPreview ? "outline" : "default"}
              onClick={() => setShowMarkdownPreview(false)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant={showMarkdownPreview ? "default" : "outline"}
              onClick={() => setShowMarkdownPreview(true)}
            >
              Preview
            </Button>
          </div>
          {showMarkdownPreview ? (
            <div className="border rounded-md p-4 bg-gray-50 min-h-[200px]">
              <MarkdownRenderer content={convertWikiToMarkdown(editedDescription)} />
            </div>
          ) : (
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="min-h-[200px] w-full"
              placeholder="Enter ticket description..."
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveDescription}
              disabled={isSaving}
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    // Check if the description contains JIRA wiki markup patterns
    const hasWikiMarkup = description && (
      description.includes('h1.') ||
      description.includes('h2.') ||
      description.includes('h3.') ||
      description.includes('{code}') ||
      description.includes('{color:') ||
      description.includes('(/)')
    );

    if (renderedDescription) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderedDescription }}
        />
      );
    }

    // If it has wiki markup, convert and render as markdown
    if (description && hasWikiMarkup) {
      return <MarkdownRenderer content={convertWikiToMarkdown(description)} />;
    }

    if (description) {
      return <div className="whitespace-pre-wrap text-sm">{description}</div>;
    }
    return <p className="text-gray-500 italic">No description provided</p>;
  };

  const renderComment = (comment: any) => {
    const isExpanded = expandedComments.has(comment.id);
    const shouldTruncate = comment.body && comment.body.length > 300;

    return (
      <div key={comment.id} className="border rounded-lg p-4 hover:bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {comment.author.avatarUrl ? (
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.displayName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">{comment.author.displayName}</span>
              <span className="text-xs text-gray-500">
                {new Date(comment.created).toLocaleDateString()} at{' '}
                {new Date(comment.created).toLocaleTimeString()}
              </span>
              {comment.updated && comment.updated !== comment.created && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
            <div className="text-sm text-gray-700">
              {comment.renderedBody ? (
                <div
                  className={`prose prose-sm max-w-none ${!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}`}
                  dangerouslySetInnerHTML={{ __html: comment.renderedBody }}
                />
              ) : (
                <div className={`whitespace-pre-wrap ${!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}`}>
                  {comment.body}
                </div>
              )}
              {shouldTruncate && (
                <button
                  onClick={() => toggleComment(comment.id)}
                  className="text-blue-600 hover:text-blue-700 text-xs mt-2 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>Show less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Show more <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {ticketDetails && (
                  <>
                    <span className="text-blue-600">{ticketDetails.key}</span>
                    <span className="text-gray-600">-</span>
                    <span>{ticketDetails.summary}</span>
                  </>
                )}
                {ticketKey && !ticketDetails && <span>{ticketKey}</span>}
              </div>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-100px)] px-6">
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-60 w-full" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {ticketDetails && !loading && (
              <div className="space-y-6">
                {/* Metadata Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <Badge className={getStatusColor(ticketDetails.status)}>
                      {ticketDetails.status}
                    </Badge>
                  </div>
                  {ticketDetails.priority && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Priority</p>
                      <Badge className={getPriorityColor(ticketDetails.priority)}>
                        {ticketDetails.priority}
                      </Badge>
                    </div>
                  )}
                  {ticketDetails.assignee && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Assignee</p>
                      <div className="flex items-center gap-2">
                        {ticketDetails.assignee.avatarUrl ? (
                          <img
                            src={ticketDetails.assignee.avatarUrl}
                            alt={ticketDetails.assignee.displayName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm">{ticketDetails.assignee.displayName}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <span className="text-sm">{ticketDetails.issueType}</span>
                  </div>
                </div>

                {/* Labels and Components */}
                {(ticketDetails.labels?.length || ticketDetails.components?.length) && (
                  <div className="flex flex-wrap gap-2">
                    {ticketDetails.labels?.map(label => (
                      <Badge key={label} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {label}
                      </Badge>
                    ))}
                    {ticketDetails.components?.map(component => (
                      <Badge key={component} variant="secondary" className="text-xs">
                        {component}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Description Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Description</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleImproveDescription}
                        disabled={isImproving || isSaving}
                        title="Improve description with AI"
                      >
                        {isImproving ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Improving...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Improve
                          </>
                        )}
                      </Button>
                      {!isEditingDescription && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditingDescription(true)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  {renderDescription(ticketDetails.description, ticketDetails.renderedDescription)}
                </div>

                {/* Attachments Section */}
                {ticketDetails.attachments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Attachments ({ticketDetails.attachments.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ticketDetails.attachments.map(attachment => (
                          <AttachmentCard
                            key={attachment.id}
                            attachment={attachment}
                            ticketId={ticketId!}
                            onPreview={(url, filename) => {
                              setImagePreview(url);
                              setPreviewFilename(filename);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Comments Section */}
                <Separator />
                <div>
                      <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Comments
                      </h3>
                      <div className="flex gap-2">
                        {activeCommentTab === 'jira' && !showCommentInput && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCommentInput(true)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Comment
                          </Button>
                        )}
                        {activeCommentTab === 'hidden' && !showHiddenCommentInput && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowHiddenCommentInput(true)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Note
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Tabbed Comments Interface */}
                    <CommentTabs
                      jiraCommentCount={ticketDetails.comments?.length || 0}
                      hiddenCommentCount={hiddenComments.length}
                      activeTab={activeCommentTab}
                      onTabChange={setActiveCommentTab}
                    >
                      {{
                        jiraContent: (
                          <>
                            {/* Jira Comment Input */}
                            {showCommentInput && (
                              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                                <Textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Write a comment..."
                                  className="mb-3 min-h-[100px]"
                                  disabled={isAddingComment}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || isAddingComment}
                                  >
                                    {isAddingComment ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Adding...
                                      </>
                                    ) : (
                                      <>
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Add Comment
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShowCommentInput(false);
                                      setNewComment('');
                                    }}
                                    disabled={isAddingComment}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Jira Comments List */}
                            {ticketDetails.comments && ticketDetails.comments.length > 0 ? (
                              <div className="space-y-3">
                                {(showAllComments ? ticketDetails.comments : ticketDetails.comments.slice(0, 5))
                                  .map(renderComment)}
                                {ticketDetails.comments.length > 5 && !showAllComments && (
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowAllComments(true)}
                                  >
                                    Show all {ticketDetails.comments.length} comments
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No comments yet. Be the first to comment!
                              </p>
                            )}
                          </>
                        ),
                        hiddenContent: (
                          <>
                            {/* Hidden Comment Input */}
                            {showHiddenCommentInput && (
                              <HiddenCommentInput
                                onSubmit={handleAddHiddenComment}
                                onCancel={() => setShowHiddenCommentInput(false)}
                                isSubmitting={false}
                              />
                            )}

                            {/* Hidden Comments List */}
                            {!showHiddenCommentInput && (
                              <HiddenCommentsList
                                comments={hiddenComments}
                                onUpdateComment={handleUpdateHiddenComment}
                                onDeleteComment={handleDeleteHiddenComment}
                                isLoading={isLoadingHidden}
                              />
                            )}
                          </>
                        )
                      }}
                    </CommentTabs>
                    </div>

                {/* Timestamps */}
                <Separator />
                <div className="flex gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created: {new Date(ticketDetails.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated: {new Date(ticketDetails.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={imagePreview}
        onClose={() => {
          setImagePreview(null);
          setPreviewFilename('');
        }}
        filename={previewFilename}
      />
    </>
  );
};

export default TicketDetailsModal;