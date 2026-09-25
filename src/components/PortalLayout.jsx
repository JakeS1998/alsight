import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ROLE_LABELS, ROLE_BADGE_CLASS } from "@/lib/portal";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard, FolderKanban, Building2, UserCircle, LogOut, Menu, X, BarChart3, Users, UserCog } from "lucide-react";
import Logo from "@/components/Logo";
import { INTERNAL_ROLES } from "@/lib/portal";

const ALL_ROLES = ["admin", "director", "regional_director", "bsm", "finance", "bdm", "client", "supplier", "project_manager"];

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, roles: ALL_ROLES },
  { label: "Projects", path: "/projects", icon: FolderKanban, roles: ALL_ROLES },
  { label: "Analytics", path: "/analytics", icon: BarChart3, roles: INTERNAL_ROLES },
  { label: "Delegation", path: "/delegation", icon: UserCog, roles: INTERNAL_ROLES },
  { label: "My Account", path: "/account", icon: UserCircle, roles: ["client", "supplier"] },
  { label: "Accounts", path: "/accounts", icon: Building2, roles: ALL_ROLES },
  { label: "Contacts", path: "/contacts", icon: Users, roles: ["admin"] },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || "client";
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <Logo className="h-12" onDark />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {(user?.full_name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.full_name || user?.email}</p>
            <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE_CLASS[role] || ""}`}>
              {ROLE_LABELS[role] || role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-als-navy lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-als-navy shadow-xl">{SidebarContent}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <Logo className="h-8" />
          <div className="w-9" />
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}