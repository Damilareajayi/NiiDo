"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import {
  BookOpen, Brain, GraduationCap, BarChart3,
  Users, LayoutDashboard, Settings, LogOut,
  Upload, ClipboardList, Menu, X, UserCircle, Sparkles
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentNav: NavItem[] = [
    { href: "/student",            label: t.nav.dashboard,   icon: LayoutDashboard },
    { href: "/student/read",       label: t.modules.read,    icon: Brain,           badge: "NiiDo Read" },
    { href: "/student/learn",      label: "My Learning",     icon: BookOpen },
  ];

  const teacherNav: NavItem[] = [
    { href: "/teacher",            label: t.nav.dashboard,   icon: LayoutDashboard },
    { href: "/teacher/teach",      label: t.modules.teach,   icon: GraduationCap,   badge: "NiiDo Teach" },
    { href: "/teacher/class",      label: t.nav.classes,     icon: Users },
    { href: "/teacher/pulse",      label: t.modules.pulse,   icon: BarChart3,       badge: "NiiDo Pulse" },
    { href: "/teacher/students",   label: t.nav.students,    icon: ClipboardList },
    { href: "/teacher/upload",     label: "Import Students", icon: Upload },
  ];

  const adminNav: NavItem[] = [
    { href: "/admin",              label: t.nav.dashboard,   icon: LayoutDashboard },
    { href: "/admin/pulse",        label: t.modules.pulse,   icon: BarChart3,       badge: "NiiDo Pulse" },
    { href: "/admin/teachers",     label: t.nav.teachers,    icon: Users },
    { href: "/admin/students",     label: t.nav.students,    icon: ClipboardList },
    { href: "/admin/upload",       label: "Import Students", icon: Upload },
    { href: "/admin/marketing",    label: "Growth & Outreach", icon: Sparkles,        badge: "NiiDo Growth" },
  ];

  const navItems =
    user?.role === "student" ? studentNav :
    user?.role === "teacher" ? teacherNav :
    adminNav;

  // Module color by role — matches the three brand dot colors (Read=coral, Teach=teal, Pulse=sky)
  const roleColor =
    user?.role === "student" ? "bg-coral-500" :
    user?.role === "teacher" ? "bg-teal-500" :
    "bg-sky-500";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center shrink-0">
            <img src="/niido-icon-mark.svg" alt="" className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display font-bold text-stone-900 text-lg leading-none">NiiDo</p>
            <p className="text-stone-400 text-xs capitalize mt-0.5">{user?.role} Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href ||
            (item.href !== "/student" && item.href !== "/teacher" && item.href !== "/admin"
              && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${active ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${item.badge.includes("Read")  ? "bg-coral-100 text-coral-700" :
                    item.badge.includes("Teach") ? "bg-teal-100 text-teal-700" :
                    "bg-sky-100 text-sky-700"}`}>
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-stone-100 space-y-0.5">
        <Link href="/profile" className="sidebar-link">
          <UserCircle className="w-4 h-4" />
          <span>Profile</span>
        </Link>
        <Link href="/settings" className="sidebar-link">
          <Settings className="w-4 h-4" />
          <span>{t.nav.settings}</span>
        </Link>
        <button onClick={logout} className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4" />
          <span>{t.nav.logout}</span>
        </button>
      </div>

      {/* User card */}
      <div className="p-4 border-t border-stone-100">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${roleColor} flex items-center justify-center shrink-0`}>
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">{user?.name}</p>
            <p className="text-xs text-stone-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-stone-200 fixed left-0 top-0 h-screen z-30">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center">
            <img src="/niido-icon-mark.svg" alt="" className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-stone-900">NiiDo</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-stone-100">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed left-0 top-0 h-screen w-72 bg-white z-50 shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
