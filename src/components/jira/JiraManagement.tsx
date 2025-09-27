import { useState, useEffect } from 'react';
import {
  Users,
  RefreshCw,
  Plus,
  Settings,
  Database,
  Link2,
  AlertCircle,
  CheckCircle2,
  Clock,
  GitBranch
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import jiraService from '../../services/jiraService';
import type { JiraAccount, JiraBoard, JiraTicket } from '../../types/jira.types';
import JiraAccountList from './JiraAccountList';
import JiraBoardView from './JiraBoardView';
import JiraTicketDetails from './JiraTicketDetails';
import JiraAccountModal from './JiraAccountModal';
import { useProjectContext } from '../../context/ProjectContext';

const JiraManagement = () => {
  const { selectedProject } = useProjectContext();
  const [accounts, setAccounts] = useState<JiraAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<JiraAccount | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<JiraBoard | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<JiraAccount | null>(null);
  const [activeTab, setActiveTab] = useState('accounts');

  // Load accounts on mount and when project changes
  useEffect(() => {
    loadAccounts();
  }, [selectedProject]);

  // Load boards when account is selected
  useEffect(() => {
    if (selectedAccount) {
      loadBoards(selectedAccount.id);
    }
  }, [selectedAccount]);

  // Load tickets when board is selected
  useEffect(() => {
    if (selectedBoard) {
      loadTickets(selectedBoard.id);
    }
  }, [selectedBoard]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await jiraService.getAccounts(selectedProject?.id);
      setAccounts(data);
    } catch (error) {
      toast.error('Failed to load Jira accounts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadBoards = async (accountId: string) => {
    setLoading(true);
    try {
      const data = await jiraService.getBoards(accountId);
      setBoards(data);
    } catch (error) {
      toast.error('Failed to load boards');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async (boardId: string) => {
    setLoading(true);
    try {
      const params: any = { boardId };
      const { tickets } = await jiraService.getTickets(params);
      setTickets(tickets);
    } catch (error) {
      toast.error('Failed to load tickets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAccount = async (account: JiraAccount) => {
    setSyncing(true);
    try {
      await jiraService.syncAccount(account.id);
      toast.success(`Synced ${account.accountName} successfully`);
      await loadAccounts();
      if (selectedAccount?.id === account.id) {
        await loadBoards(account.id);
      }
    } catch (error) {
      toast.error('Failed to sync account');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteAccount = async (account: JiraAccount) => {
    if (!confirm(`Are you sure you want to delete ${account.accountName}?`)) {
      return;
    }

    try {
      await jiraService.deleteAccount(account.id);
      toast.success('Account deleted successfully');
      await loadAccounts();
      if (selectedAccount?.id === account.id) {
        setSelectedAccount(null);
        setBoards([]);
        setTickets([]);
      }
    } catch (error) {
      toast.error('Failed to delete account');
      console.error(error);
    }
  };

  const handleSaveAccount = async (data: any) => {
    try {
      if (editingAccount) {
        await jiraService.updateAccount(editingAccount.id, data);
        toast.success('Account updated successfully');
      } else {
        await jiraService.createAccount(data);
        toast.success('Account created successfully');
      }
      await loadAccounts();
      setShowAccountModal(false);
      setEditingAccount(null);
    } catch (error) {
      toast.error('Failed to save account');
      console.error(error);
    }
  };

  const stats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(a => a.isActive).length,
    totalBoards: boards.length,
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status !== 'Done' && t.status !== 'Closed').length,
    inProgressTickets: tickets.filter(t => t.status === 'In Progress').length,
    linkedPRs: tickets.filter(t => t.pullRequests && t.pullRequests.length > 0).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jira Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Jira accounts, boards, and tickets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => loadAccounts()}
            disabled={loading || syncing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAccountModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAccounts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Boards</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBoards}</div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inProgressTickets} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linked PRs</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.linkedPRs}</div>
            <p className="text-xs text-muted-foreground">
              Tickets with PRs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="boards" disabled={!selectedAccount}>
            Boards {selectedAccount && `(${selectedAccount.accountName})`}
          </TabsTrigger>
          <TabsTrigger value="tickets" disabled={!selectedBoard}>
            Tickets {selectedBoard && `(${selectedBoard.name})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <JiraAccountList
            accounts={accounts}
            loading={loading}
            syncing={syncing}
            onSelectAccount={(account) => {
              setSelectedAccount(account);
              setActiveTab('boards');
            }}
            onEditAccount={(account) => {
              setEditingAccount(account);
              setShowAccountModal(true);
            }}
            onDeleteAccount={handleDeleteAccount}
            onSyncAccount={handleSyncAccount}
          />
        </TabsContent>

        <TabsContent value="boards" className="space-y-4">
          {selectedAccount && (
            <JiraBoardView
              account={selectedAccount}
              boards={boards}
              loading={loading}
              onSelectBoard={(board) => {
                setSelectedBoard(board);
                setActiveTab('tickets');
              }}
              onBack={() => setActiveTab('accounts')}
            />
          )}
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          {selectedBoard && (
            <JiraTicketDetails
              board={selectedBoard}
              tickets={tickets}
              loading={loading}
              selectedTicket={selectedTicket}
              onSelectTicket={setSelectedTicket}
              onBack={() => setActiveTab('boards')}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Account Modal */}
      {showAccountModal && (
        <JiraAccountModal
          open={showAccountModal}
          account={editingAccount}
          onClose={() => {
            setShowAccountModal(false);
            setEditingAccount(null);
          }}
          onSave={handleSaveAccount}
        />
      )}
    </div>
  );
};

export default JiraManagement;