import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  PlayCircle,
  Loader2,
  RefreshCw,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AnalysisMarkdownRenderer from '../ui/AnalysisMarkdownRenderer';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5556';

interface IntegrationTestResult {
  id: string;
  ticketWorkflowId: string;
  worktreeId: string;
  serverStatus: string;
  serverPort?: number;
  serverPid?: number;
  endpointsTested: number;
  endpointsPassed: number;
  endpointsFailed: number;
  avgResponseTimeMs?: number;
  dbOperationsCount: number;
  cleanupStatus: string;
  cleanupIssues?: string;
  fullReport: string;
  createdAt: Date;
}

interface IntegrationTestReportProps {
  ticketId: string;
  onTestsComplete?: (result: IntegrationTestResult) => void;
  onApproveTests?: () => void;
}

export const IntegrationTestReport: React.FC<IntegrationTestReportProps> = ({
  ticketId,
  onTestsComplete,
  onApproveTests,
}) => {
  const [testResult, setTestResult] = useState<IntegrationTestResult | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isReportExpanded, setIsReportExpanded] = useState(true);

  // Fetch latest test results
  const fetchTestResults = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }
      const response = await axios.get(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/integration-test/latest`
      );
      setTestResult(response.data);

      // Stop polling if we got results while polling
      if (isPolling && response.data) {
        setIsTesting(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        toast.success('Testing completed! Check the report for results.');
      }

      // Notify parent
      if (onTestsComplete && response.data) {
        onTestsComplete(response.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // 404 is expected when no test results exist yet, handle silently
        setTestResult(null);
        // Don't log anything for expected 404s during polling
        if (!isPolling) {
          // Only log if not polling, as 404s during initial load might be worth noting
          console.debug('No integration test results found yet');
        }
      } else if (!isPolling) {
        // Only show error toast for non-polling requests and non-404 errors
        console.error('Failed to load test results:', err);
        toast.error('Failed to load test results');
      }
      // For polling requests with non-404 errors, silently continue polling
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  // Run integration tests
  const runIntegrationTests = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/integration-test`,
        { customInstructions: customInstructions || undefined }
      );

      if (response.data.status === 'processing') {
        toast('Testing agent started! Starting server and running curl tests...', {
          icon: '🧪',
          duration: 4000
        });

        setCustomInstructions('');
        setIsTesting(true);

        // Start polling every 15 seconds
        const interval = setInterval(() => {
          fetchTestResults(true);
        }, 15000);
        setPollingInterval(interval);

        // Initial check after 2 seconds
        setTimeout(() => fetchTestResults(true), 2000);
      } else if (response.data.status === 'already_running') {
        toast('Testing agent is already running!', { icon: '⚠️' });
        setIsTesting(true);

        // Start polling every 15 seconds
        const interval = setInterval(() => {
          fetchTestResults(true);
        }, 15000);
        setPollingInterval(interval);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to start tests';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Approve tests
  const handleApproveTests = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/integration-test/approve`
      );
      toast.success('Tests approved! Ready for PR.');
      if (onApproveTests) {
        onApproveTests();
      }
    } catch (err) {
      toast.error('Failed to approve tests');
    } finally {
      setLoading(false);
    }
  };

  // Calculate test status
  const getTestStatus = () => {
    if (!testResult) return 'none';
    if (testResult.endpointsFailed === 0 && testResult.cleanupStatus === 'success') {
      return 'passed';
    } else if (testResult.endpointsPassed > 0) {
      return 'partial';
    } else {
      return 'failed';
    }
  };

  // Load on mount
  useEffect(() => {
    fetchTestResults();

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [ticketId]);

  const testStatus = getTestStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testing Agent</CardTitle>
        <CardDescription>
          Agent starts the backend and tests endpoints with curl requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Report */}
        {testResult && (
          <div>
            <div
              className="flex items-center justify-between mb-3 cursor-pointer hover:opacity-80"
              onClick={() => setIsReportExpanded(!isReportExpanded)}
            >
              <h4 className="text-sm font-medium flex items-center gap-2">
                Test Report
                {isReportExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </h4>
            </div>

            {isReportExpanded && (
              <AnalysisMarkdownRenderer
                content={testResult.fullReport}
                maxHeight="max-h-96"
              />
            )}
          </div>
        )}

        {/* Custom Instructions */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Custom Testing Instructions (optional)
          </label>
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g., Focus on specific endpoints, test error handling, check specific scenarios..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={runIntegrationTests}
            disabled={loading || isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                {testResult ? 'Rerun Tests' : 'Run Tests'}
              </>
            )}
          </Button>

          {testResult && (
            <Button
              variant="outline"
              onClick={() => fetchTestResults()}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {testStatus === 'passed' && (
            <Button
              variant="success"
              onClick={handleApproveTests}
              disabled={loading}
              className="ml-auto flex items-center gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve for PR
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading && !testResult && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-gray-500">Loading test results...</p>
          </div>
        )}

        {/* Testing State */}
        {isTesting && !testResult && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-gray-500">Testing agent is running...</p>
            <p className="text-xs text-gray-400 mt-2">This may take a few minutes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};