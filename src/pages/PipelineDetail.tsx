import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, Brain, Clock, User, Tag,
  AlertCircle, CheckCircle2, Circle, XCircle,
  GitBranch, Calendar, ChevronUp, ChevronDown, Copy
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import TicketDetailsModal from '../components/jira/TicketDetailsModal';
import AnalysisMarkdownRenderer from '../components/ui/AnalysisMarkdownRenderer';
import WorktreeSection from '../components/workflow/WorktreeSection';
import HappySessionSection from '../components/workflow/HappySessionSection';
import VerificationResolutionSection from '../components/workflow/VerificationResolutionSection';
import { VerificationReport } from '../components/pipelines/VerificationReport';
import { IntegrationTestReport } from '../components/pipelines/IntegrationTestReport';
import jiraService from '../services/jiraService';
import codeService from '../services/code.service';
import { toast } from 'react-hot-toast';
import { checkAnalysisStatus, formatAnalysisForDisplay } from '../lib/utils';
import type { JiraTicket, HiddenComment } from '../types/jira.types';
import { useProjectContext } from '../context/ProjectContext';

const statusConfig: Record<string, { icon: any; color: string }> = {
  'To Do': { icon: Circle, color: 'text-gray-500' },
  'Backlog': { icon: Circle, color: 'text-gray-500' },
  'In Progress': { icon: Clock, color: 'text-blue-500' },
  'In Review': { icon: AlertCircle, color: 'text-yellow-500' },
  'Done': { icon: CheckCircle2, color: 'text-green-500' },
  'Closed': { icon: XCircle, color: 'text-gray-700' },
  'Blocked': { icon: XCircle, color: 'text-red-500' }
};

