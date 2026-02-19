import { Outlet, NavLink } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen flex bg-[#0f0f0f] text-white">

      {/* Sidebar */}
      <aside className="w-60 bg-[#141414] border-r border-[#1e1e1e] p-5 flex flex-col gap-8">

        {/* Logo */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-6 h-6 bg-violet-600 rounded-md"></div>
          <h1 className="text-base font-semibold tracking-wide">TaskFlow</h1>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest px-2 mb-1">Menu</p>

          <NavLink to="/" end className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:bg-[#1e1e1e] hover:text-white"
            }`
          }>
            📋 Dashboard
          </NavLink>

          <NavLink to="/analytics" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:bg-[#1e1e1e] hover:text-white"
            }`
          }>
            📊 Analytics
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) =>
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

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;