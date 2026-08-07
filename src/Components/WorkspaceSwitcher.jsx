import { useContext, useState } from "react";
import { WorkspaceContext } from "../Context/workspaceContextObject";

const WorkspaceSwitcher = () => {
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace, myRole } = useContext(WorkspaceContext);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createWorkspace(name.trim());
    setName("");
    setCreating(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#1e1e1e] text-sm text-gray-200 hover:bg-[#2e2e2e] transition"
      >
        <span className="flex items-center gap-2 truncate">
          <span className="truncate">{activeWorkspace?.name || "No workspace"}</span>
          {workspaces.length > 1 && (
            <span className="text-[10px] text-gray-500 bg-[#2e2e2e] px-1.5 py-0.5 rounded-full flex-shrink-0">
              +{workspaces.length - 1}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">{myRole}</span>
          <span className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-[#141414] border border-[#2e2e2e] rounded-lg shadow-lg p-1 space-y-1">
          {workspaces.map((w) => (
            <button
              key={w._id}
              onClick={() => { switchWorkspace(w); setOpen(false); }}
              className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${
                w._id === activeWorkspace?._id ? "bg-violet-600 text-white" : "text-gray-300 hover:bg-[#1e1e1e]"
              }`}
            >
              {w.name}
            </button>
          ))}

          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="w-full text-left text-sm px-3 py-2 rounded-md text-violet-400 hover:bg-[#1e1e1e] transition"
            >
              + New workspace
            </button>
          ) : (
            <div className="flex gap-1 p-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Workspace name"
                className="flex-1 bg-[#1e1e1e] text-sm text-white rounded-md px-2 py-1 outline-none border border-[#2e2e2e]"
              />
              <button onClick={handleCreate} className="text-xs px-2 bg-violet-600 rounded-md text-white">
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;