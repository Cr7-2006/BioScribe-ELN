import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { AuditLog } from '../types';
import { useNotification } from '../context/NotificationContext';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Calendar,
  User,
  Activity,
  FileCheck2,
  BookOpen,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { error, success } = useNotification();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [allIntegrityValid, setAllIntegrityValid] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState('all');

  const fetchAuditLogs = async (showNotification = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedAction !== 'all') params.append('action', selectedAction);
      if (selectedEntity !== 'all') params.append('entityType', selectedEntity);
      if (searchQuery) params.append('query', searchQuery);

      const data = await apiRequest<{
        logs: AuditLog[];
        totalCount: number;
        allIntegrityValid: boolean;
      }>(`/audit-trail?${params.toString()}`);

      setLogs(data.logs);
      setAllIntegrityValid(data.allIntegrityValid);
      setTotalCount(data.totalCount);

      if (showNotification) {
        if (data.allIntegrityValid) {
          success('Integrity Verified', `All ${data.totalCount} audit ledger blocks confirmed 100% cryptographically valid.`);
        } else {
          error('Integrity Alert', 'Discrepancy detected in audit ledger checksum!');
        }
      }
    } catch (err: any) {
      error('Failed to load audit trail', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedAction, selectedEntity, searchQuery]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-brand-400" />
            <span>FDA 21 CFR Part 11 Regulatory Audit Trail</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Time-stamped, append-only ledger with cryptographic SHA-256 integrity verification.
          </p>
        </div>

        {/* Global Integrity Seal & Re-verify Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchAuditLogs(true)}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition"
            title="Re-run SHA-256 integrity verification over entire audit ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-verify Ledger</span>
          </button>

          <div
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl border text-xs shadow-sm ${
              allIntegrityValid
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {allIntegrityValid ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span className="font-semibold">Audit Integrity:</span>
            <span className="font-mono font-bold text-white">
              {allIntegrityValid ? `ALL ${totalCount} CHECKSUMS VALID` : 'TAMPER DETECTED'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by keyword, investigator, or entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="VERSION_COMMIT">VERSION_COMMIT</option>
            <option value="E_SIGNATURE">E_SIGNATURE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-brand-500 capitalize"
          >
            <option value="all">All Entities</option>
            <option value="experiment">Experiment</option>
            <option value="observation">Observation</option>
            <option value="formulation">Formulation</option>
            <option value="approval">Approval</option>
            <option value="auth">Auth / Session</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Verifying audit ledger checksums...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 space-y-2">
          <History className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs">No audit logs matching query.</p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Audit Details & Manifestation</th>
                  <th className="py-3 px-4 font-mono">Integrity Checksum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.map((log) => {
                  const actionColor = {
                    CREATE: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                    VERSION_COMMIT: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
                    E_SIGNATURE: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                    UPDATE: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                    DELETE: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
                    EXPORT: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
                    RESTORE: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
                  }[log.action] || 'bg-slate-800 text-slate-300';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.userName}</div>
                        <div className="text-[10px] text-brand-400 font-mono capitalize">
                          {log.userRole.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${actionColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-slate-400 truncate max-w-[120px]" title={log.checksum}>
                            {log.checksum.substring(0, 12)}...
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
