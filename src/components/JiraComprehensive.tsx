import { useState, useEffect } from 'react';
import {
  CheckCircle, Circle, Clock, AlertCircle, User,
  RefreshCw, Plus, Settings, ChevronRight, Cloud, Server,
  Database, GitBranch, ArrowLeft, Filter, Eye, EyeOff, Brain, RotateCw, Layers
} from 'lucide-react';
import Select from 'react-select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import jiraService from '../services/jiraService';
import codeService from '../services/code.service';
import type { JiraAccount, JiraBoard, JiraTicket, JiraProject, CreateJiraAccountDto } from '../types/jira.types';
import { useProjectContext } from '../context/ProjectContext';
import JiraAccountModal from './jira/JiraAccountModal';
import TicketDetailsModal from './jira/TicketDetailsModal';
import { toast } from 'react-hot-toast';

const JiraComprehensive = () => {
  const { selectedProject } = useProjectContext();
  const [view, setView] = useState<'accounts' | 'projects' | 'boards' | 'tickets'>('accounts');
  const [accounts, setAccounts] = useState<JiraAccount[]>([]);
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<JiraAccount | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<JiraBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<JiraAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [analyzingTickets, setAnalyzingTickets] = useState<Set<string>>(new Set());
  const [ticketsWithNewAIComments, setTicketsWithNewAIComments] = useState<Set<string>>(new Set());
  const [checkingComments, setCheckingComments] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [showHiddenTickets, setShowHiddenTickets] = useState(false);
  const [aiFilter, setAiFilter] = useState<'all' | 'with-ai' | 'without-ai'>('all');
  const [syncMode, setSyncMode] = useState<'assigned' | 'all' | 'custom'>('assigned');
  const [customJql, setCustomJql] = useState('');
  const [ticketKeyToSync, setTicketKeyToSync] = useState('');
  const [syncingTicketKey, setSyncingTicketKey] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [selectedProject]);

  useEffect(() => {
    // Check for new AI comments when tickets are loaded
    if (tickets.length > 0) {
      checkAllTicketsForAIComments();
    }
  }, [tickets]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await jiraService.getAccounts(selectedProject?.id);
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBoards = async (accountId: string) => {
    setLoading(true);
    try {
      const data = await jiraService.getBoards(accountId);
      console.log('Loaded boards data:', data);
      setBoards(data);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async (boardId: string, includeHidden?: boolean) => {
    setLoading(true);
    try {
      const params: any = { boardId, includeHidden: includeHidden ?? showHiddenTickets };

      const response = await jiraService.getTickets(params);
      const loadedTickets = response?.tickets || [];

      // Fetch workflow status for each ticket
      const ticketsWithWorkflow = await Promise.all(
        loadedTickets.map(async (ticket) => {
          try {
            const workflow = await codeService.getWorkflowByTicketId(ticket.id);
            return {
              ...ticket,
              workflowStage: workflow?.status || 'not_started'
            };
          } catch (error) {
            // If no workflow exists, default to not_started
            return {
              ...ticket,
              workflowStage: 'not_started'
            };
          }
        })
      );

      setTickets(ticketsWithWorkflow);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const users = await jiraService.getUsers();
      setAllUsers(users);

      // If no users found locally, sync from Jira automatically
      if (users.length === 0 && selectedAccount) {
        const syncedUsers = await jiraService.syncUsersFromJira(selectedAccount.id);
        setAllUsers(syncedUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      // Try to sync from Jira as fallback
      if (selectedAccount) {
        try {
          const syncedUsers = await jiraService.syncUsersFromJira(selectedAccount.id);
          setAllUsers(syncedUsers);
        } catch (syncError) {
          console.error('Failed to sync users from Jira:', syncError);
        }
      }
    }
  };

  const handleSyncAccount = async (account: JiraAccount) => {
    setSyncing(true);
    try {
      await jiraService.syncAccount(account.id);
      await loadAccounts();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteAccount = async (account: JiraAccount) => {
    if (window.confirm(`Are you sure you want to delete the account "${account.accountName}"?`)) {
      try {
        await jiraService.deleteAccount(account.id);
        await loadAccounts();
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  const handleAccountClick = async (account: JiraAccount) => {
    setSelectedAccount(account);
    setView('boards');
    await loadBoards(account.id);
    await loadUsers(); // Load all users when account is selected
  };

  const handleBoardClick = (board: JiraBoard) => {
    setSelectedBoard(board);
    setView('tickets');
    loadTickets(board.id);
  };

  const handleViewTicketDetails = (ticket: JiraTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  const handleToggleHidden = async (ticket: JiraTicket) => {
    try {
      await jiraService.toggleHiddenTicket(ticket.id);
      // Update the ticket in the local state
      setTickets(prev => prev.map(t =>
        t.id === ticket.id ? {...t, isHidden: !t.isHidden} : t
      ));
      toast.success(ticket.isHidden ? 'Ticket unhidden' : 'Ticket hidden');
    } catch (error) {
      console.error('Failed to toggle ticket visibility:', error);
      toast.error('Failed to toggle ticket visibility');
    }
  };

  const handlePipelineView = (ticket: JiraTicket) => {
    // Open pipeline page in a new tab with ticket data stored in sessionStorage
    const pipelineUrl = `/pipeline/${ticket.id}`;

    // Store the ticket and project data in sessionStorage for the new tab
    sessionStorage.setItem(`pipeline-${ticket.id}`, JSON.stringify({ ticket, selectedProject }));

    // Open in new tab
    window.open(pipelineUrl, '_blank');
  };

  const checkAllTicketsForAIComments = async () => {
    try {
      const ticketIds = tickets.map(t => t.id);
      const results = await codeService.checkForNewAIComments(ticketIds);

      const ticketsWithComments = new Set<string>();
      Object.entries(results).forEach(([ticketId, hasNewComment]) => {
        if (hasNewComment) {
          const ticket = tickets.find(t => t.id === ticketId);
          if (ticket) {
            ticketsWithComments.add(ticket.id);
          }
        }
      });

      setTicketsWithNewAIComments(ticketsWithComments);
    } catch (error) {
      console.error('Failed to check for AI comments:', error);
    }
  };

  const checkSingleTicketForAIComments = async (ticket: JiraTicket) => {
    setCheckingComments(prev => new Set(prev).add(ticket.id));

    try {
      const results = await codeService.checkForNewAIComments([ticket.id]);

      if (results[ticket.id]) {
        setTicketsWithNewAIComments(prev => new Set(prev).add(ticket.id));
        toast.success(`New AI analysis available for ${ticket.key}`);
      } else {
        setTicketsWithNewAIComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(ticket.id);
          return newSet;
        });
        toast(`No new AI comments for ${ticket.key}`, {
          icon: 'ℹ️',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to check ticket comments:', error);
      toast.error('Failed to check for updates');
    } finally {
      setCheckingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticket.id);
        return newSet;
      });
    }
  };

  const handleAnalyzeTicket = async (ticket: JiraTicket) => {
    if (!selectedProject?.id) {
      toast.error('Please select a project first');
      return;
    }

    const ticketKey = ticket.key;

    // Mark ticket as being analyzed
    setAnalyzingTickets(prev => new Set(prev).add(ticket.id));

    const toastId = toast.loading(`Starting analysis for ${ticketKey}...`);

    try {
      const result = await codeService.createPreliminaryAnalysis(
        selectedProject.id,
        ticket.id
      );

      toast.success(
        `Analysis started for ${ticketKey}! It will run in the background for up to 10 minutes. Click refresh to check for updates.`,
        {
          id: toastId,
          duration: 6000
        }
      );

      console.log('Analysis started:', result);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.error(`Failed to start analysis for ${ticketKey}: ${error.message || 'Unknown error'}`, {
        id: toastId,
        duration: 5000
      });
    } finally {
      // Remove from analyzing set
      setAnalyzingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticket.id);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'in review': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': case 'highest': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': case 'lowest': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkflowStageDisplay = (stage: string | undefined) => {
    if (!stage || stage === 'not_started') return 'Not Started';

    const stageMap: Record<string, string> = {
      'analysis': 'Analysis',
      'branch_generated': 'Branch',
      'worktree_created': 'Worktree',
      'development': 'Development',
      'development_complete': 'Dev Complete',
      'verifying': 'Verifying',
      'verification_complete': 'Verified',
      'verification_resolution_in_progress': 'Fixing',
      'verification_resolution_complete': 'Fixed',
      'testing_in_progress': 'Testing',
      'testing_complete': 'Tested',
      'testing_partial': 'Partial Test',
      'testing_failed': 'Test Failed',
      'testing_needs_fix': 'Needs Fix',
      'ready_for_pr': 'Ready for PR',
      'pr_created': 'PR Created',
      'in_review': 'In Review',
      'completed': 'Completed',
      'error': 'Error',
    };

    return stageMap[stage] || stage;
  };

  const getWorkflowStageColor = (stage: string | undefined) => {
    if (!stage || stage === 'not_started') {
      return 'bg-gray-100 text-gray-600 border-gray-200';
    }

    // Blue for initial stages
    if (['analysis', 'branch_generated', 'worktree_created', 'development'].includes(stage)) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }

    // Orange for verification/testing
    if (['verifying', 'testing_in_progress'].includes(stage)) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }

    // Green for completed stages
    if (['verification_complete', 'testing_complete', 'ready_for_pr', 'pr_created', 'completed'].includes(stage)) {
      return 'bg-green-100 text-green-700 border-green-200';
    }

    // Red for errors/failures
    if (['testing_failed', 'testing_needs_fix', 'error'].includes(stage)) {
      return 'bg-red-100 text-red-700 border-red-200';
    }

    // Yellow for in-progress fixes
    if (['verification_resolution_in_progress', 'development_complete'].includes(stage)) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }

    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // Get unique values for filters
  const uniqueStatuses = Array.from(new Set(tickets.map(t => t.status))).sort();
  const uniquePriorities = Array.from(new Set(tickets.map(t => t.priority).filter(Boolean))).sort();
  const uniqueStages = Array.from(new Set(tickets.map(t => t.workflowStage || 'not_started')))
    .sort((a, b) => {
      // Custom sort to put stages in logical order
      const stageOrder = ['not_started', 'analysis', 'branch_generated', 'worktree_created',
        'development', 'development_complete', 'verifying', 'verification_complete',
        'testing_in_progress', 'testing_complete', 'ready_for_pr', 'pr_created', 'completed'];
      return stageOrder.indexOf(a) - stageOrder.indexOf(b);
    });

  // Convert to react-select options
  const statusOptions = uniqueStatuses.map(status => ({ value: status, label: status }));
  const priorityOptions = uniquePriorities.map(priority => ({ value: priority!, label: priority! }));
  const stageOptions = uniqueStages.map(stage => ({
    value: stage,
    label: getWorkflowStageDisplay(stage)
  }));

  // Use all users for assignee options, not just those in current tickets
  const assigneeOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...allUsers.map(user => ({
      value: user.accountId,
      label: user.displayName || user.emailAddress || user.accountId
    }))
  ];

  // Filter tickets based on all filters
  const filteredTickets = tickets.filter(ticket => {
    // Filter out hidden tickets when showHiddenTickets is false
    if (!showHiddenTickets && ticket.isHidden) {
      return false;
    }

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(ticket.status);
    const matchesPriority = priorityFilter.length === 0 || (ticket.priority && priorityFilter.includes(ticket.priority));
    const matchesAssignee = assigneeFilter.length === 0 ||
      (assigneeFilter.includes('unassigned') && !ticket.assignee) ||
      (ticket.assignee && assigneeFilter.includes(ticket.assignee.accountId));
    const matchesStage = stageFilter.length === 0 || stageFilter.includes(ticket.workflowStage || 'not_started');
    const matchesSearch = searchQuery === '' ||
      ticket.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAI = aiFilter === 'all' ||
      (aiFilter === 'with-ai' && ticketsWithNewAIComments.has(ticket.id)) ||
      (aiFilter === 'without-ai' && !ticketsWithNewAIComments.has(ticket.id));
    return matchesStatus && matchesPriority && matchesAssignee && matchesStage && matchesSearch && matchesAI;
  });

  const stats = {
    totalAccounts: accounts?.length || 0,
    activeAccounts: accounts?.filter(a => a.isActive)?.length || 0,
    totalBoards: boards?.length || 0,
    totalTickets: tickets?.length || 0,
    openTickets: tickets?.filter(t => t.status !== 'Done' && t.status !== 'Closed')?.length || 0,
    linkedPRs: tickets?.filter(t => t.pullRequests && t.pullRequests.length > 0)?.length || 0
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jira Management</h1>
          <p className="text-gray-600 mt-2">
            {view === 'accounts' && 'Manage your Jira accounts and integrations'}
            {view === 'boards' && `Boards for ${selectedAccount?.accountName}`}
            {view === 'tickets' && `Tickets in ${selectedBoard?.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          {view !== 'accounts' && (
            <Button
              variant="outline"
              onClick={() => {
                if (view === 'tickets') {
                  setView('boards');
                } else {
                  setView('accounts');
                  setSelectedAccount(null);
                }
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="outline" onClick={loadAccounts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {view === 'accounts' && (
            <Button onClick={() => setShowAccountForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Project Indicator */}
      {selectedProject && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">Filtered by project:</span>
            <span className="font-medium text-blue-900">{selectedProject.name}</span>
            {selectedProject.jiraKey && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Jira Key: {selectedProject.jiraKey}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                <p className="text-xs text-gray-500">{stats.activeAccounts} active</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Boards</p>
                <p className="text-2xl font-bold">{stats.totalBoards}</p>
              </div>
              <Database className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold">{stats.openTickets}</p>
                <p className="text-xs text-gray-500">of {stats.totalTickets} total</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Linked PRs</p>
                <p className="text-2xl font-bold">{stats.linkedPRs}</p>
              </div>
              <GitBranch className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts View */}
      {view === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : accounts.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Jira Accounts</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first Jira account</p>
                <Button onClick={() => setShowAccountForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            accounts.map(account => {
              const isCloud = account.jiraUrl.includes('atlassian.net');
              return (
                <Card
                  key={account.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleAccountClick(account)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {isCloud ? <Cloud className="w-5 h-5 text-blue-500" /> : <Server className="w-5 h-5 text-gray-500" />}
                        <CardTitle className="text-base">{account.accountName}</CardTitle>
                      </div>
                      <Badge variant={account.isActive ? "default" : "secondary"}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>{account.email}</p>
                      <p className="text-xs truncate">{account.jiraUrl}</p>
                      {account.boards && (
                        <p className="font-medium">{account.boards.length} boards</p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSyncAccount(account);
                        }}
                        disabled={syncing}
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAccount(account);
                          setShowAccountForm(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Boards View */}
      {view === 'boards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : boards.map(board => (
            <Card
              key={board.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-base">{board.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  {board.type && <p>Type: {board.type}</p>}
                  {board.projectKey && <p>Project: {board.projectKey}</p>}
                  {board.tickets && <p>{board.tickets.length} tickets</p>}
                  {board.lastSyncedAt && (
                    <p className="text-xs">Last synced: {new Date(board.lastSyncedAt).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => handleBoardClick(board)}
                  >
                    <ChevronRight className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setSyncing(true);
                      try {
                        await jiraService.syncBoard(board.id);
                        console.log(`Synced board ${board.name}`);
                        // Reload tickets if this is the selected board
                        if (selectedBoard?.id === board.id) {
                          await loadTickets(board.id);
                        }
                      } catch (error) {
                        console.error('Failed to sync board:', error);
                      } finally {
                        setSyncing(false);
                      }
                    }}
                    disabled={syncing}
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tickets View */}
      {view === 'tickets' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tickets</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (selectedBoard) {
                      setSyncing(true);
                      try {
                        if (showAllTickets && selectedBoard.projectId) {
                          // Sync all tickets from the project
                          await jiraService.syncProjectTickets(selectedBoard.projectId);
                          console.log(`Syncing ALL tickets for project ${selectedBoard.projectKey}`);
                        } else {
                          // Use the new sync modes
                          const jql = syncMode === 'custom' ? customJql : undefined;
                          await jiraService.syncTickets(selectedBoard.id, undefined, syncMode, jql);

                          const modeText = syncMode === 'all' ? 'all' : syncMode === 'custom' ? 'custom query' : 'assigned';
                          console.log(`Syncing ${modeText} tickets for ${selectedBoard.name}`);
                        }
                        // Reload tickets with workflow data
                        await loadTickets(selectedBoard.id);

                        const successMsg = showAllTickets
                          ? 'Synced all project tickets'
                          : syncMode === 'all'
                            ? 'Synced all board tickets'
                            : syncMode === 'custom'
                              ? 'Synced tickets from custom query'
                              : 'Synced assigned tickets';
                        toast.success(successMsg);
                      } catch (error) {
                        console.error('Failed to sync tickets:', error);
                        toast.error('Failed to sync tickets');
                      } finally {
                        setSyncing(false);
                      }
                    }
                  }}
                  disabled={syncing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Tickets
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-gray-100' : ''}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button
                  variant={aiFilter === 'with-ai' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAiFilter(aiFilter === 'with-ai' ? 'all' : 'with-ai')}
                  className={aiFilter === 'with-ai' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  With AI
                  {ticketsWithNewAIComments.size > 0 && (
                    <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded">
                      {ticketsWithNewAIComments.size}
                    </span>
                  )}
                </Button>
                <Button
                  variant={aiFilter === 'without-ai' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAiFilter(aiFilter === 'without-ai' ? 'all' : 'without-ai')}
                  className={aiFilter === 'without-ai' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  No AI
                  {tickets.length - ticketsWithNewAIComments.size > 0 && (
                    <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded">
                      {tickets.length - ticketsWithNewAIComments.size}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="p-4 bg-gray-50 border-b">
              {/* Sync Mode Selection */}
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-3">
                  <label className="text-sm font-medium text-gray-700">Sync Mode:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSyncMode('assigned')}
                      className={`px-3 py-1 text-sm rounded ${
                        syncMode === 'assigned'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      My Tickets
                    </button>
                    <button
                      onClick={() => setSyncMode('all')}
                      className={`px-3 py-1 text-sm rounded ${
                        syncMode === 'all'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All Tickets
                    </button>
                    <button
                      onClick={() => setSyncMode('custom')}
                      className={`px-3 py-1 text-sm rounded ${
                        syncMode === 'custom'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Custom JQL
                    </button>
                  </div>
                </div>

                {/* Custom JQL Input */}
                {syncMode === 'custom' && (
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Enter JQL query (e.g., project = PROJ AND status = 'In Progress')"
                      value={customJql}
                      onChange={(e) => setCustomJql(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Pull Single Ticket */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Pull Ticket:</label>
                  <input
                    type="text"
                    placeholder="Enter ticket key (e.g., PROJ-123)"
                    value={ticketKeyToSync}
                    onChange={(e) => setTicketKeyToSync(e.target.value.toUpperCase())}
                    className="px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!ticketKeyToSync.trim()) {
                        toast.error('Please enter a ticket key');
                        return;
                      }
                      setSyncingTicketKey(true);
                      try {
                        await jiraService.syncSingleTicket(
                          ticketKeyToSync,
                          selectedProject?.id,
                          selectedBoard?.id
                        );
                        toast.success(`Successfully pulled ticket ${ticketKeyToSync}`);
                        setTicketKeyToSync('');
                        // Reload tickets to show the new one
                        if (selectedBoard) {
                          await loadTickets(selectedBoard.id);
                        }
                      } catch (error) {
                        console.error('Failed to sync ticket:', error);
                        toast.error(`Failed to pull ticket ${ticketKeyToSync}`);
                      } finally {
                        setSyncingTicketKey(false);
                      }
                    }}
                    disabled={syncingTicketKey || !ticketKeyToSync.trim()}
                  >
                    {syncingTicketKey ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Pull'
                    )}
                  </Button>
                </div>
              </div>

              {/* Toggle for All/Board tickets */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Ticket Scope:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAllTickets(false)}
                      className={`px-3 py-1 text-sm rounded ${
                        !showAllTickets
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Board Tickets (Sprint)
                    </button>
                    <button
                      onClick={() => setShowAllTickets(true)}
                      className={`px-3 py-1 text-sm rounded ${
                        showAllTickets
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      All Project Tickets
                    </button>
                  </div>
                </div>
                {showAllTickets && (
                  <span className="text-sm text-amber-600">
                    ⚠️ Sync required to load all project tickets
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <Select
                    isMulti
                    options={statusOptions}
                    value={statusOptions.filter(opt => statusFilter.includes(opt.value))}
                    onChange={(selected) => setStatusFilter(selected.map(s => s.value))}
                    placeholder="Select statuses..."
                    className="text-sm"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({...base, minHeight: '36px', borderColor: '#d1d5db'}),
                      multiValue: (base) => ({...base, backgroundColor: '#e5e7eb'})
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                  <Select
                    isMulti
                    options={priorityOptions}
                    value={priorityOptions.filter(opt => priorityFilter.includes(opt.value))}
                    onChange={(selected) => setPriorityFilter(selected.map(s => s.value))}
                    placeholder="Select priorities..."
                    className="text-sm"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({...base, minHeight: '36px', borderColor: '#d1d5db'}),
                      multiValue: (base) => ({...base, backgroundColor: '#e5e7eb'})
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Assignee</label>
                  <Select
                    isMulti
                    options={assigneeOptions}
                    value={assigneeOptions.filter(opt => assigneeFilter.includes(opt.value))}
                    onChange={(selected) => setAssigneeFilter(selected.map(s => s.value))}
                    placeholder="Select assignees..."
                    className="text-sm"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({...base, minHeight: '36px', borderColor: '#d1d5db'}),
                      multiValue: (base) => ({...base, backgroundColor: '#e5e7eb'})
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Stage</label>
                  <Select
                    isMulti
                    options={stageOptions}
                    value={stageOptions.filter(opt => stageFilter.includes(opt.value))}
                    onChange={(selected) => setStageFilter(selected.map(s => s.value))}
                    placeholder="Select stages..."
                    className="text-sm"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({...base, minHeight: '36px', borderColor: '#d1d5db'}),
                      multiValue: (base) => ({...base, backgroundColor: '#e5e7eb'})
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                  <input
                    type="text"
                    placeholder="Search by key or summary..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredTickets.length}</span> of {tickets.length} {showAllTickets ? 'project' : 'board'} tickets
                  {(statusFilter.length > 0 || priorityFilter.length > 0 || assigneeFilter.length > 0 || stageFilter.length > 0 || searchQuery || aiFilter !== 'all') && (
                    <span className="ml-2">
                      ({statusFilter.length > 0 && `${statusFilter.length} status${statusFilter.length > 1 ? 'es' : ''}`}
                      {priorityFilter.length > 0 && `${statusFilter.length > 0 ? ', ' : ''}${priorityFilter.length} priorit${priorityFilter.length > 1 ? 'ies' : 'y'}`}
                      {assigneeFilter.length > 0 && `${(statusFilter.length > 0 || priorityFilter.length > 0) ? ', ' : ''}${assigneeFilter.length} assignee${assigneeFilter.length > 1 ? 's' : ''}`}
                      {stageFilter.length > 0 && `${(statusFilter.length > 0 || priorityFilter.length > 0 || assigneeFilter.length > 0) ? ', ' : ''}${stageFilter.length} stage${stageFilter.length > 1 ? 's' : ''}`}
                      {searchQuery && `${(statusFilter.length > 0 || priorityFilter.length > 0 || assigneeFilter.length > 0) ? ', ' : ''}search: "${searchQuery}"`}
                      {aiFilter === 'with-ai' && `${(statusFilter.length > 0 || priorityFilter.length > 0 || assigneeFilter.length > 0 || searchQuery) ? ', ' : ''}with AI replies`}
                      {aiFilter === 'without-ai' && `${(statusFilter.length > 0 || priorityFilter.length > 0 || assigneeFilter.length > 0 || searchQuery) ? ', ' : ''}without AI replies`})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showHiddenTickets ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      const newShowHidden = !showHiddenTickets;
                      setShowHiddenTickets(newShowHidden);
                      if (selectedBoard) {
                        loadTickets(selectedBoard.id, newShowHidden);
                      }
                    }}
                  >
                    {showHiddenTickets ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                    {showHiddenTickets ? 'Hide Hidden' : 'Show Hidden'}
                    {!showHiddenTickets && tickets.filter(t => t.isHidden).length > 0 && (
                      <span className="ml-1">({tickets.filter(t => t.isHidden).length})</span>
                    )}
                  </Button>
                  {(statusFilter.length > 0 || priorityFilter.length > 0 || assigneeFilter.length > 0 || stageFilter.length > 0 || searchQuery || aiFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter([]);
                        setPriorityFilter([]);
                        setAssigneeFilter([]);
                        setStageFilter([]);
                        setSearchQuery('');
                        setAiFilter('all');
                      }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className={`hover:bg-gray-50 ${ticket.isHidden ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-blue-600">{ticket.key}</p>
                          {ticket.isHidden && (
                            <Badge variant="secondary" className="text-xs">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-900">{ticket.summary}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm">{ticket.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getWorkflowStageColor(ticket.workflowStage)}`}>
                        {getWorkflowStageDisplay(ticket.workflowStage)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.priority && (
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.assignee && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm">{ticket.assignee.displayName}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.pullRequests && ticket.pullRequests.length > 0 && (
                        <Badge variant="outline">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {ticket.pullRequests.length}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewTicketDetails(ticket)}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {ticketsWithNewAIComments.has(ticket.id) && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAnalyzeTicket(ticket)}
                          disabled={analyzingTickets.has(ticket.id)}
                          className="hover:bg-purple-50"
                        >
                          <Brain className={`w-4 h-4 mr-1 ${analyzingTickets.has(ticket.id) ? 'animate-pulse' : ''}`} />
                          {analyzingTickets.has(ticket.id) ? 'Starting...' : 'Analyze'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePipelineView(ticket)}
                          className="hover:bg-indigo-50"
                          title="View pipeline details"
                        >
                          <Layers className="w-4 h-4 mr-1" />
                          Pipeline
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => checkSingleTicketForAIComments(ticket)}
                          disabled={checkingComments.has(ticket.id)}
                          className="hover:bg-green-50"
                          title="Check for new AI comments"
                        >
                          <RotateCw className={`w-4 h-4 ${checkingComments.has(ticket.id) ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleHidden(ticket)}
                          className={`hover:bg-gray-50 ${ticket.isHidden ? 'text-gray-400' : ''}`}
                          title={ticket.isHidden ? "Unhide ticket" : "Hide ticket"}
                        >
                          {ticket.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Account Modal */}
      <JiraAccountModal
        open={showAccountForm}
        account={editingAccount}
        onClose={() => {
          setShowAccountForm(false);
          setEditingAccount(null);
        }}
        onSave={async (data) => {
          try {
            if (editingAccount) {
              await jiraService.updateAccount(editingAccount.id, data);
            } else {
              const accountData = {
                ...data,
                projectId: selectedProject?.id
              };
              await jiraService.createAccount(accountData as CreateJiraAccountDto);
            }
            await loadAccounts();
            setShowAccountForm(false);
            setEditingAccount(null);
          } catch (error) {
            console.error('Failed to save account:', error);
          }
        }}
      />

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        open={showTicketDetails}
        onClose={() => {
          setShowTicketDetails(false);
          setSelectedTicket(null);
        }}
        ticketId={selectedTicket?.id || null}
        ticketKey={selectedTicket?.key}
      />
    </div>
  );
};

export default JiraComprehensive;