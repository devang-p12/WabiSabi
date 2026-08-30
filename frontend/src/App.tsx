import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";

import AuthGuard from "./components/auth/AuthGaurd";

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

            </Routes>
        </BrowserRouter>
    );
}

export default App;