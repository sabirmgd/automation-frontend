import { JiraAccount } from '../../types/jira.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Cloud,
  Server,
  Settings,
  Trash2,
  RefreshCw,
  ChevronRight,
  Calendar,
  Database
} from 'lucide-react';
import { format } from 'date-fns';

interface JiraAccountListProps {
  accounts: JiraAccount[];
  loading: boolean;
  syncing: boolean;
  onSelectAccount: (account: JiraAccount) => void;
  onEditAccount: (account: JiraAccount) => void;
  onDeleteAccount: (account: JiraAccount) => void;
  onSyncAccount: (account: JiraAccount) => void;
}

const JiraAccountList: React.FC<JiraAccountListProps> = ({
  accounts,
  loading,
  syncing,
  onSelectAccount,
  onEditAccount,
  onDeleteAccount,
  onSyncAccount
}) => {
  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Database className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No Jira Accounts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first Jira account to get started
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => {
        const isCloud = account.jiraUrl.includes('atlassian.net');

        return (
          <Card key={account.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {isCloud ? (
                    <Cloud className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Server className="h-5 w-5 text-gray-500" />
                  )}
                  <CardTitle className="text-base">{account.accountName}</CardTitle>
                </div>
                <Badge variant={account.isActive ? 'default' : 'secondary'}>
                  {account.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{account.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">URL:</span>
                  <span className="truncate text-xs">{account.jiraUrl}</span>
                </div>
                {account.lastSyncedAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">
                      Last synced: {format(new Date(account.lastSyncedAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                )}
                {account.boards && (
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {account.boards.length} boards
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onSelectAccount(account)}
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSyncAccount(account)}
                  disabled={syncing}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditAccount(account)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteAccount(account)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default JiraAccountList;