import { Outlet, NavLink } from "react-router-dom";

const Layout = () => {
  const baseStyle =
    "block px-4 py-2 rounded-lg transition";

  const inactiveStyle =
    "text-gray-300 hover:bg-gray-800 hover:text-white";

  const activeStyle =
    "bg-blue-600 text-white font-semibold";

  return (
    <div className="grid grid-cols-[250px_1fr] grid-rows-[70px_1fr] h-screen">

      {/* Sidebar */}
      <aside className="row-span-2 bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">TaskFlow</h1>

        <nav className="space-y-2">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Analytics
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Settings
          </NavLink>

        </nav>
      </aside>

      {/* Header */}
      <header className="bg-gray-800 text-white flex items-center px-6">
        Header
      </header>

      {/* Content */}
      <main className="p-6 bg-gray-100">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
