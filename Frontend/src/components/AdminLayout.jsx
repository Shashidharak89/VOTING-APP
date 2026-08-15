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
    <div className="min-h-screen bg-light-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Panel Page Heading */}
        <div className="mb-6 pb-5 border-b border-primary-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-800 tracking-tight">
                Admin Panel
              </h1>
              <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-full border border-primary-200 shadow-xs">
                Control Center
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Manage election settings, candidate positions, registrations, live analytics, and voting logs.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-primary-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Admin Navigation Tabs">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path) && item.path !== "/samca2k26-admin";

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? "border-primary-800 text-primary-800"
                      : "border-transparent text-text-secondary hover:text-primary-800 hover:border-primary-300"
                  }`}>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-primary-200 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

