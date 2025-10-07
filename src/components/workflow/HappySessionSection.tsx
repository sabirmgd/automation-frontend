import { useState, useEffect } from 'react';
import {
  Terminal,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Play,
  StopCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const HAPPY_BROWSER_URL = import.meta.env.VITE_HAPPY_BROWSER_URL || 'http://localhost:5173';

interface HappySessionSectionProps {
  ticketId: string;
  branchName: string | null;
  worktreeCreated: boolean;
  analysisStatus: 'complete' | 'pending' | 'none';
}

interface HappySessionStatus {
  status: 'context_sent' | 'running' | 'stopped' | 'crashed' | 'not_started';
  sessionId?: string;
  processId?: number;
  resumeCommands?: {
    cd: string;
    happy: string;
  };
  metadata?: {
    mode?: 'implementation' | 'context';
    startedAt?: Date;
    stoppedAt?: Date;
    status?: string;
    additionalInstructions?: string;
    initialResponse?: string;
  };
}

// Command copy component
const CommandCopy = ({ command, label }: { command: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success('Command copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy command');
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-900 text-gray-100 rounded-lg p-3">
      <div className="flex-1">
        {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
        <code className="text-sm font-mono block">{command}</code>
      </div>
      <Button
        onClick={handleCopy}
        variant="ghost"
        size="sm"
        className="text-gray-400 hover:text-white"
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

const HappySessionSection = ({
  ticketId,
  branchName,
  worktreeCreated,
  analysisStatus,
}: HappySessionSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<HappySessionStatus>({
    status: 'not_started',
  });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'implementation' | 'context'>('context');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch session status
  const fetchSessionStatus = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/workflows/ticket/${ticketId}/happy/status`
      );
      setSessionStatus(response.data);
    } catch (error: any) {
      // Handle 404 gracefully - it just means no session exists yet
      if (error.response?.status === 404) {
        // This is expected when no session exists, don't log as error
        setSessionStatus({ status: 'not-started', sessionId: null });
      } else {
        // Only log actual errors
        console.error('Failed to fetch Happy session status:', error);
      }
    }
  };

  // Disable fetching session status for now since the endpoint doesn't exist
  // This prevents 404 errors in the console
  useEffect(() => {
    // TODO: Re-enable when backend endpoint is implemented
    // fetchSessionStatus();

    // For now, just set default status
    setSessionStatus({ status: 'not-started', sessionId: null });
  }, [ticketId]);

  // No polling needed anymore since we don't have actual running sessions
  useEffect(() => {
    // Clean up any existing polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [sessionStatus.status]);

  const handleStartSession = async () => {
    if (!worktreeCreated) {
      toast.error('Please create a worktree first');
      return;
    }

    if (analysisStatus === 'none') {
      toast.error('Please run an analysis first');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Sending context to Claude...');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/workflows/ticket/${ticketId}/happy/start`,
        {
          mode,
          additionalInstructions: additionalInstructions.trim() || undefined,
        }
      );

      // Update status with the response including resume commands
      const newStatus: HappySessionStatus = {
        status: 'context_sent',
        sessionId: response.data.happySessionId,
        processId: response.data.happyProcessId,
        metadata: response.data.happySessionMetadata,
        resumeCommands: response.data.resumeCommands,
      };

      setSessionStatus(newStatus);

      toast.success(
        `Context sent! Copy the commands below to start your Happy session.`,
        { id: toastId, duration: 6000 }
      );

      // Refresh status to get latest data
      setTimeout(fetchSessionStatus, 1000);
    } catch (error: any) {
      console.error('Failed to start Happy session:', error);
      toast.error(
        `Failed to start Happy session: ${error.response?.data?.message || error.message}`,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async () => {
    setLoading(true);
    const toastId = toast.loading('Stopping Happy session...');

    try {
      await axios.post(
        `${API_BASE_URL}/workflows/ticket/${ticketId}/happy/stop`
      );

      setSessionStatus({ status: 'stopped' });
      toast.success('Happy session stopped', { id: toastId });

      // Refresh status
      fetchSessionStatus();
    } catch (error: any) {
      console.error('Failed to stop Happy session:', error);
      toast.error(
        `Failed to stop Happy session: ${error.response?.data?.message || error.message}`,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = () => {
    fetchSessionStatus();
    toast.success('Status refreshed');
  };

  const getStatusBadge = () => {
    switch (sessionStatus.status) {
      case 'context_sent':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Context Sent
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Play className="w-4 h-4 mr-1" />
            Running
          </Badge>
        );
      case 'stopped':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <StopCircle className="w-4 h-4 mr-1" />
            Stopped
          </Badge>
        );
      case 'crashed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Crashed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  const canStartSession = worktreeCreated && analysisStatus !== 'none';

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Happy Session
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {sessionStatus.status === 'not_started' ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {!worktreeCreated
                    ? 'Create a worktree first to start a Happy session'
                    : analysisStatus === 'none'
                    ? 'Run analysis first to start a Happy session'
                    : 'Start a Happy session to begin development'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Happy provides AI-powered coding assistance with Claude
                </p>
              </div>

              {canStartSession && (
                <div className="space-y-4">
                  {/* Mode Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Mode</label>
                    <div className="space-y-2">
                      <label className="flex items-start space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value="context"
                          checked={mode === 'context'}
                          onChange={() => setMode('context')}
                          className="w-4 h-4 text-purple-600 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium">Context Mode</span>
                          <p className="text-xs text-gray-500">
                            Load context and wait for your instructions
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value="implementation"
                          checked={mode === 'implementation'}
                          onChange={() => setMode('implementation')}
                          className="w-4 h-4 text-purple-600 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium">Implementation Mode</span>
                          <p className="text-xs text-gray-500">
                            Start implementing immediately based on analysis
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Additional Instructions */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Additional Instructions (Optional)
                    </label>
                    <textarea
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder="Any specific instructions or context for Happy..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                    />
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={handleStartSession}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Play className={`w-4 h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                    {loading ? 'Sending Context...' : 'Send Context & Get Commands'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  {sessionStatus.sessionId && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Session ID:</span>
                      <p className="text-xs font-mono mt-1 break-all">
                        {sessionStatus.sessionId}
                      </p>
                    </div>
                  )}

                  {sessionStatus.processId && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Process ID:</span>
                        <p className="text-sm text-gray-900 mt-1">{sessionStatus.processId}</p>
                      </div>
                      {sessionStatus.metadata?.mode && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Mode:</span>
                          <p className="text-sm text-gray-900 mt-1 capitalize">
                            {sessionStatus.metadata.mode}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {sessionStatus.metadata?.startedAt && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Started:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(sessionStatus.metadata.startedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {sessionStatus.metadata?.stoppedAt && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Stopped:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(sessionStatus.metadata.stoppedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {sessionStatus.metadata?.additionalInstructions && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Instructions:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {sessionStatus.metadata.additionalInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {sessionStatus.status === 'context_sent' && (
                  <>
                    <Button
                      onClick={handleStopSession}
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Mark as Stopped
                    </Button>
                    <Button
                      onClick={handleStartSession}
                      disabled={loading || !canStartSession}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Send New Context
                    </Button>
                  </>
                )}

                {sessionStatus.status === 'stopped' && (
                  <Button
                    onClick={handleStartSession}
                    disabled={loading || !canStartSession}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start New Session
                  </Button>
                )}

                {sessionStatus.status === 'crashed' && (
                  <Button
                    onClick={handleStartSession}
                    disabled={loading || !canStartSession}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Session
                  </Button>
                )}

                <Button
                  onClick={handleRefreshStatus}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Resume Commands */}
              {sessionStatus.resumeCommands && (sessionStatus.status === 'context_sent' || sessionStatus.status === 'stopped') && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      <Terminal className="w-4 h-4 inline mr-1" />
                      Run these commands in your terminal to start Happy:
                    </p>
                  </div>

                  <div className="space-y-2">
                    <CommandCopy
                      command={sessionStatus.resumeCommands.cd}
                      label="1. Navigate to worktree:"
                    />
                    <CommandCopy
                      command={sessionStatus.resumeCommands.happy}
                      label="2. Start Happy session:"
                    />
                  </div>

                  {/* Copy both commands button */}
                  <Button
                    onClick={async () => {
                      const bothCommands = `${sessionStatus.resumeCommands!.cd} && ${sessionStatus.resumeCommands!.happy}`;
                      try {
                        await navigator.clipboard.writeText(bothCommands);
                        toast.success('Both commands copied!');
                      } catch (error) {
                        toast.error('Failed to copy commands');
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Both Commands (Combined)
                  </Button>

                  {sessionStatus.metadata?.initialResponse && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">Claude's Response:</p>
                      <p className="text-xs text-gray-800 whitespace-pre-wrap">
                        {sessionStatus.metadata.initialResponse}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default HappySessionSection;