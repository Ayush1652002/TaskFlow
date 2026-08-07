import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout/Layout.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Analytics from "./Pages/Analytics.jsx";
import ActivityTimeline from "./Pages/ActivityTimeline.jsx";
import Settings from "./Pages/Settings.jsx";
import Trash from "./Pages/Trash.jsx";
import Login from "./Pages/Login.jsx";
import axios from "./api/axios";
import TaskProvider from "./Context/TaskContext";
import WorkspaceProvider, { WorkspaceContext } from "./Context/WorkspaceContext";
import { useContext } from "react";
import NotFound from "./Pages/NotFound";
import { Toaster } from "react-hot-toast";

const App = () => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await axios.get("/auth/refresh");
        setAuth({ accessToken: res.data.accessToken, name: res.data.name, id: res.data.id });
      } catch (err) {
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };
    refresh();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  );

  if (!auth) return (
    <>
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          style: { background: '#1e1e1e', color: '#fff', border: '1px solid #2e2e2e' },
        }}
      />
      <Login setAuth={setAuth} />
    </>
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
    <WorkspaceProvider auth={auth}>
      <AppRoutes auth={auth} setAuth={setAuth} />
    </WorkspaceProvider>
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