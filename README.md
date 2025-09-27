# Automation Frontend

A modern React-based automation management platform built with TypeScript, Vite, and Tailwind CSS. This application provides a comprehensive interface for managing projects, tasks, Git repositories, and Jira integrations.

## Features

### Project Management
- Create, read, update, and delete projects
- Visual project cards with progress tracking
- Project status indicators and filters
- Search and filter capabilities
- Project-specific context management

### Task Management
- Kanban board interface with drag-and-drop functionality
- Task creation with detailed forms
- Task status tracking (To Do, In Progress, Done)
- Priority levels and due date management
- Comprehensive task details view

### Git Integration
- Repository management (add, edit, delete)
- Credential management for Git operations
- Support for multiple repositories
- Secure credential storage

### Jira Integration
- Connect multiple Jira accounts
- Manage Jira credentials
- Comprehensive Jira board integration
- Issue tracking and synchronization

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS with custom components
- **UI Components:** Radix UI primitives
- **State Management:** React Context API
- **Data Fetching:** TanStack Query (React Query)
- **HTTP Client:** Axios
- **Routing:** React Router DOM
- **Form Handling:** React Hook Form with Zod validation
- **Drag & Drop:** @dnd-kit
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Backend server running (see backend repository)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sabirmgd/automation-frontend.git
cd automation-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:5000
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── tasks/           # Task management components
│   ├── projects/        # Project management components
│   ├── jira/            # Jira integration components
│   ├── modals/          # Modal dialogs
│   └── ...              # Other feature components
├── services/
│   ├── api.client.ts    # API client configuration
│   ├── projects.service.ts
│   ├── tasks.service.ts
│   ├── git.service.ts
│   └── jiraService.ts
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── context/             # React Context providers
├── pages/               # Page components
└── lib/                 # Utility functions

```

## API Integration

The frontend connects to a backend API server. Configure the API endpoint in the `.env` file:

```env
VITE_API_BASE_URL=your_backend_url_here
```

## Key Components

### Dashboard Layout
The main application layout with navigation and content areas.

### Project Management
- **ProjectCard**: Display individual project information
- **ProjectModal**: Create/edit project dialog
- **ProjectFilters**: Filter projects by status and other criteria
- **ProjectSearch**: Search functionality for projects

### Task Board
- **TaskBoard**: Kanban-style board with drag-and-drop
- **TaskCard**: Individual task display
- **TaskForm**: Create/edit task form
- **TaskDetails**: Detailed task view

### Git Management
- **GitManagement**: Main Git integration interface
- **RepositoryModal**: Add/edit repository dialog
- **CredentialModal**: Manage Git credentials

### Jira Integration
- **JiraManagement**: Main Jira integration interface
- **JiraAccountModal**: Add/edit Jira account
- **JiraAccountList**: Display connected Jira accounts

## Styling

The application uses Tailwind CSS with custom configuration. Component styling follows the shadcn/ui design system with custom theme colors and animations.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions, please open an issue in the GitHub repository.

## Related Repositories

- Backend API: [Link to backend repository when available]

---

Built with modern web technologies for efficient project automation and management.