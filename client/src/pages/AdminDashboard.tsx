import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { User, UserRole } from '../types';
import { useNotification } from '../context/NotificationContext';
import { ActiveTab } from '../components/layout/Sidebar';
import {
  Shield,
  Users,
  UserCheck,
  BookOpen,
  Activity,
  CheckCircle2,
  ArrowRight,
  Server,
  Mail,
  Building,
  RefreshCw,
} from 'lucide-react';
import { formatDisplayDateTime } from '../utils/date';

interface AdminDashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveTab }) => {
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [usersRes, statsRes, auditRes] = await Promise.all([
        apiRequest<{ users: User[] }>('/admin/users'),
        apiRequest<{ metrics: any; system: any }>('/stats'),
        apiRequest<{ logs: any[] }>('/audit-trail'),
      ]);

      setUsers(usersRes.users);
      setStats(statsRes);
      setAuditLogs(auditRes.logs.slice(0, 6));
    } catch (err: any) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveUser = async (userToApprove: User) => {
    setProcessingId(userToApprove.id);
    try {
      const res = await apiRequest<{ message: string; user: User }>(
        `/admin/users/${userToApprove.id}/approve`,
        { method: 'POST' }
      );
      success('User Verified & Approved', `${userToApprove.name} has been granted access.`);
      fetchAdminData();
    } catch (err: any) {
      error('Approval Failed', err.message || 'Could not approve user account.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectUser = async (userToReject: User) => {
    if (!window.confirm(`Are you sure you want to reject access for ${userToReject.name}?`)) {
      return;
    }
    setProcessingId(userToReject.id);
    try {
      const res = await apiRequest<{ message: string; user: User }>(
        `/admin/users/${userToReject.id}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: 'Admin rejection' }),
        }
      );
      success('Registration Rejected', res.message);
      fetchAdminData();
    } catch (err: any) {
      error('Action Failed', err.message || 'Could not reject user.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'pending_approval');
  const activeUsers = users.filter((u) => u.status === 'active' || !u.status);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'researcher':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'reviewer':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'qa_manager':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'admin':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 text-slate-500 dark:text-slate-400">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading Administration Console...</p>
        </div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Administrator Control Panel
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  System Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage user access, verify new registrations, and oversee system activity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchAdminData();
            }}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage All Users</span>
          </button>
        </div>
      </div>

      {/* 4 Key Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Registered Users</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{users.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">{activeUsers.length} Active Accounts</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setActiveTab('users')}
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition ${
            pendingUsers.length > 0
              ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Registrations</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                pendingUsers.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
              }`}
            >
              {pendingUsers.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {pendingUsers.length > 0 ? 'Requires Admin Approval' : 'No Pending Users'}
            </p>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              pendingUsers.length > 0
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Experiments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Notebook Records</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics.totalExperiments ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics.approvedExperiments ?? 0} Approved / Locked
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* System Health */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">System & Database</p>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Operational</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">MongoDB & Node.js Active (MERN)</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Row: Pending Approvals Queue & Quick Team Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: User Verification Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pending User Verification Queue
              </h2>
              {pendingUsers.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {pendingUsers.length} Action Needed
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  All User Registrations Verified
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  No applicant accounts are currently awaiting administrative review. New user registrations will appear here for one-click approval.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((applicant) => (
                <div
                  key={applicant.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-amber-500/30 dark:border-amber-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {applicant.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {applicant.name}
                        </span>
                        <span className="text-xs font-mono text-slate-500">(@{applicant.username})</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${getRoleBadge(
                            applicant.role
                          )}`}
                        >
                          {applicant.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{applicant.email}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{applicant.department || 'General Research'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleRejectUser(applicant)}
                      disabled={processingId === applicant.id}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveUser(applicant)}
                      disabled={processingId === applicant.id}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{processingId === applicant.id ? 'Approving...' : 'Approve Access'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Active Team Roster */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Active System Users ({activeUsers.length})
              </h3>
              <button
                onClick={() => setActiveTab('users')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Full User Directory
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {activeUsers.slice(0, 4).map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-[10px] text-slate-500">@{u.username} • {u.department || 'Biochemistry'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${getRoleBadge(
                        u.role
                      )}`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: System Activity Logs & Admin Guide */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent System Activity</h2>
            </div>
            <button
              onClick={() => setActiveTab('audit')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log, idx) => (
                <div key={log.id || idx} className="text-xs space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDisplayDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {log.details}
                  </p>
                  <p className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">
                    User: {log.userName || log.userId} ({log.userRole})
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* College FSD Viva Architecture Reference Box */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-900 dark:text-blue-300">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Admin Role Architecture</span>
            </div>
            <p className="text-[11px] text-blue-800 dark:text-blue-300/80 leading-relaxed">
              In this full stack application, the Administrator oversees user authorization, verification of new signups, and system activity logs. Separation of duties ensures that administrators manage platform access while research scientists execute lab experiments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
