import { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout/Layout.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Analytics from "./Pages/Analytics.jsx";
import ActivityTimeline from "./Pages/ActivityTimeline.jsx";
import Settings from "./Pages/Settings.jsx";
import Trash from "./Pages/Trash.jsx";
import Login from "./Pages/Login.jsx";
import axios from "./api/axios";
import { refreshSession } from "./api/session";
import TaskProvider from "./Context/TaskContext";
import WorkspaceProvider from "./Context/WorkspaceContext";
import { WorkspaceContext } from "./Context/workspaceContextObject";
import { useContext } from "react";
import NotFound from "./Pages/NotFound";
import { Toaster } from "react-hot-toast";
// changed
const App = () => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  // React StrictMode runs effects twice in development. A one-time Google code
  // can only be used once, and a double /auth/refresh would trigger the
  // server's "token reuse" protection, so we make sure this runs only once.
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const params = new URLSearchParams(window.location.search);
    const googleCode = params.get("code");
    const loginCancelled = params.get("login") === "cancelled";

    // Remove ?code=... from the address bar right away
    if (googleCode || loginCancelled) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    const bootstrap = async () => {
      try {
        // Google sign-in: swap the one-time code for real tokens (the access
        // token itself is never placed in the URL). Otherwise restore the
        // session from the refresh cookie (retries on network/server errors).
        const data = googleCode
          ? (await axios.post("/auth/google/exchange", { code: googleCode })).data
          : await refreshSession();
        setAuth({ accessToken: data.accessToken, name: data.name, id: data.id });
      } catch {
        // Whether the session is gone or the server is unreachable, the login
        // screen is the only safe place to land; a retry/login restores it.
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  );

  return (
    <>
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          style: { background: '#1e1e1e', color: '#fff', border: '1px solid #2e2e2e' },
        }}
      />
      {!auth ? (
        <Login setAuth={setAuth} />
      ) : (
        <WorkspaceProvider auth={auth}>
          <AppRoutes auth={auth} setAuth={setAuth} />
        </WorkspaceProvider>
      )}
    </>
  );
};

// Separate component so it can read activeWorkspace from context
// and pass it down into TaskProvider.
const AppRoutes = ({ auth, setAuth }) => {
  const { activeWorkspace } = useContext(WorkspaceContext);

  return (
    <TaskProvider auth={auth} activeWorkspace={activeWorkspace}>
      <Routes>
        <Route path="/" element={<Layout auth={auth} setAuth={setAuth} />}>
          <Route index element={<Dashboard auth={auth} />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activity" element={<ActivityTimeline />} />
          <Route path="settings" element={<Settings />} />
          <Route path="trash" element={<Trash />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </TaskProvider>
  );
};

export default App;