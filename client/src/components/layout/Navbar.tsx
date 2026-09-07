import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FlaskConical,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, switchUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const roles: { role: UserRole; name: string; title: string; color: string }[] = [
    {
      role: 'researcher',
      name: 'Kamalesh',
      title: 'Lead Researcher (Author)',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    {
      role: 'reviewer',
      name: 'Thameem',
      title: 'Principal Investigator (Reviewer)',
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    },
    {
      role: 'qa_manager',
      name: 'Subbu',
      title: 'Head of QA / Compliance (Signer)',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
  ];

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Compliance Seal */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <FlaskConical className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                BioScribe
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                ELN v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
              High-Integrity Electronic Laboratory Notebook
            </p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-800 hidden md:block" />

        {/* 21 CFR Part 11 Regulatory Compliance Badge */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">21 CFR Part 11 & GLP Certified</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Right Side: Active User & Demo Role Switcher */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <Activity className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden sm:inline">SHA-256 Audit Trail:</span>
          <span className="text-emerald-400 font-medium">Tamper-Proof</span>
        </div>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-left shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-semibold text-brand-400">
              {user?.name.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-slate-200 flex items-center space-x-1">
                <span>{user?.name || 'Researcher'}</span>
              </div>
              <div className="text-[10px] text-brand-400 font-mono capitalize">
                {user?.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Switch Active Role (Demo)
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Test review & approval sign-off ceremonies across different laboratory roles:
                </p>
              </div>
              <div className="space-y-1">
                {roles.map((r) => {
                  const isActive = user?.role === r.role;
                  return (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchUser(r.role);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start justify-between ${
                        isActive
                          ? 'bg-brand-500/10 border border-brand-500/30 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center space-x-1.5">
                          <UserCheck className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                          <span>{r.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{r.title}</div>
                      </div>
                      {isActive && <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
