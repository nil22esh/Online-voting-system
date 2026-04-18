import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";
import { ThemeProvider } from "./context/ThemeContext";
import { TranslationProvider } from "./context/TranslationContext";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import VotingPage from "./pages/VotingPage";
import ManageElections from "./pages/admin/ManageElections";
import ManageCandidates from "./pages/admin/ManageCandidates";
import ManageUsers from "./pages/admin/ManageUsers";
import AuditLogs from "./pages/admin/AuditLogs";
import VoteVerification from "./pages/VoteVerification";
import VerifyEmail from "./pages/VerifyEmail";
import ChatBot from "./components/ChatBot";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <TranslationProvider>
          <AuthProvider>
            <SocketProvider>
              <Toast />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-vote" element={<VoteVerification />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected routes (all authenticated users) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections/:id"
              element={
                <ProtectedRoute>
                  <VotingPage />
                </ProtectedRoute>
              }
            />

            {/* Admin/Officer routes */}
            <Route
              path="/admin/elections"
              element={
                <ProtectedRoute roles={["admin", "officer"]}>
                  <ManageElections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/candidates"
              element={
                <ProtectedRoute roles={["admin", "officer"]}>
                  <ManageCandidates />
                </ProtectedRoute>
              }
            />

            {/* Admin only routes */}
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          {/* ChatBot mounted globally — visible on all authenticated pages */}
          <ChatBot />
          </SocketProvider>
        </AuthProvider>
      </TranslationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
