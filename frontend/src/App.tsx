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

function App() {
    return (
        <BrowserRouter>
            <NotificationToastAlert />
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route element={<AuthGuard />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/workspaces/:workspaceId" element={<Workspace />} />
                    <Route path="/workspaces/:workspaceId/boards/:boardId" element={<Board />} />
                </Route>

                {/* Fallbacks */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;