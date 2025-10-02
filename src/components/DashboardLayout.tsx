import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  FolderOpen,
  GitBranch,
  Layers,
  CheckSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  Key
} from 'lucide-react';
import ProjectSelector from './ProjectSelector';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: 'Projects',
      icon: <FolderOpen className="w-5 h-5" />,
      path: '/projects'
    },
    {
      name: 'Credentials',
      icon: <Key className="w-5 h-5" />,
      path: '/credentials'
    },
    {
      name: 'Tasks',
      icon: <CheckSquare className="w-5 h-5" />,
      path: '/tasks'
    },
    {
      name: 'Cron Jobs',
      icon: <Clock className="w-5 h-5" />,
      path: '/crons'
    },
    {
      name: 'Jira',
      icon: <Layers className="w-5 h-5" />,
      path: '/jira'
    },
    {
      name: 'Git',
      icon: <GitBranch className="w-5 h-5" />,
      path: '/git'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white shadow-lg transition-all duration-300 ease-in-out
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            {!isCollapsed && (
              <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <span className="flex items-center">
                  {item.icon}
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">User</p>
                  <p className="text-xs text-gray-500">user@example.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-20 px-8 py-4">
          <div className="flex items-center justify-between">
            <ProjectSelector />
          </div>
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;