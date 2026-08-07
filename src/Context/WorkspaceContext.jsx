import { createContext, useState, useEffect } from "react";
import axios from "../api/axios";
import toast from "react-hot-toast";

export const WorkspaceContext = createContext();

const WorkspaceProvider = ({ children, auth }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const config = {
    headers: { Authorization: `Bearer ${auth?.accessToken}` },
  };

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/workspaces", config);
      setWorkspaces(res.data);

      // Restore last-used workspace, or default to the first one
      const savedId = localStorage.getItem("activeWorkspaceId");
      const restored = res.data.find(w => w._id === savedId);
      setActiveWorkspace(restored || res.data[0] || null);
    } catch (err) {
      toast.error("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.accessToken) fetchWorkspaces();
  }, [auth]);

  const createWorkspace = async (name) => {
    try {
      const res = await axios.post("/workspaces", { name }, config);
      setWorkspaces(prev => [...prev, res.data]);
      switchWorkspace(res.data);
      toast.success("Workspace created");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create workspace");
    }
  };

  const switchWorkspace = (workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem("activeWorkspaceId", workspace._id);
  };

  const deleteWorkspace = async (workspaceId) => {
    try {
      await axios.delete(`/workspaces/${workspaceId}`, config);
      const remaining = workspaces.filter(w => w._id !== workspaceId);
      setWorkspaces(remaining);
      if (activeWorkspace?._id === workspaceId) {
        const next = remaining[0] || null;
        setActiveWorkspace(next);
        if (next) localStorage.setItem("activeWorkspaceId", next._id);
        else localStorage.removeItem("activeWorkspaceId");
      }
      toast.success("Workspace moved to trash");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete workspace");
    }
  };

  // Current user's role inside the active workspace (used to gate UI actions)
  const myRole = activeWorkspace?.members?.find(
    m => (m.user._id || m.user) === auth?.id
  )?.role || null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        loading,
        myRole,
        fetchWorkspaces,
        createWorkspace,
        switchWorkspace,
        deleteWorkspace,
        auth,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceProvider;
