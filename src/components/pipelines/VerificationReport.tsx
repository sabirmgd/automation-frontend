import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  ThumbsUp,
  StickyNote,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import AnalysisMarkdownRenderer from '../ui/AnalysisMarkdownRenderer';
import { formatVerificationForDisplay } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5556';

interface VerificationResult {
  id: string;
  ticketWorkflowId: string;
  worktreeId: string;
  report: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface VerificationReportProps {
  ticketId: string;
  onApproveForPR?: () => void;
  onBackToDevelopment?: () => void;
  onVerificationComplete?: (verification: VerificationResult) => void;
}

export const VerificationReport: React.FC<VerificationReportProps> = ({
  ticketId,
  onApproveForPR,
  onBackToDevelopment,
  onVerificationComplete,
}) => {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch latest verification
  const fetchVerification = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }
      const response = await axios.get(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/verification`
      );
      setVerification(response.data);
      setError(null);

      // Stop polling if we got a result while polling
      if (isPolling && response.data) {
        setIsVerifying(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        toast.success('Verification completed!');
      }

      // Notify parent component when verification is loaded
      if (onVerificationComplete && response.data) {
        onVerificationComplete(response.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No verification exists yet - this is normal
        setVerification(null);
        setError(null);
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to load verification';
        setError(errorMessage);
        // Only show error toast if not polling
        if (!isPolling) {
          toast.error(errorMessage);
        }
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  // Run verification
  const runVerification = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}/api/workflows/ticket/${ticketId}/verify`;
      const payload = { customInstructions: customInstructions || undefined };

      console.log('Verification request:', { url, payload });

      const response = await axios.post(url, payload);

      // Check if it's a background processing response
      if (response.data.status === 'processing') {
        toast('Verification started! This will take a few minutes...', {
          icon: '🔍',
          duration: 4000
        });

        setCustomInstructions('');
        setIsVerifying(true);

        // Start polling for results every 3 seconds
        const interval = setInterval(() => {
          fetchVerification(true);
        }, 3000);
        setPollingInterval(interval);

        // Also do an immediate check after 2 seconds
        setTimeout(() => fetchVerification(true), 2000);
      } else if (response.data.status === 'already_running') {
        toast('Verification is already running!', { icon: '⚠️' });
        setIsVerifying(true);

        // Start polling
        const interval = setInterval(() => {
          fetchVerification(true);
        }, 3000);
        setPollingInterval(interval);
      } else {
        // Direct response (shouldn't happen with background processing, but handle it)
        setVerification(response.data);
        setCustomInstructions('');
        toast.success('Verification completed successfully!');

        if (onVerificationComplete && response.data) {
          onVerificationComplete(response.data);
        }
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add review notes
  const addReviewNotes = async () => {
    if (!verification || !reviewNotes || !reviewerName) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/workflows/verification/${verification.id}/notes`,
        {
          notes: reviewNotes,
          reviewedBy: reviewerName,
        }
      );

      setVerification(response.data);
      setReviewNotes('');
      setError(null);
      toast.success('Review notes added successfully');
    } catch (err: any) {
      const errorMessage = 'Failed to add review notes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Approve for PR
  const handleApproveForPR = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/approve-for-pr`
      );

      toast.success('Approved for PR creation!');
      if (onApproveForPR) {
        onApproveForPR();
      }
    } catch (err: any) {
      const errorMessage = 'Failed to approve for PR';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification();

    // Cleanup polling interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [ticketId]);

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Verification Actions */}
      {!verification && !isVerifying ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customInstructions">
              Custom verification instructions (optional):
            </Label>
            <Textarea
              id="customInstructions"
              placeholder="e.g., Check if the API endpoints follow REST conventions..."
              value={customInstructions}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomInstructions(e.target.value)}
              disabled={loading || isVerifying}
              rows={3}
            />
          </div>
          <Button
            onClick={runVerification}
            disabled={loading || isVerifying}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Verification...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run Verification
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* Verification Status */}
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">
              Verified on {new Date(verification.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Verification Report */}
          <Card>
            <CardHeader>
              <CardDescription>Verification Report</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalysisMarkdownRenderer
                content={formatVerificationForDisplay(verification.report)}
                maxHeight="max-h-[600px]"
              />
            </CardContent>
          </Card>

          {/* Review Notes Section */}
          {verification.reviewNotes && (
            <Card>
              <CardHeader>
                <CardDescription>Review Notes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{verification.reviewNotes}</p>
                {verification.reviewedBy && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Reviewed by {verification.reviewedBy} on{' '}
                    {new Date(verification.reviewedAt!).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add Review Notes */}
          {!verification.reviewNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Review Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Your review comments..."
                  value={reviewNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewNotes(e.target.value)}
                  disabled={loading}
                  rows={2}
                />
                <Input
                  placeholder="Your name"
                  value={reviewerName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReviewerName(e.target.value)}
                  disabled={loading}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  onClick={addReviewNotes}
                  disabled={loading || !reviewNotes || !reviewerName}
                  size="sm"
                >
                  <StickyNote className="mr-2 h-4 w-4" />
                  Add Notes
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleApproveForPR}
              disabled={loading}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              Approve for PR
            </Button>
            <Button
              variant="outline"
              onClick={onBackToDevelopment}
              disabled={loading}
            >
              Back to Development
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setVerification(null);
                setCustomInstructions('');
              }}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-run Verification
            </Button>
          </div>
        </>
      )}

      {/* Loading/Verifying Indicator */}
      {(loading || isVerifying) && !verification && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="mt-2 text-sm text-muted-foreground">
            {isVerifying
              ? 'Verification is running in the background... This may take a few minutes.'
              : 'Starting verification...'}
          </span>
          {isVerifying && (
            <span className="text-xs text-muted-foreground mt-1">
              Checking for results every 3 seconds...
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationReport;