import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import DashboardLayout from './components/DashboardLayout';
import Projects from './components/Projects';
import JiraComprehensive from './components/JiraComprehensive';
import GitManagementImproved from './components/GitManagementImproved';
import CredentialsManagement from './pages/CredentialsManagement';
import Tasks from './pages/Tasks';
import { CronsPage } from './pages/CronsPage';
import { CronDetailsPage } from './pages/CronDetailsPage';

function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<Projects />} />
            <Route path="credentials" element={<CredentialsManagement />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="crons" element={<CronsPage />} />
            <Route path="crons/:id" element={<CronDetailsPage />} />
            <Route path="jira" element={<JiraComprehensive />} />
            <Route path="git" element={<GitManagementImproved />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}

export default App;