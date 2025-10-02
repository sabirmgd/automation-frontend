import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Download,
  Eye,
  Info,
  AlertCircle,
  CheckCircle,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import MermaidDiagram from './MermaidDiagram';
import diagramService, { type DiagramData } from '../../services/diagram.service';

interface DiagramPanelProps {
  pullRequestId: string;
  pullRequestTitle: string;
  pullRequestNumber?: number;
  projectId?: string | number;
  isOpen: boolean;
  onClose: () => void;
}

const DiagramPanel: React.FC<DiagramPanelProps> = ({
  pullRequestId,
  pullRequestTitle,
  pullRequestNumber,
  projectId,
  isOpen,
  onClose,
}) => {
  const [diagrams, setDiagrams] = useState<DiagramData[]>([]);
  const [currentDiagramIndex, setCurrentDiagramIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    if (isOpen && pullRequestId) {
      loadDiagrams();
    }
  }, [isOpen, pullRequestId]);

  const loadDiagrams = async () => {
    setLoading(true);
    setError(null);
    try {
      const diagramList = await diagramService.getDiagramsByPullRequest(pullRequestId, true);
      setDiagrams(diagramList);
      setCurrentDiagramIndex(0);
    } catch (err) {
      setError('Failed to load diagrams');
      console.error('Error loading diagrams:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDiagram = async (regenerate = false) => {
    setGenerating(true);
    setError(null);
    try {
      let response;

      if (pullRequestNumber && projectId) {
        // Generate from diff if we have PR number and project ID
        response = await diagramService.generateFromDiff({
          projectId,
          mrNumber: pullRequestNumber,
          extraInstructions: extraInstructions || undefined,
          regenerate
        });
      } else {
        // Generate from existing PR data
        response = await diagramService.generateDiagram({
          pullRequestId,
          extraInstructions: extraInstructions || undefined,
          regenerate
        });
      }

      if (response.success && response.diagram) {
        const newDiagrams = [response.diagram];
        if (response.supplementaryDiagrams) {
          newDiagrams.push(...response.supplementaryDiagrams);
        }
        setDiagrams(newDiagrams);
        setCurrentDiagramIndex(0);
        setShowInstructions(false);
        setExtraInstructions('');
      } else {
        setError(response.error || 'Failed to generate diagram');
      }
    } catch (err) {
      setError('Failed to generate diagram');
      console.error('Error generating diagram:', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!currentDiagram) return;

    try {
      const formattedComment = await diagramService.getFormattedComment(currentDiagram.id);
      await navigator.clipboard.writeText(formattedComment);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadDiagram = () => {
    if (!currentDiagram) return;

    const blob = new Blob([currentDiagram.mermaidCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDiagram.title.replace(/\s+/g, '_')}.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const currentDiagram = diagrams[currentDiagramIndex];
  const hasMultipleDiagrams = diagrams.length > 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black bg-opacity-50" onClick={onClose} />
      <div className="w-[900px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Architecture Diagram</h2>
            <p className="text-sm text-gray-600 mt-1">{pullRequestTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {diagrams.length === 0 && !showInstructions && (
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
                      <Eye className="w-4 h-4" />
                      Generate Diagram
                    </>
                  )}
                </button>
              )}

              {diagrams.length > 0 && (
                <>
                  <button
                    onClick={() => generateDiagram(true)}
                    disabled={generating}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={downloadDiagram}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download Mermaid file"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy formatted comment"
                  >
                    {copiedToClipboard ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {hasMultipleDiagrams && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setCurrentDiagramIndex(Math.max(0, currentDiagramIndex - 1))}
                        disabled={currentDiagramIndex === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm px-2">
                        {currentDiagramIndex + 1} / {diagrams.length}
                      </span>
                      <button
                        onClick={() => setCurrentDiagramIndex(Math.min(diagrams.length - 1, currentDiagramIndex + 1))}
                        disabled={currentDiagramIndex === diagrams.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {currentDiagram && (
              <div className="flex items-center gap-4 text-sm">
                {currentDiagram.validationStatus === 'valid' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid
                  </span>
                )}
                {currentDiagram.validationStatus === 'invalid' && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Invalid
                  </span>
                )}
                <span className="text-gray-500">
                  {currentDiagram.type}
                </span>
              </div>
            )}
          </div>

          {showInstructions && (
            <div className="mt-3 space-y-2">
              <textarea
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="Optional: Add specific instructions for the diagram (e.g., focus on data flow, show component interactions, etc.)"
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => generateDiagram(false)}
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
                      <Eye className="w-4 h-4" />
                      Generate Diagram
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="border border-red-300 bg-red-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : currentDiagram ? (
            <div className="space-y-4">
              <MermaidDiagram
                code={currentDiagram.mermaidCode}
                title={currentDiagram.title}
                description={currentDiagram.description}
                onError={(err) => console.error('Diagram render error:', err)}
              />

              {currentDiagram.focusAreas && currentDiagram.focusAreas.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Focus Areas
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {currentDiagram.focusAreas.map((area, index) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentDiagram.impactedComponents && currentDiagram.impactedComponents.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Impacted Components</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentDiagram.impactedComponents.map((component, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        {component}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentDiagram.suggestedReviewFlow && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Suggested Review Flow</h4>
                  <p className="text-sm text-blue-700">{currentDiagram.suggestedReviewFlow}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No diagram generated yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Generate Diagram" to create an architecture visualization
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramPanel;