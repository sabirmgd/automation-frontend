import { useState, useEffect } from "react";
import {
  Terminal,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Play,
  StopCircle,
  RefreshCw,
  Copy,
  Check,
  Wrench,
  FileSearch,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5556";

interface VerificationResolutionSectionProps {
  ticketId: string;
  verificationId: string | null;
  worktreeCreated: boolean;
  verificationComplete: boolean;
  onComplete?: () => void;
}

interface ResolutionStatus {
  status: "not_started" | "context_sent" | "in_progress" | "completed";
  sessionId?: string;
  resumeCommands?: {
    cd: string;
    happy: string;
  };
  metadata?: {
    mode?: "context" | "implementation";
    startedAt?: Date;
    completedAt?: Date;
    verificationId?: string;
    resolutionNotes?: string;
    additionalInstructions?: string;
    initialResponse?: string;
  };
  verificationId: string;
  worktreePath?: string;
}

// Command copy component (reused from HappySessionSection)
const CommandCopy = ({
  command,
  label,
}: {
  command: string;
  label?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success("Command copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy command");
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
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
};

const VerificationResolutionSection = ({
  ticketId,
  verificationId,
  worktreeCreated,
  verificationComplete,
  onComplete,
}: VerificationResolutionSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus>({
    status: "not_started",
    verificationId: verificationId || "",
  });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"implementation" | "context">("context");
  const [instructions, setInstructions] = useState("");

  // Fetch resolution status
  const fetchResolutionStatus = async () => {
    if (!ticketId) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/verification/resolve/status`
      );
      setResolutionStatus(response.data);
    } catch (error: any) {
      // Handle 404 gracefully - it means no resolution session exists yet
      if (error.response?.status !== 404) {
        console.error("Failed to fetch resolution status:", error);
      }
    }
  };

  useEffect(() => {
    if (verificationComplete && ticketId) {
      fetchResolutionStatus();
    }
  }, [ticketId, verificationComplete]);

  const handleStartResolution = async () => {
    if (!worktreeCreated) {
      toast.error("Please create a worktree first");
      return;
    }

    if (!verificationComplete) {
      toast.error("Please complete verification first");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Starting resolution session...");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/verification/resolve`,
        {
          mode,
          instructions: instructions.trim() || undefined,
          verificationId: verificationId || undefined,
        }
      );

      // Update status with the response including resume commands
      const newStatus: ResolutionStatus = {
        status: "context_sent",
        sessionId: response.data.verificationResolutionSessionId,
        metadata: response.data.verificationResolutionMetadata,
        resumeCommands: response.data.resumeCommands,
        verificationId: response.data.verificationResolutionMetadata?.verificationId || verificationId || "",
      };

      setResolutionStatus(newStatus);

      toast.success(
        `Resolution context sent! Copy the commands below to continue with Happy.`,
        { id: toastId, duration: 6000 }
      );

      // Refresh status
      setTimeout(fetchResolutionStatus, 1000);
    } catch (error: any) {
      console.error("Failed to start resolution:", error);
      toast.error(
        `Failed to start resolution: ${
          error.response?.data?.message || error.message
        }`,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStopResolution = async () => {
    setLoading(true);
    const toastId = toast.loading("Stopping resolution session...");

    try {
      await axios.post(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/verification/resolve/stop`
      );

      toast.success("Resolution session stopped", { id: toastId });
      await fetchResolutionStatus();
    } catch (error: any) {
      console.error("Failed to stop resolution:", error);
      toast.error(
        `Failed to stop resolution: ${
          error.response?.data?.message || error.message
        }`,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteResolution = async () => {
    setLoading(true);
    const toastId = toast.loading("Completing resolution...");

    try {
      await axios.post(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/verification/resolve/complete`,
        {
          completionNotes: "Resolution completed successfully",
        }
      );

      toast.success("Resolution completed!", { id: toastId });
      await fetchResolutionStatus();

      // Trigger parent callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error("Failed to complete resolution:", error);
      toast.error(
        `Failed to complete resolution: ${
          error.response?.data?.message || error.message
        }`,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReVerify = async () => {
    setLoading(true);
    const toastId = toast.loading("Triggering re-verification...");

    try {
      await axios.post(
        `${API_BASE_URL}/api/workflows/ticket/${ticketId}/verification/re-verify`
      );

      toast.success("Re-verification started!", { id: toastId });

      // Trigger parent callback to refresh verification
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error("Failed to trigger re-verification:", error);
      toast.error(
        `Failed to trigger re-verification: ${
          error.response?.data?.message || error.message
        }`,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ResolutionStatus["status"]) => {
    switch (status) {
      case "not_started":
        return (
          <Badge className="bg-gray-500 text-white">Not Started</Badge>
        );
      case "context_sent":
        return (
          <Badge className="bg-blue-500 text-white">Context Sent</Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-yellow-500 text-white">In Progress</Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500 text-white">Completed</Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (!verificationComplete) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Verification Resolution
          </CardTitle>
          <div className="flex gap-2 items-center">
            {getStatusBadge(resolutionStatus.status)}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
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
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          {resolutionStatus.status === "not_started" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Resolution Mode
                </label>
                <Select
                  value={mode}
                  onValueChange={(value: "implementation" | "context") =>
                    setMode(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="context">
                      <div className="flex items-center gap-2">
                        <FileSearch className="w-4 h-4" />
                        <div>
                          <div>Context Mode</div>
                          <div className="text-xs text-gray-500">
                            Send resolution context to Happy for planning
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="implementation">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        <div>
                          <div>Implementation Mode</div>
                          <div className="text-xs text-gray-500">
                            Start fixing issues with Happy
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Resolution Instructions (Optional)
                </label>
                <Textarea
                  placeholder="Add any specific instructions for resolving the verification issues..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  className="bg-white"
                />
              </div>
            </>
          )}

          {/* Resume Commands */}
          {resolutionStatus.resumeCommands && (
            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">
                Resume Commands:
              </div>
              <CommandCopy
                command={resolutionStatus.resumeCommands.cd}
                label="Step 1: Navigate to worktree"
              />
              <CommandCopy
                command={resolutionStatus.resumeCommands.happy}
                label="Step 2: Resume Happy session"
              />
            </div>
          )}

          {/* Session Info */}
          {resolutionStatus.metadata && (
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="text-sm">
                <span className="font-medium">Mode:</span>{" "}
                <span className="capitalize">
                  {resolutionStatus.metadata.mode || "N/A"}
                </span>
              </div>
              {resolutionStatus.metadata.startedAt && (
                <div className="text-sm">
                  <span className="font-medium">Started:</span>{" "}
                  {new Date(
                    resolutionStatus.metadata.startedAt
                  ).toLocaleString()}
                </div>
              )}
              {resolutionStatus.metadata.completedAt && (
                <div className="text-sm">
                  <span className="font-medium">Completed:</span>{" "}
                  {new Date(
                    resolutionStatus.metadata.completedAt
                  ).toLocaleString()}
                </div>
              )}
              {resolutionStatus.sessionId && (
                <div className="text-sm">
                  <span className="font-medium">Session ID:</span>{" "}
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                    {resolutionStatus.sessionId}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {resolutionStatus.status === "not_started" && (
              <Button
                onClick={handleStartResolution}
                disabled={loading || !worktreeCreated}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Resolution
              </Button>
            )}

            {(resolutionStatus.status === "context_sent" ||
              resolutionStatus.status === "in_progress") && (
              <>
                <Button
                  onClick={handleStopResolution}
                  disabled={loading}
                  variant="destructive"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Session
                </Button>
                <Button
                  onClick={handleCompleteResolution}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              </>
            )}

            {resolutionStatus.status === "completed" && (
              <Button
                onClick={handleReVerify}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-verify Work
              </Button>
            )}

            <Button
              onClick={fetchResolutionStatus}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-orange-100 rounded-lg p-3 text-sm text-orange-800">
            <p className="font-semibold mb-1">How Resolution Works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Choose a mode (context for planning, implementation for fixing)</li>
              <li>Add any specific instructions for the resolution</li>
              <li>Start the resolution session</li>
              <li>Copy and run the commands in your terminal</li>
              <li>Work with Happy to resolve the verification issues</li>
              <li>Mark complete when done and re-verify</li>
            </ol>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default VerificationResolutionSection;