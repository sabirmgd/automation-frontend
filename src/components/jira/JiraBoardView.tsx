import { useState } from 'react';
import {
  Database,
  ChevronLeft,
  RefreshCw,
  Layers,
  Calendar,
  Users
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import type { JiraAccount, JiraBoard } from '../../types/jira.types';

interface JiraBoardViewProps {
  account: JiraAccount;
  boards: JiraBoard[];
  loading: boolean;
  onSelectBoard: (board: JiraBoard) => void;
  onBack: () => void;
}

const JiraBoardView = ({
  account,
  boards,
  loading,
  onSelectBoard,
  onBack
}: JiraBoardViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBoards = boards.filter(board =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.projectKey?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h2 className="text-xl font-semibold">Boards in {account.accountName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Boards Grid */}
      {filteredBoards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? 'No boards found matching your search'
                : 'No boards available for this account'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoards.map((board) => (
            <Card
              key={board.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectBoard(board)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Database className="h-5 w-5 text-primary" />
                  <Badge variant={board.isActive ? 'default' : 'secondary'}>
                    {board.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{board.name}</CardTitle>
                {board.projectKey && (
                  <CardDescription>Project: {board.projectKey}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {board.type && (
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{board.type}</span>
                    </div>
                  )}
                  {board.tickets && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tickets:</span>
                      <span className="font-medium">{board.tickets.length}</span>
                    </div>
                  )}
                  {board.lastSyncedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last synced:</span>
                      <span className="font-medium">
                        {new Date(board.lastSyncedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JiraBoardView;