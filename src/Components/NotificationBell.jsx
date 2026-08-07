import { useState, useEffect, useContext, useCallback } from "react";
import axios from "../api/axios";
import { WorkspaceContext } from "../Context/WorkspaceContext";

const TYPE_ICON = { assigned: "📌", mentioned: "💬" };

const NotificationBell = () => {
  const { auth } = useContext(WorkspaceContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const config = { headers: { Authorization: `Bearer ${auth?.accessToken}` } };

  const fetchNotifications = useCallback(async () => {
    if (!auth?.accessToken) return;
    try {
      const res = await axios.get("/notifications", config);
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // notifications are non-critical — fail silently rather than toast-spam the whole app
    }
  }, [auth]);

  // Polling instead of websockets — simple, no extra infra, "good enough"
  // freshness for a task tool (60s), and stops the moment the tab isn't focused.
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchNotifications();
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`, {}, config);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch("/notifications/read-all", {}, config);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleDelete = async (id, wasUnread) => {
    try {
      await axios.delete(`/notifications/${id}`, config);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleClearAll = async () => {
    try {
      await axios.delete("/notifications", config);
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative text-gray-400 hover:text-white transition p-2"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-[#141414] border border-[#2e2e2e] rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
              <span className="text-sm font-medium text-gray-200">Notifications</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-violet-400 hover:underline">
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={handleClearAll} className="text-xs text-gray-500 hover:text-red-400 hover:underline">
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`w-full text-left px-4 py-3 border-b border-[#1e1e1e] hover:bg-[#1e1e1e] transition flex items-start gap-2 ${
                    !n.read ? "bg-violet-600/5" : ""
                  }`}
                >
                  <button
                    onClick={() => !n.read && handleMarkRead(n._id)}
                    className="flex items-start gap-2 flex-1 min-w-0 text-left"
                  >
                    <span className="text-sm flex-shrink-0">{TYPE_ICON[n.type] || "🔔"}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-200">
                        <span className="font-medium">{n.fromUser?.name || "Someone"}</span> {n.message}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </button>
                  {!n.read && <span className="w-1.5 h-1.5 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />}
                  <button
                    onClick={() => handleDelete(n._id, !n.read)}
                    aria-label="Delete notification"
                    className="text-gray-600 hover:text-red-400 text-xs flex-shrink-0 px-1"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;