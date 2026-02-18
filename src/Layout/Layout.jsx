
import { Outlet, NavLink } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 to-slate-950 text-white">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">

        <h1 className="text-2xl font-bold mb-10">
          TaskFlow
        </h1>

        <nav className="flex flex-col gap-4">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl transition ${
                isActive
                  ? "bg-blue-600 shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700 text-gray-300"
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl transition ${
                isActive
                  ? "bg-blue-600 shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700 text-gray-300"
              }`
            }
          >
            Analytics
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl transition ${
                isActive
                  ? "bg-blue-600 shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700 text-gray-300"
              }`
            }
          >
            Settings
          </NavLink>

        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
