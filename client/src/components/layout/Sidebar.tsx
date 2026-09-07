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
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'experiments' | 'formulations' | 'approvals' | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount = 0,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'experiments', label: 'Notebooks & Experiments', icon: BookOpen },
    { id: 'formulations', label: 'Formulations & Reagents', icon: FlaskRound },
    {
      id: 'approvals',
      label: 'Approvals & Signatures',
      icon: FileCheck2,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'audit', label: 'Regulatory Audit Trail', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Research Modules
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
                      ? 'bg-gradient-to-r from-brand-600/20 to-brand-500/10 text-brand-300 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Regulatory & Security Info Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Integrity Guard</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All revisions and signatures are cryptographically hashed using SHA-256 for FDA 21 CFR Part 11 compliance.
          </p>
          <div className="pt-1 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
            <FolderGit2 className="w-3 h-3 text-slate-400" />
            <span>Git-Backed Versioning</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
        <span>BioScribe ELN System</span>
        <span className="flex items-center space-x-1 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Online</span>
        </span>
      </div>
    </aside>
  );
};
