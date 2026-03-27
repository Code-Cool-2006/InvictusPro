import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import VolunteerDashboard from "./VolunteerDashboard";
import DonorDashboard from "./DonorDashboard";
import PublicDashboard from "./PublicDashboard";
import "./App.css";

/* ── Role → route map ─────────────────────────────────── */
const ROLE_ROUTES = {
  Admin:     "/admin",
  Volunteer: "/volun",
  Donors:    "/donor",
};

/* ── Guard: redirect if not authenticated or wrong role ── */
function ProtectedRoute({ user, requiredRole, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their correct dashboard
    return <Navigate to={ROLE_ROUTES[user.role] || "/"} replace />;
  }
  return children;
}

function App() {
  // ⚡ Read localStorage synchronously on first render — no async gap
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={ROLE_ROUTES[user.role] || "/"} replace />
            : <Login setUser={setUser} />
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user} requiredRole="Admin">
            <AdminDashboard user={user} setUser={setUser} />
          </ProtectedRoute>
        }
      />

      {/* Volunteer */}
      <Route
        path="/volun"
        element={
          <ProtectedRoute user={user} requiredRole="Volunteer">
            <VolunteerDashboard user={user} setUser={setUser} />
          </ProtectedRoute>
        }
      />

      {/* Donor */}
      <Route
        path="/donor"
        element={
          <ProtectedRoute user={user} requiredRole="Donors">
            <DonorDashboard user={user} setUser={setUser} />
          </ProtectedRoute>
        }
      />

      {/* Public home — no auth required */}
      <Route path="/" element={
        user
          ? <Navigate to={ROLE_ROUTES[user.role] || "/"} replace />
          : <PublicDashboard />
      } />

      {/* Catch-all → public home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
