import { CheckCircle, Circle, Clock, AlertCircle, User, Tag, Calendar } from 'lucide-react';

const Jira = () => {
  const tickets = [
    {
      id: 'PROJ-101',
      title: 'Implement user authentication',
      status: 'In Progress',
      priority: 'High',
      assignee: 'John Doe',
      dueDate: '2024-12-30',
      type: 'Feature'
    },
    {
      id: 'PROJ-102',
      title: 'Fix navigation bug on mobile',
      status: 'To Do',
      priority: 'Critical',
      assignee: 'Jane Smith',
      dueDate: '2024-12-28',
      type: 'Bug'
    },
    {
      id: 'PROJ-103',
      title: 'Update documentation',
      status: 'Done',
      priority: 'Low',
      assignee: 'Bob Johnson',
      dueDate: '2024-12-25',
      type: 'Task'
    },
    {
      id: 'PROJ-104',
      title: 'Performance optimization',
      status: 'In Review',
      priority: 'Medium',
      assignee: 'Alice Brown',
      dueDate: '2025-01-05',
      type: 'Improvement'
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'In Review': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Bug': return 'bg-red-500';
      case 'Feature': return 'bg-purple-500';
      case 'Task': return 'bg-blue-500';
      case 'Improvement': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const stats = {
    total: tickets.length,
    todo: tickets.filter(t => t.status === 'To Do').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    done: tickets.filter(t => t.status === 'Done').length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Jira Board</h1>
        <p className="text-gray-600 mt-2">Track and manage your Jira tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Tag className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">To Do</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todo}</p>
            </div>
            <Circle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Done</p>
              <p className="text-2xl font-bold text-green-600">{stats.done}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Sprint</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors">
                Filter
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Issue
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-1 h-12 rounded ${getTypeColor(ticket.type)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-600">{ticket.id}</span>
                        </div>
                        <p className="text-sm text-gray-900 mt-1">{ticket.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className="text-sm text-gray-700">{ticket.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-700">{ticket.assignee}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {ticket.dueDate}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Jira;