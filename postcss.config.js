import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  LogOut,
  ShieldCheck,
  Monitor,
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    if (user?.role === 'department') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'data-entry', label: 'Data Entry', icon: FileText },
        { id: 'executive-summary', label: 'Executive Summary', icon: BarChart3 },
      ];
    }
    if (user?.role === 'monitor') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'compliance', label: 'Compliance Scoring', icon: ClipboardCheck },
      ];
    }
    // Admin
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'departments', label: 'Departments', icon: Building2 },
      { id: 'master1', label: 'Master 1', icon: FileText },
      { id: 'executive-report', label: 'Executive Report', icon: BarChart3 },
      { id: 'compliance-overview', label: 'Compliance', icon: ClipboardCheck },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  };

  const getRoleIcon = () => {
    if (user?.role === 'admin') return ShieldCheck;
    if (user?.role === 'monitor') return Monitor;
    return Building2;
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'Administrator';
    if (user?.role === 'monitor') return 'Monitoring Head';
    return 'Department';
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <aside className="w-64 bg-slate-800/50 border-r border-slate-700/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">Performance Tracker</h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {getMenuItems().map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentPage === item.id
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
              <RoleIcon className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">{getRoleLabel()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
