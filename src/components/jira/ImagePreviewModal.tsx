import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
  filename?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose, filename }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!imageUrl) return null;

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {filename && (
                <span className="text-white text-sm font-medium px-2">{filename}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
                className="text-white hover:bg-white/20"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm px-2 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
                className="text-white hover:bg-white/20"
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-white/30 mx-2" />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRotate}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="text-white hover:bg-white/20"
                disabled={zoom === 1 && rotation === 0}
              >
                Reset
              </Button>
              <div className="w-px h-6 bg-white/30 mx-2" />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-white/30 mx-2" />
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative w-full h-full flex items-center justify-center bg-black/90 pt-14">
          <div className="overflow-auto max-w-full max-h-full p-4">
            <img
              src={imageUrl}
              alt={filename || 'Preview'}
              className="max-w-none transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
              draggable={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;