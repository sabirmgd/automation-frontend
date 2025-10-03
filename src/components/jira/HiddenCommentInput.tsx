import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Bot,
  User,
  Send,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import type { AuthorType, CreateHiddenCommentDto } from '../../types/jira.types';

interface HiddenCommentInputProps {
  onSubmit: (dto: CreateHiddenCommentDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const HiddenCommentInput: React.FC<HiddenCommentInputProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [content, setContent] = useState('');
  const [authorType, setAuthorType] = useState<AuthorType>('user');
  const [authorName, setAuthorName] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;

    const dto: CreateHiddenCommentDto = {
      content: content.trim(),
      authorType,
      authorName: authorName.trim() || (authorType === 'ai' ? 'AI Assistant' : 'Team Member')
    };

    try {
      await onSubmit(dto);
      // Reset form on success
      setContent('');
      setAuthorName('');
      setAuthorType('user');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquarePlus className="w-4 h-4" />
        Add Internal Note
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your internal note here..."
        className="min-h-[120px] bg-white"
        disabled={isSubmitting}
      />

      <div className="space-y-3">
        <Label className="text-sm">Author Type</Label>
        <RadioGroup
          value={authorType}
          onValueChange={(value) => setAuthorType(value as AuthorType)}
          disabled={isSubmitting}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="user" id="user" />
            <Label
              htmlFor="user"
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              Team Member
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ai" id="ai" />
            <Label
              htmlFor="ai"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              AI Generated
            </Label>
          </div>
        </RadioGroup>
      </div>

      {authorType === 'user' && (
        <div className="space-y-2">
          <Label htmlFor="authorName" className="text-sm">
            Author Name (optional)
          </Label>
          <input
            id="authorName"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          size="sm"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adding...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Add Note
            </>
          )}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default HiddenCommentInput;