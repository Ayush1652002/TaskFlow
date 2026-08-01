import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout/Layout.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Analytics from "./Pages/Analytics.jsx";
import Settings from "./Pages/Settings.jsx";
import Login from "./Pages/Login.jsx";
import axios from "./api/axios";
import TaskProvider from "./Context/TaskContext";
import NotFound from "./Pages/NotFound";

const App = () => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await axios.get("/auth/refresh");
        setAuth({ accessToken: res.data.accessToken, name: res.data.name });
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

  if (!auth) return <Login setAuth={setAuth} />;

return (
  <TaskProvider auth={auth}>
    <Routes>
      <Route path="/" element={<Layout auth={auth} setAuth={setAuth} />}>
        <Route index element={<Dashboard auth={auth} />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </TaskProvider>
);
};

export default App;