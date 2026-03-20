import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#0f0f0f] text-white">

      {/* Mobile Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static z-20 h-full w-60 bg-[#141414] border-r border-[#1e1e1e] p-5 flex flex-col gap-8 transition-transform duration-300 ${
        menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>

        {/* Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 bg-violet-600 rounded-md"></div>
            <h1 className="text-base font-semibold tracking-wide">TaskFlow</h1>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="md:hidden text-gray-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest px-2 mb-1">Menu</p>

          <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:bg-[#1e1e1e] hover:text-white"
            }`
          }>
            📋 Dashboard
          </NavLink>

          <NavLink to="/analytics" onClick={() => setMenuOpen(false)} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:bg-[#1e1e1e] hover:text-white"
            }`
          }>
            📊 Analytics
          </NavLink>

          <NavLink to="/settings" onClick={() => setMenuOpen(false)} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:bg-[#1e1e1e] hover:text-white"
            }`
          }>
            ⚙️ Settings
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e] bg-[#141414]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-violet-600 rounded-md"></div>
            <span className="text-sm font-semibold">TaskFlow</span>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ☰
          </button>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default Layout;