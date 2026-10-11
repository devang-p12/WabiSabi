import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Workspace from "@/pages/Workspace";
import AuthGuard from "./components/auth/AuthGaurd";
import Board from "./pages/Board";
import NotificationToastAlert from "./components/notifications/NotificationToastAlert";
import CommandPalette from "./components/command/CommandPalette";

import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Today from "./pages/Today";
import PagesPage from "./pages/PagesPage";
import DocumentsPage from "./pages/DocumentsPage";
import KnowledgeSearchPage from "./pages/KnowledgeSearchPage";
import AIToolAssistantPage from "./pages/AIToolAssistantPage";

function App() {
    return (
        <BrowserRouter>
            <CommandPalette />
            <NotificationToastAlert />
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route element={<AuthGuard />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/today" element={<Today />} />
                    <Route path="/workspaces/:workspaceId" element={<Workspace />} />
                    <Route path="/workspaces/:workspaceId/today" element={<Today />} />
                    <Route path="/workspaces/:workspaceId/boards/:boardId" element={<Board />} />
                    <Route path="/workspaces/:workspaceId/projects" element={<Projects />} />
                    <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectDetail />} />
                    <Route path="/workspaces/:workspaceId/pages" element={<PagesPage />} />
                    <Route path="/workspaces/:workspaceId/pages/:pageId" element={<PagesPage />} />
                    <Route path="/workspaces/:workspaceId/documents" element={<DocumentsPage />} />
                    <Route path="/workspaces/:workspaceId/knowledge" element={<KnowledgeSearchPage />} />
                    <Route path="/workspaces/:workspaceId/ai-assistant" element={<AIToolAssistantPage />} />
                </Route>

                {/* Fallbacks */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;