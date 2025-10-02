import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MermaidDiagramProps {
  code: string;
  title?: string;
  description?: string;
  className?: string;
  onError?: (error: string) => void;
}

// Initialize mermaid once globally
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  er: {
    useMaxWidth: true
  },
  sequence: {
    useMaxWidth: true
  }
});

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  code,
  title,
  description,
  className = '',
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramWrapperRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const renderIdRef = useRef<number>(0);

  useEffect(() => {
    const currentRenderId = ++renderIdRef.current;

    const renderDiagram = async () => {
      if (!containerRef.current || !code) {
        setIsRendering(false);
        return;
      }

      setIsRendering(true);
      setError(null);

      try {
        // Clean the code
        let cleanCode = code.trim();

        // Remove any markdown fences if present
        if (cleanCode.startsWith('```mermaid')) {
          cleanCode = cleanCode.slice(10);
        }
        if (cleanCode.startsWith('```')) {
          cleanCode = cleanCode.slice(3);
        }
        if (cleanCode.endsWith('```')) {
          cleanCode = cleanCode.slice(0, -3);
        }
        cleanCode = cleanCode.trim();

        // Generate unique ID for this diagram
        const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create pre element with the mermaid class
        const preElement = document.createElement('pre');
        preElement.className = 'mermaid';
        preElement.id = diagramId;
        preElement.textContent = cleanCode;

        containerRef.current.appendChild(preElement);

        // Only render if this is still the current render
        if (currentRenderId === renderIdRef.current) {
          // Use renderAsync instead of run for better compatibility
          const { svg } = await mermaid.render(diagramId + '-svg', cleanCode);

          // Only update if still the current render
          if (currentRenderId === renderIdRef.current && containerRef.current) {
            containerRef.current.innerHTML = svg;
            setIsRendering(false);
          }
        }
      } catch (err) {
        // Only update error if still the current render
        if (currentRenderId === renderIdRef.current) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to render diagram';
          console.error('Mermaid render error:', err);
          setError(errorMsg);
          setIsRendering(false);
          onError?.(errorMsg);
        }
      }
    };

    renderDiagram();
  }, [code, onError]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && diagramWrapperRef.current) {
      diagramWrapperRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else if (isFullscreen) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (error) {
    return (
      <div className={`border border-red-300 bg-red-50 rounded-lg p-4 ${className}`}>
        {title && <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>}
        <p className="text-red-600 text-sm">Failed to render diagram: {error}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-red-600 hover:text-red-700">
            Show diagram code
          </summary>
          <pre className="mt-2 p-2 bg-white rounded border border-red-200 text-xs overflow-x-auto">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={diagramWrapperRef}
      className={`border rounded-lg bg-white ${isFullscreen ? 'fixed inset-0 z-50 m-0' : 'p-4'} ${className}`}
    >
      <div className={`${isFullscreen ? 'p-4' : ''}`}>
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {description && <p className="text-gray-600 text-sm mb-3">{description}</p>}

        {/* Control buttons */}
        {!isRendering && (
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 mx-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <div className="ml-auto">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {isRendering && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div
          className={`mermaid-container ${isFullscreen ? 'h-[calc(100vh-150px)]' : ''} overflow-auto`}
          style={{ display: isRendering ? 'none' : 'block' }}
        >
          <div
            ref={containerRef}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              transition: 'transform 0.2s ease',
              width: zoomLevel > 1 ? `${100 / zoomLevel}%` : '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MermaidDiagram;