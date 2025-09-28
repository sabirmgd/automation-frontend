import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  User,
  Calendar,
  Tag,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import type { JiraBoard, JiraTicket } from '../../types/jira.types';

interface JiraTicketDetailsProps {
  board: JiraBoard;
  tickets: JiraTicket[];
  loading: boolean;
  selectedTicket: JiraTicket | null;
  onSelectTicket: (ticket: JiraTicket | null) => void;
  onBack: () => void;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  'To Do': { icon: Circle, color: 'text-gray-500', label: 'To Do' },
  'Backlog': { icon: Circle, color: 'text-gray-500', label: 'Backlog' },
  'In Progress': { icon: Clock, color: 'text-blue-500', label: 'In Progress' },
  'In Review': { icon: AlertCircle, color: 'text-yellow-500', label: 'In Review' },
  'Done': { icon: CheckCircle2, color: 'text-green-500', label: 'Done' },
  'Closed': { icon: XCircle, color: 'text-gray-700', label: 'Closed' },
  'Blocked': { icon: XCircle, color: 'text-red-500', label: 'Blocked' }
};

const priorityConfig: Record<string, { icon: any; color: string }> = {
  'Highest': { icon: ArrowUpCircle, color: 'text-red-600' },
  'High': { icon: ArrowUpCircle, color: 'text-orange-500' },
  'Medium': { icon: MinusCircle, color: 'text-yellow-500' },
  'Low': { icon: ArrowDownCircle, color: 'text-blue-500' },
  'Lowest': { icon: ArrowDownCircle, color: 'text-gray-500' }
};

const JiraTicketDetails = ({
  board,
  tickets,
  loading,
  selectedTicket,
  onSelectTicket,
  onBack
}: JiraTicketDetailsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(tickets.map(t => t.status));
    return Array.from(statuses).sort();
  }, [tickets]);

  const uniquePriorities = useMemo(() => {
    const priorities = new Set(tickets.map(t => t.priority).filter(Boolean));
    return Array.from(priorities).sort();
  }, [tickets]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(tickets.map(t => t.issueType));
    return Array.from(types).sort();
  }, [tickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Search filter
      const matchesSearch =
        ticket.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || ticket.issueType === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, typeFilter]);

  // Group tickets by status
  const groupedTickets = useMemo(() => {
    const groups: Record<string, JiraTicket[]> = {};
    filteredTickets.forEach(ticket => {
      if (!groups[ticket.status]) {
        groups[ticket.status] = [];
      }
      groups[ticket.status].push(ticket);
    });
    return groups;
  }, [filteredTickets]);

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status] || statusConfig['To Do'];
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return null;
    const config = priorityConfig[priority];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
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
          <h2 className="text-xl font-semibold">Tickets in {board.name}</h2>
          <Badge variant="outline">{filteredTickets.length} tickets</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span>{status}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {uniquePriorities.map(priority => (
                  <SelectItem key={priority} value={priority}>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(priority)}
                      <span>{priority}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {(statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary">
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {priorityFilter !== 'all' && (
                  <Badge variant="secondary">
                    Priority: {priorityFilter}
                    <button
                      onClick={() => setPriorityFilter('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {typeFilter !== 'all' && (
                  <Badge variant="secondary">
                    Type: {typeFilter}
                    <button
                      onClick={() => setTypeFilter('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No tickets found matching your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTickets).map(([status, statusTickets]) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(status)}
                <h3 className="font-semibold">{status}</h3>
                <Badge variant="outline">{statusTickets.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onSelectTicket(ticket)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="font-mono">
                          {ticket.key}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {ticket.priority && getPriorityIcon(ticket.priority)}
                          <Badge variant="secondary" className="text-xs">
                            {ticket.issueType}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-base line-clamp-2 mt-2">
                        {ticket.summary}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {ticket.assignee && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Assignee:</span>
                            <span className="font-medium truncate">
                              {ticket.assignee.displayName}
                            </span>
                          </div>
                        )}

                        {ticket.sprintName && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Sprint:</span>
                            <span className="font-medium truncate">
                              {ticket.sprintName}
                            </span>
                          </div>
                        )}

                        {ticket.labels && ticket.labels.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {ticket.labels.slice(0, 3).map((label, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                              {ticket.labels.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{ticket.labels.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {ticket.pullRequests && ticket.pullRequests.length > 0 && (
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">PRs:</span>
                            <Badge variant="secondary" className="text-xs">
                              {ticket.pullRequests.length}
                            </Badge>
                          </div>
                        )}

                        {ticket.dueDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Due:</span>
                            <span className={`font-medium text-xs ${
                              new Date(ticket.dueDate) < new Date() ? 'text-red-500' : ''
                            }`}>
                              {new Date(ticket.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Ticket Detail Modal/Sidebar would go here */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => onSelectTicket(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="font-mono mb-2">
                    {selectedTicket.key}
                  </Badge>
                  <CardTitle>{selectedTicket.summary}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectTicket(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedTicket.status)}
                    <span className="font-medium">{selectedTicket.status}</span>
                  </div>
                </div>
                {selectedTicket.priority && (
                  <div>
                    <span className="text-sm text-muted-foreground">Priority</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getPriorityIcon(selectedTicket.priority)}
                      <span className="font-medium">{selectedTicket.priority}</span>
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Type</span>
                  <p className="font-medium mt-1">{selectedTicket.issueType}</p>
                </div>
                {selectedTicket.assignee && (
                  <div>
                    <span className="text-sm text-muted-foreground">Assignee</span>
                    <p className="font-medium mt-1">{selectedTicket.assignee.displayName}</p>
                  </div>
                )}
              </div>

              {selectedTicket.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="mt-1 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              )}

              {selectedTicket.labels && selectedTicket.labels.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Labels</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTicket.labels.map((label, index) => (
                      <Badge key={index} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.pullRequests && selectedTicket.pullRequests.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Pull Requests</span>
                  <div className="space-y-2 mt-1">
                    {selectedTicket.pullRequests.map((pr) => (
                      <div key={pr.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          <span className="font-medium">#{pr.number}</span>
                          <span className="text-sm">{pr.title}</span>
                        </div>
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JiraTicketDetails;