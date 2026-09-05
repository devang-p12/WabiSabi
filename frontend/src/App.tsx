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

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public routes */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Protected routes */}
                <Route element={<AuthGuard />}>

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                </Route>

                {/* Fallback */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                <Route
                    path="/workspaces/:workspaceId"
                    element={<Workspace />}
                />
                <Route
                    path="/workspaces/:workspaceId/boards/:boardId"
                    element={<Board />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;