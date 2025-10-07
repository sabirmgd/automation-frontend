import React, { useState } from 'react';
import {
  User,
  Bot,
  Edit2,
  Trash2,
  Save,
  XCircle,
  Lock,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import type { HiddenComment } from '../../types/jira.types';

interface HiddenCommentsListProps {
  comments: HiddenComment[];
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

const HiddenCommentsList: React.FC<HiddenCommentsListProps> = ({
  comments,
  onUpdateComment,
  onDeleteComment,
  isLoading = false
}) => {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditStart = (comment: HiddenComment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };

  const handleEditSave = async (commentId: string) => {
    if (!editedContent.trim()) return;

    setIsSaving(true);
    try {
      await onUpdateComment(commentId, editedContent);
      setEditingCommentId(null);
      setEditedContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;

    setIsDeleting(true);
    try {
      await onDeleteComment(deleteCommentId);
      setDeleteCommentId(null);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No internal notes yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Internal notes are only visible to your team
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {comments.map((comment) => {
          const isEditing = editingCommentId === comment.id;
          const isAI = comment.authorType === 'ai';

          return (
            <div
              key={comment.id}
              className={`border rounded-lg p-4 ${
                isAI ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
              } hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isAI ? 'bg-purple-200' : 'bg-blue-200'
                    }`}
                  >
                    {isAI ? (
                      <Bot className="w-4 h-4 text-purple-700" />
                    ) : (
                      <User className="w-4 h-4 text-blue-700" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.authorName}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isAI
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isAI ? 'AI' : 'Internal'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(comment.createdAt)}</span>
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="text-gray-400">(edited)</span>
                        )}
                        {comment.sessionId && isAI && (
                          <span className="text-purple-500 font-mono text-[10px] ml-2">
                            Session: {comment.sessionId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditStart(comment)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteCommentId(comment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[100px] w-full"
                        placeholder="Enter your note..."
                        disabled={isSaving}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(comment.id)}
                          disabled={isSaving || !editedContent.trim()}
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
                          onClick={handleEditCancel}
                          disabled={isSaving}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 overflow-hidden">
                      {isAI ? (
                        <div className="break-words">
                          <MarkdownRenderer content={comment.content} />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">{comment.content}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Internal Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this internal note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HiddenCommentsList;