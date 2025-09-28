import React, { useState } from 'react';
import {
  Download, Image as ImageIcon, FileText, AlertCircle, ZoomIn, ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';

interface AttachmentCardProps {
  attachment: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    content: string | null;
    thumbnail?: string | null;
    author?: {
      accountId: string;
      displayName: string;
    };
    created: Date;
  };
  ticketId: string;
  onPreview: (url: string, filename: string) => void;
}

const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment, ticketId, onPreview }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const isImage = attachment.mimeType?.startsWith('image/');

  // Build proxied URLs for authenticated access
  const attachmentUrl = `/api/jira/tickets/${ticketId}/attachment/${attachment.id}`;
  const downloadUrl = `/api/jira/tickets/${ticketId}/attachment/${attachment.id}/download`;

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    // Create a download link to our proxy endpoint
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isImage && !imageError) {
    return (
      <div className="border rounded-lg hover:shadow-md transition-shadow overflow-hidden bg-white">
        <div className="relative group">
          {/* Image Thumbnail Preview */}
          <div className="relative h-48 bg-gray-50 overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <img
              src={attachmentUrl}
              alt={attachment.filename}
              className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => onPreview(attachmentUrl, attachment.filename)}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />

            {/* Overlay with actions on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-white hover:bg-gray-100 text-gray-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(attachmentUrl, attachment.filename);
                  }}
                >
                  <ZoomIn className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  className="bg-white hover:bg-gray-100 text-gray-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* File info */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-gray-900" title={attachment.filename}>
                  {attachment.filename}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatFileSize(attachment.size)}
                  {attachment.author?.displayName && (
                    <span> • {attachment.author.displayName}</span>
                  )}
                </div>
              </div>
              <ImageIcon className="w-4 h-4 text-blue-500 ml-2 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-image file or error state
  return (
    <div className="border rounded-lg hover:shadow-md transition-shadow p-4 bg-white">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {imageError ? (
            <AlertCircle className="w-10 h-10 text-red-500" />
          ) : (
            <FileText className="w-10 h-10 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-gray-900" title={attachment.filename}>
            {attachment.filename}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {imageError ? 'Failed to load image' : formatFileSize(attachment.size)}
            {attachment.author?.displayName && !imageError && (
              <span> • {attachment.author.displayName}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(attachmentUrl, '_blank')}
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentCard;