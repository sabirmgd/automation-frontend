import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileText,
  ThumbsUp,
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
        toast.success('Integration testing completed!');
      }

      // Notify parent
      if (onTestsComplete && response.data) {
        onTestsComplete(response.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setTestResult(null);
      } else if (!isPolling) {
        toast.error('Failed to load test results');
      }
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
        toast('Integration tests started! This will take a few minutes...', {
          icon: '🧪',
          duration: 4000
        });

        setCustomInstructions('');
        setIsTesting(true);

        // Start polling every 3 seconds
        const interval = setInterval(() => {
          fetchTestResults(true);
        }, 3000);
        setPollingInterval(interval);

        // Initial check after 2 seconds
        setTimeout(() => fetchTestResults(true), 2000);
      } else if (response.data.status === 'already_running') {
        toast('Integration tests are already running!', { icon: '⚠️' });
        setIsTesting(true);

        // Start polling
        const interval = setInterval(() => {
          fetchTestResults(true);
        }, 3000);
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
    <div className="space-y-4">
      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Testing</CardTitle>
          <CardDescription>
            Run integration tests to verify the implementation works correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Test Status */}
          {testResult && (
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {testStatus === 'passed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : testStatus === 'partial' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : testStatus === 'failed' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                  <span className="font-medium">
                    {testResult.endpointsPassed}/{testResult.endpointsTested} tests passed
                  </span>
                </div>
                {testResult.avgResponseTimeMs && (
                  <Badge variant="secondary">
                    Avg: {testResult.avgResponseTimeMs.toFixed(0)}ms
                  </Badge>
                )}
                <Badge variant={testResult.cleanupStatus === 'success' ? 'default' : 'destructive'}>
                  Cleanup: {testResult.cleanupStatus}
                </Badge>
              </div>
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
              placeholder="e.g., Focus on authentication endpoints, skip database checks..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
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
                  Run Tests
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
        </CardContent>
      </Card>

      {/* Test Report */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Report
            </CardTitle>
            <CardDescription>
              Generated at {new Date(testResult.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <AnalysisMarkdownRenderer content={testResult.fullReport} />
            </div>

            {/* Cleanup Issues */}
            {testResult.cleanupIssues && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h4 className="font-medium text-red-800 mb-2">Cleanup Issues</h4>
                <pre className="text-sm text-red-700 whitespace-pre-wrap">
                  {testResult.cleanupIssues}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !testResult && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p className="text-sm text-gray-500">Loading test results...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !testResult && !isTesting && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <PlayCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No test results yet. Run integration tests to verify the implementation.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};