const PipelineDetail = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedProject: contextProject } = useProjectContext();

  // Get initial data from navigation state or sessionStorage
  const getInitialData = () => {
    let ticketData = null;
    let projectData = null;

    // First try navigation state
    if (location.state?.ticket) {
      ticketData = location.state.ticket;
    }
    if (location.state?.selectedProject) {
      projectData = location.state.selectedProject;
    }

    // If not found in navigation state, try sessionStorage (for new tab scenario)
    if ((!ticketData || !projectData) && ticketId) {
      const storedData = sessionStorage.getItem(`pipeline-${ticketId}`);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (!ticketData) {
            ticketData = parsed.ticket;
          }
          if (!projectData) {
            projectData = parsed.selectedProject;
          }
          // Clean up sessionStorage after reading both values
          sessionStorage.removeItem(`pipeline-${ticketId}`);
        } catch (error) {
          console.error('Failed to parse stored data:', error);
        }
      }
    }

    return { ticket: ticketData, project: projectData };
  };

  const initialData = getInitialData();
  const [ticket, setTicket] = useState<JiraTicket | null>(initialData.ticket);
  // Use the project from initial data, or fallback to context project
  const [selectedProject] = useState(initialData.project || contextProject);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Analysis related state
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'complete' | 'pending' | 'none'>('none');
  const [latestAnalysis, setLatestAnalysis] = useState<HiddenComment | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Branch name related state
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branchNameMetadata, setBranchNameMetadata] = useState<any>(null);
  const [generatingBranch, setGeneratingBranch] = useState(false);
  const [branchExpanded, setBranchExpanded] = useState(false);
  const [worktreeCreated, setWorktreeCreated] = useState(false);

  // Verification related state
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationExpanded, setVerificationExpanded] = useState(false);

  // Testing related state
  const [testingComplete, setTestingComplete] = useState(false);

  useEffect(() => {
    // If we don't have ticket data from navigation, fetch it
    if (!ticket && ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  useEffect(() => {
    // Fetch hidden comments when ticket is available
    if (ticket?.id) {
      fetchHiddenComments();
      fetchWorkflowData();
    }

    // Set browser title to ticket summary (cleaner than description which might have JSON)
    if (ticket) {
      // Use summary first as it's usually cleaner, then key as fallback
      const title = ticket.summary || `${ticket.key} - Pipeline`;
      // Limit title length for browser tab
      const cleanTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
      document.title = cleanTitle;
    }

    // Cleanup function to reset title when leaving the page
    return () => {
      document.title = '30x Automation'; // Reset to default title
    };
  }, [ticket?.id, ticket?.summary, ticket?.key]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      const details = await jiraService.getTicketDetails(ticketId);
      setTicket(details as JiraTicket);
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHiddenComments = async () => {
    if (!ticket?.id) return;

    setLoadingAnalysis(true);
    try {
      const comments = await jiraService.getHiddenComments(ticket.id);

      // Check analysis status
      const ticketDetails = await jiraService.getTicketDetails(ticket.id);
      const analysisResult = checkAnalysisStatus(comments, ticketDetails.comments);

      setAnalysisStatus(analysisResult.status);
      if (analysisResult.latestAnalysis) {
        setLatestAnalysis(analysisResult.latestAnalysis);
      }
    } catch (error) {
      console.error('Failed to fetch hidden comments:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchWorkflowData = async () => {
    if (!ticket?.id) return;

    try {
      const workflow = await codeService.getWorkflowByTicketId(ticket.id);
      if (workflow?.generatedBranchName) {
        setBranchName(workflow.generatedBranchName);
        setBranchNameMetadata(workflow.branchNameMetadata);
      }
      if (workflow?.worktreeId) {
        setWorktreeCreated(true);
      }
    } catch (error) {
      console.error('Failed to fetch workflow data:', error);
    }
  };

  const handleAnalyzeTicket = async () => {
    if (!ticket) {
      toast.error('Missing ticket information. Please refresh the page.');
      console.error('No ticket data available');
      return;
    }

    if (!selectedProject?.id) {
      toast.error('Missing project information. Please return to Jira page and try again.');
      console.error('No project data available:', { ticket, selectedProject });
      return;
    }

    setAnalyzing(true);
    const toastId = toast.loading(`Starting analysis for ${ticket.key}...`);

    try {
      const result = await codeService.createPreliminaryAnalysis(
        selectedProject.id,
        ticket.id
      );

      toast.success(
        `Analysis started for ${ticket.key}! It will run in the background for up to 10 minutes.`,
        {
          id: toastId,
          duration: 6000
        }
      );

      console.log('Analysis started:', result);

      // Refresh analysis after a delay
      setTimeout(() => {
        fetchHiddenComments();
      }, 5000);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.error(`Failed to start analysis for ${ticket.key}: ${error.message || 'Unknown error'}`, {
        id: toastId,
        duration: 5000
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateBranchName = async () => {
    if (!ticket || !selectedProject?.id) {
      toast.error('Missing ticket or project information');
      return;
    }

    setGeneratingBranch(true);
    const toastId = toast.loading('Generating branch name...');

    try {
      const result = await codeService.generateBranchName(
        ticket.id,
        selectedProject.id
      );

      setBranchName(result.generatedBranchName);
      setBranchNameMetadata(result.branchNameMetadata);

      toast.success(`Branch name generated: ${result.generatedBranchName}`, {
        id: toastId,
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Branch name generation failed:', error);
      toast.error(`Failed to generate branch name: ${error.message || 'Unknown error'}`, {
        id: toastId,
      });
    } finally {
      setGeneratingBranch(false);
    }
  };

  const handleCopyBranchName = () => {
    if (branchName) {
      navigator.clipboard.writeText(branchName);
      toast.success('Branch name copied to clipboard!');
    }
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status] || statusConfig['To Do'];
    const Icon = config.icon;
    return <Icon className={`h-5 w-5 ${config.color}`} />;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'highest':
      case 'critical':
        return 'border-red-500 bg-red-50 text-red-700';
      case 'high':
        return 'border-orange-500 bg-orange-50 text-orange-700';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'low':
      case 'lowest':
        return 'border-green-500 bg-green-50 text-green-700';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No ticket data available</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/jira')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jira
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/jira')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jira
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pipeline Details</h1>
            <p className="text-muted-foreground">Manage pipeline and analysis for this ticket</p>
          </div>
        </div>
      </div>

      {/* Ticket Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {ticket.key}
                </Badge>
                {ticket.priority && (
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{ticket.summary}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(ticket.status)}
              <span className="font-medium">{ticket.status}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {ticket.assignee && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Assignee:</span>
                <span className="text-sm font-medium">{ticket.assignee.displayName}</span>
              </div>
            )}
            {ticket.reporter && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Reporter:</span>
                <span className="text-sm font-medium">{ticket.reporter.displayName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Type:</span>
              <span className="text-sm font-medium">{ticket.issueType}</span>
            </div>
          </div>

          {ticket.labels && ticket.labels.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {ticket.labels.map((label, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {ticket.pullRequests && ticket.pullRequests.length > 0 && (
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pull Requests:</span>
              <Badge variant="outline">
                {ticket.pullRequests.length}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowTicketDetails(true)}
            variant="outline"
            className="hover:bg-blue-50 w-full sm:w-auto"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Ticket
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setAnalysisExpanded(!analysisExpanded)}>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Ticket Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              {loadingAnalysis ? (
                <Badge variant="outline">
                  <Clock className="w-4 h-4 mr-1 animate-spin" />
                  Loading...
                </Badge>
              ) : analysisStatus === 'complete' ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Analysis Complete
                </Badge>
              ) : analysisStatus === 'pending' ? (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="w-4 h-4 mr-1" />
                  Analysis Outdated
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  No Analysis
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setAnalysisExpanded(!analysisExpanded);
                }}
              >
                {analysisExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {analysisExpanded && (
          <CardContent>
            {loadingAnalysis ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading analysis...</span>
              </div>
            ) : analysisStatus === 'complete' && latestAnalysis ? (
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground mb-2">
                  Analysis completed at {new Date(latestAnalysis.createdAt).toLocaleString()}
                </div>
                <AnalysisMarkdownRenderer
                  content={formatAnalysisForDisplay(latestAnalysis.content)}
                  maxHeight="max-h-[600px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyzeTicket}
                    disabled={analyzing}
                    variant="outline"
                    size="sm"
                  >
                    <Brain className={`w-4 h-4 mr-2 ${analyzing ? 'animate-pulse' : ''}`} />
                    {analyzing ? 'Re-analyzing...' : 'Re-analyze'}
                  </Button>
                  <Button
                    onClick={() => fetchHiddenComments()}
                    variant="ghost"
                    size="sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                </div>
              </div>
            ) : analysisStatus === 'pending' && latestAnalysis ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    The analysis is outdated. There have been new comments since the last analysis.
                  </p>
                </div>
                <AnalysisMarkdownRenderer
                  content={formatAnalysisForDisplay(latestAnalysis.content)}
                  maxHeight="max-h-[500px]"
                  className="opacity-75"
                />
                <Button
                  onClick={handleAnalyzeTicket}
                  disabled={analyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Brain className={`w-4 h-4 mr-2 ${analyzing ? 'animate-pulse' : ''}`} />
                  {analyzing ? 'Analyzing...' : 'Update Analysis'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No analysis available for this ticket yet
                </p>
                <Button
                  onClick={handleAnalyzeTicket}
                  disabled={analyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Brain className={`w-4 h-4 mr-2 ${analyzing ? 'animate-pulse' : ''}`} />
                  {analyzing ? 'Analyzing...' : 'Analyze Ticket'}
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Branch Name Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setBranchExpanded(!branchExpanded)}>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Branch Name
            </CardTitle>
            <div className="flex items-center gap-2">
              {branchName ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Generated
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Not Generated
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setBranchExpanded(!branchExpanded);
                }}
              >
                {branchExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {branchExpanded && (
          <CardContent>
            {branchName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <code className="flex-1 font-mono text-sm">{branchName}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBranchName}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {branchNameMetadata && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {branchNameMetadata.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          branchNameMetadata.confidence === 'high'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : branchNameMetadata.confidence === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {branchNameMetadata.confidence} confidence
                      </Badge>
                    </div>
                    {branchNameMetadata.reasoning && (
                      <p className="text-xs italic mt-2">{branchNameMetadata.reasoning}</p>
                    )}
                    {branchNameMetadata.generatedAt && (
                      <p className="text-xs mt-1">
                        Generated at {new Date(branchNameMetadata.generatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleGenerateBranchName}
                  disabled={generatingBranch}
                  variant="outline"
                  size="sm"
                >
                  <GitBranch className={`w-4 h-4 mr-2 ${generatingBranch ? 'animate-pulse' : ''}`} />
                  {generatingBranch ? 'Regenerating...' : 'Regenerate Branch Name'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {analysisStatus === 'none'
                    ? 'Run analysis first to generate a branch name'
                    : analysisStatus === 'pending'
                    ? 'Analysis is outdated but you can still generate a branch name'
                    : 'No branch name generated yet'}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  A branch name will be automatically generated based on the ticket analysis
                </p>
                <Button
                  onClick={handleGenerateBranchName}
                  disabled={generatingBranch || analysisStatus === 'none'}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <GitBranch className={`w-4 h-4 mr-2 ${generatingBranch ? 'animate-pulse' : ''}`} />
                  {generatingBranch ? 'Generating...' : 'Generate Branch Name'}
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Worktree Section */}
      {ticket && (
        <WorktreeSection
          ticketId={ticket.id}
          branchName={branchName}
          analysisStatus={analysisStatus}
          onWorktreeCreated={(worktreePath) => {
            console.log('Worktree created at:', worktreePath);
            setWorktreeCreated(true);
          }}
        />
      )}

      {/* Happy Session Section */}
      {ticket && (
        <HappySessionSection
          ticketId={ticket.id}
          branchName={branchName}
          worktreeCreated={worktreeCreated}
          analysisStatus={analysisStatus}
        />
      )}

      {/* Verification Section - Only show when we have worktree, branch name, and analysis */}
      {ticket && worktreeCreated && branchName && analysisStatus === 'complete' && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setVerificationExpanded(!verificationExpanded)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Verification
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Ready for Verification
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVerificationExpanded(!verificationExpanded);
                  }}
                >
                  {verificationExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          {verificationExpanded && (
            <CardContent>
              <VerificationReport
                ticketId={ticket.id}
                onApproveForPR={() => {
                  toast.success('Approved for PR creation');
                  // Could trigger PR creation flow here
                }}
                onBackToDevelopment={() => {
                  toast('Returning to development', { icon: '📝' });
                  // Could navigate back to Happy session or refresh state
                }}
                onVerificationComplete={(verificationData) => {
                  setVerificationComplete(true);
                  if (verificationData?.id) {
                    setVerificationId(verificationData.id);
                  }
                }}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Verification Resolution Section */}
      {verificationComplete && (
        <VerificationResolutionSection
          ticketId={ticket.id}
          verificationId={verificationId}
          worktreeCreated={worktreeCreated}
          verificationComplete={verificationComplete}
          onComplete={() => {
            // Resolution complete
            toast('Verification resolution complete', { icon: '✅' });
          }}
        />
      )}

      {/* Integration Testing Section - Always visible as a pipeline stage */}
      {ticket && (
        <IntegrationTestReport
          ticketId={ticket.id}
          onTestsComplete={(result) => {
            setTestingComplete(true);
            toast.success('Integration tests completed!');
          }}
          onApproveTests={() => {
            toast.success('Tests approved! Ready for PR.');
          }}
        />
      )}

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        open={showTicketDetails}
        onClose={() => setShowTicketDetails(false)}
        ticketId={ticket.id}
        ticketKey={ticket.key}
      />
    </div>
  );
};

export default PipelineDetail;