import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationProvider } from "./contexts/NotificationContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
