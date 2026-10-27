import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FlaskConical,
  ShieldCheck,
  ChevronDown,
  Activity,
  Sun,
  Moon,
  Lock,
  LogOut,
  UserCheck,
  Search,
  QrCode,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  onLockTerminal?: () => void;
  onOpenSearch?: () => void;
  onOpenReagentScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLockTerminal,
  onOpenSearch,
  onOpenReagentScanner,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200 shadow-sm">
      {/* Brand & System Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <FlaskConical className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                BioScribe
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                ELN v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block tracking-wide font-medium">
              High-Integrity Electronic Laboratory Notebook
            </p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Role-Specific Status Badge */}
        {user?.role === 'admin' ? (
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="font-semibold">Administrator Control Console</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
        ) : (
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="font-semibold">BioScribe ELN • Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Middle Search & Quick Actions */}
      <div className="flex items-center space-x-2.5">
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 text-xs transition-all shadow-sm"
            title="Search Experiments, Protocols, CAS# (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline text-slate-600 dark:text-slate-300">Search records, CAS#...</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-600">
              Ctrl+K
            </span>
          </button>
        )}

        {onOpenReagentScanner && (
          <button
            onClick={onOpenReagentScanner}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 dark:bg-slate-800/80 dark:hover:bg-brand-950/40 text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700/80 transition-all shadow-sm text-xs font-semibold"
            title="Scan Reagent Barcode / QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-500" />
            <span className="hidden sm:inline">Scan Reagents</span>
          </button>
        )}
      </div>

      {/* Right Side: Active User, Theme Toggle & Account Menu */}
      <div className="flex items-center space-x-3">
        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <Activity className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
          <span className="hidden sm:inline">SHA-256 Ledger:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tamper-Proof</span>
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-all shadow-sm flex items-center justify-center"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {/* Terminal Workstation Lock Button */}
        {onLockTerminal && (
          <button
            onClick={onLockTerminal}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700/80 transition-all shadow-sm flex items-center space-x-1.5 text-xs font-semibold"
            title="Lock Terminal Workstation"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Lock Terminal</span>
          </button>
        )}

        {/* User Account Profile & Sign Out Menu */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all text-left shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-xs font-bold text-slate-950 shadow-sm">
              {user?.name.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 flex items-center space-x-1">
                <span>{user?.name || 'Researcher'}</span>
              </div>
              <div className="text-[10px] text-brand-600 dark:text-brand-400 font-mono capitalize">
                {user?.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-1" />
          </button>

          {isDropdownOpen && (
            <>
              {/* Invisible Click-outside Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 space-y-3">
                {/* User Details */}
                <div className="space-y-1 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow">
                      {user?.name.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">{user?.email}</p>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.department}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Security Role:</span>
                    <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 capitalize">
                      {user?.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out & Terminate Session</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
