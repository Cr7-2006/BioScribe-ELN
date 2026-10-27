import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, UserRole, UserStatus } from '../types';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Building,
  Mail,
  Calendar,
  FileText,
  BadgeCheck,
  UserMinus,
} from 'lucide-react';
import { formatDisplayDate } from '../utils/date';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ users: User[] }>('/admin/users');
      setUsers(res.users);
    } catch (err: any) {
      error('Failed to load users', err.message || 'Could not retrieve user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userToApprove: User) => {
    setProcessingId(userToApprove.id);
    try {
      const res = await apiRequest<{ message: string; user: User }>(
        `/admin/users/${userToApprove.id}/approve`,
        { method: 'POST' }
      );
      success('User Verified & Approved', res.message);
      fetchUsers();
    } catch (err: any) {
      error('Approval Failed', err.message || 'Could not approve user account.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userToReject: User) => {
    if (!window.confirm(`Are you sure you want to reject access for ${userToReject.name}?`)) {
      return;
    }
    setProcessingId(userToReject.id);
    try {
      const res = await apiRequest<{ message: string; user: User }>(
        `/admin/users/${userToReject.id}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: 'Administrative review decision' }),
        }
      );
      success('Registration Rejected', res.message);
      fetchUsers();
    } catch (err: any) {
      error('Action Failed', err.message || 'Could not reject user.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async (userToDeactivate: User) => {
    if (!window.confirm(`Are you sure you want to deactivate the account for ${userToDeactivate.name}? This will revoke their login and laboratory terminal access.`)) {
      return;
    }
    setProcessingId(userToDeactivate.id);
    try {
      const res = await apiRequest<{ message: string; user: User }>(
        `/admin/users/${userToDeactivate.id}/deactivate`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: 'Account deactivated by laboratory administrator' }),
        }
      );
      success('Account Deactivated', res.message);
      fetchUsers();
    } catch (err: any) {
      error('Deactivation Failed', err.message || 'Could not deactivate user account.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReactivate = async (userToReactivate: User) => {
    setProcessingId(userToReactivate.id);
    try {
      const res = await apiRequest<{ message: string; user: User }>(
        `/admin/users/${userToReactivate.id}/activate`,
        { method: 'POST' }
      );
      success('Account Reactivated', res.message);
      fetchUsers();
    } catch (err: any) {
      error('Reactivation Failed', err.message || 'Could not reactivate user account.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'pending_approval');
  const activeUsers = users.filter((u) => u.status === 'active' || !u.status);
  const deactivatedUsers = users.filter((u) => u.status === 'deactivated');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');

  const filteredUsers = users.filter((u) => {
    const matchesFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending_approval'
        ? u.status === 'pending_approval'
        : filterStatus === 'active'
        ? u.status === 'active' || !u.status
        : u.status === filterStatus;

    const matchesSearch =
      searchQuery.trim() === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
            Administrator
          </span>
        );
      case 'qa_manager':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            QA Manager
          </span>
        );
      case 'reviewer':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            Reviewer (PI)
          </span>
        );
      case 'researcher':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/20">
            Researcher
          </span>
        );
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              <span>User Verification & Access Control</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Access Authorization Gate</span>
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review, verify, and authorize laboratory personnel accounts before granting research terminal access.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold transition flex items-center space-x-2 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterStatus('pending_approval')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'pending_approval'
              ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {pendingUsers.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">awaiting review</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('active')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'active'
              ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Active Personnel
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {activeUsers.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">authorized</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('deactivated')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'deactivated'
              ? 'bg-rose-500/10 border-rose-500/40 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Deactivated
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <UserMinus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {deactivatedUsers.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">revoked access</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('all')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-brand-500/10 border-brand-500/40 ring-2 ring-brand-500/20'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-brand-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              All Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {users.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">registered</span>
          </div>
        </div>
      </div>

      {/* Pending Verification Notice Banner */}
      {pendingUsers.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Action Required: {pendingUsers.length} Registration{pendingUsers.length > 1 ? 's' : ''} Pending Verification
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                New scientific staff cannot log in until an administrator verifies their identity and approves their role.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('pending_approval')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition shadow-sm whitespace-nowrap"
          >
            Review Pending Queue
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Accounts ({users.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending_approval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              filterStatus === 'pending_approval'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
            }`}
          >
            <span>Pending Review</span>
            {pendingUsers.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-900/20 dark:bg-amber-950/40 text-[10px] flex items-center justify-center font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'active'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
            }`}
          >
            Active ({activeUsers.length})
          </button>
          <button
            onClick={() => setFilterStatus('deactivated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'deactivated'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-rose-700 dark:text-rose-400 hover:text-rose-800'
            }`}
          >
            Deactivated ({deactivatedUsers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, department..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* User Cards / Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading user directory...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No users found</h3>
          <p className="text-xs text-slate-500">
            {filterStatus === 'pending_approval'
              ? 'All user registrations have been reviewed and verified.'
              : 'No records match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const isPending = u.status === 'pending_approval';
            const isRejected = u.status === 'rejected';
            const isProcessing = processingId === u.id;

            return (
              <div
                key={u.id}
                className={`p-5 rounded-2xl border transition shadow-sm space-y-4 ${
                  isPending
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    : isRejected
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-70'
                    : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: User Avatar & Identity */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0 mt-0.5">
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </h3>
                        {getRoleBadge(u.role)}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Pending Verification
                          </span>
                        )}
                        {u.status === 'deactivated' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60">
                            Deactivated
                          </span>
                        )}
                        {!isPending && !isRejected && u.status !== 'deactivated' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                            <BadgeCheck className="w-3 h-3" />
                            <span>Verified & Active</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                            Rejected
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.department}</span>
                        </span>
                        {u.createdAt && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Registered: {formatDisplayDate(u.createdAt)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Verification & Account Management Actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 self-end md:self-auto">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleReject(u)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold transition disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleApprove(u)}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Verify & Authorize Access</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : u.status === 'deactivated' ? (
                      <button
                        onClick={() => handleReactivate(u)}
                        disabled={isProcessing}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reactivate Account</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 hidden sm:block">
                          {u.approvedBy && (
                            <p>
                              Verified by: <strong className="text-slate-700 dark:text-slate-300">{u.approvedBy}</strong>
                            </p>
                          )}
                          {u.approvedAt && (
                            <p>
                              Authorized on: {formatDisplayDate(u.approvedAt)}
                            </p>
                          )}
                        </div>

                        {u.id !== currentUser?.id && u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeactivate(u)}
                            disabled={isProcessing}
                            title="Deactivate account access"
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Justification details for pending verification */}
                {u.justification && (
                  <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Access Justification: </strong>
                      <span>{u.justification}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
