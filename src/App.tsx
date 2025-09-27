import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import DashboardLayout from './components/DashboardLayout';
import Projects from './components/Projects';
import JiraComprehensive from './components/JiraComprehensive';
import GitManagement from './components/GitManagement';
import Tasks from './pages/Tasks';

function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="jira" element={<JiraComprehensive />} />
            <Route path="git" element={<GitManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}

export default App;