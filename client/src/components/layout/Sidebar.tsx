import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FlaskRound,
  FileCheck2,
  History,
  FolderGit2,
  Lock,
  ExternalLink,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActiveTab = 'dashboard' | 'experiments' | 'formulations' | 'approvals' | 'audit' | 'users';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount?: number;
  pendingUsersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount = 0,
  pendingUsersCount = 0,
}) => {
  const { user } = useAuth();

  let sectionTitle = 'Research Modules';
  let navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[] = [];

  if (user?.role === 'admin') {
    sectionTitle = 'ADMINISTRATION';
    navItems = [
      { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
      {
        id: 'users',
        label: 'User Management',
        icon: Users,
        badge: pendingUsersCount > 0 ? pendingUsersCount : undefined,
      },
      { id: 'audit', label: 'System Activity Logs', icon: History },
    ];
  } else if (user?.role === 'reviewer') {
    sectionTitle = 'PEER REVIEW';
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'experiments', label: 'Notebooks & Experiments', icon: BookOpen },
      {
        id: 'approvals',
        label: 'Approvals & Signatures',
        icon: FileCheck2,
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      },
    ];
  } else if (user?.role === 'qa_manager') {
    sectionTitle = 'QUALITY ASSURANCE';
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'experiments', label: 'Notebooks & Experiments', icon: BookOpen },
      {
        id: 'approvals',
        label: 'Compliance Reviews',
        icon: FileCheck2,
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      },
      { id: 'audit', label: 'Regulatory Audit Trail', icon: History },
    ];
  } else {
    // Default / Researcher
    sectionTitle = 'LABORATORY';
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'experiments', label: 'Notebooks & Experiments', icon: BookOpen },
      { id: 'formulations', label: 'Formulations & Reagents', icon: FlaskRound },
    ];
  }

  return (
    <aside className="w-64 bg-white/90 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between flex-shrink-0 transition-colors duration-200">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {sectionTitle}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/30 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Role & Security Info Box */}
        {user?.role === 'admin' ? (
          <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 dark:text-blue-300">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              <span>Admin Access Control</span>
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-300/80 leading-relaxed">
              Verify new applicants, manage user accounts, and oversee system activity.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Integrity Guard</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              All revisions and signatures are cryptographically hashed using SHA-256 for compliance.
            </p>
            <div className="pt-1 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
              <FolderGit2 className="w-3 h-3 text-slate-400" />
              <span>Git-Backed Versioning</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
        <span>BioScribe ELN System</span>
        <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>Online</span>
        </span>
      </div>
    </aside>
  );
};
