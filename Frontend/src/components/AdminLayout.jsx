import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: "/samca2k26-admin", label: "Settings", exact: true },
    { path: "/samca2k26-admin/positions", label: "Positions" },
    { path: "/samca2k26-admin/registrations", label: "Registrations" },
    { path: "/samca2k26-admin/analytics", label: "Analytics" },
    { path: "/samca2k26-admin/voted-users", label: "Voted Users" },
  ];

  return (
    <div className="min-h-screen bg-light-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-text-primary">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-text-secondary">SAMCA Election Portal</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="border-b border-primary-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path) && item.path !== "/samca2k26-admin";

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? "border-primary-800 text-primary-800"
                        : "border-transparent text-text-secondary hover:text-text-primary hover:border-primary-300"
                    }`}>
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow border border-primary-100">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
