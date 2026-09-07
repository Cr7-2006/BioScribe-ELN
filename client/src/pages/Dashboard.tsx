import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Experiment, Approval } from '../types';
import {
  BookOpen,
  FlaskRound,
  FileCheck2,
  Activity,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Database,
  Cpu,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/Sidebar';

interface DashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenExperiment: (id: string) => void;
  onNewExperiment: () => void;
  onNewFormulation: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onOpenExperiment,
  onNewExperiment,
  onNewFormulation,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [recentExperiments, setRecentExperiments] = useState<Experiment[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, expData, apprData] = await Promise.all([
          apiRequest<{ metrics: any; system: any }>('/stats'),
          apiRequest<{ experiments: Experiment[] }>('/experiments'),
          apiRequest<{ approvals: Approval[] }>('/approvals?status=pending'),
        ]);

        setStats(statsData);
        setRecentExperiments(expData.experiments.slice(0, 5));
        setPendingApprovals(apprData.approvals);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading laboratory telemetry & metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};
  const system = stats?.system || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Research Laboratory Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Electronic Laboratory Notebook (ELN) & GLP-compliant revision tracker.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNewFormulation}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition shadow-sm"
          >
            <FlaskRound className="w-4 h-4 text-emerald-400" />
            <span>New Formulation</span>
          </button>
          <button
            onClick={onNewExperiment}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 text-sm font-semibold transition shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Experiment</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Experiments & Notebooks
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {metrics.totalExperiments || 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({metrics.approvedExperiments || 0} locked)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span>{metrics.draftExperiments || 0} Drafts • {metrics.inReviewExperiments || 0} In Review</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Signatures
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {metrics.pendingApprovals || 0}
            </span>
            <span className="text-xs text-amber-400 font-medium">Awaiting Review</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">21 CFR Part 11 Electronic Signature required</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Formulations
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FlaskRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {metrics.totalFormulations || 0}
            </span>
            <span className="text-xs text-slate-400">Validated Recipes</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">With stoichiometry & GHS safety badges</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recorded Observations
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {metrics.totalObservations || 0}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Time-Series Logs</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Absorbance, pH, SPR, and cell viability</p>
        </div>
      </div>

      {/* System Integrity & Regulatory Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-white">
                Regulatory Compliance Engine Active
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                GLP / 21 CFR Part 11
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              All notebook entries, protocol modifications, formulations, and approval signatures are cryptographically fingerprinted using SHA-256 with immutable audit trails.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-brand-400" />
            <span>{system.databaseStorage}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>{system.redisCacheStatus}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Experiments & Pending Signatures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Experiments (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-brand-400" />
              <span>Recent Notebook Experiments</span>
            </h2>
            <button
              onClick={() => setActiveTab('experiments')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
            >
              <span>View All ({metrics.totalExperiments || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 shadow-sm">
            {recentExperiments.map((exp) => {
              const statusColors = {
                draft: 'bg-slate-800 text-slate-300 border-slate-700',
                in_review: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
              }[exp.status];

              return (
                <div
                  key={exp.id}
                  onClick={() => onOpenExperiment(exp.id)}
                  className="p-4 hover:bg-slate-800/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-brand-400">
                        {exp.experimentNumber}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        v{exp.currentVersionNumber}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColors}`}>
                        {exp.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-slate-100 hover:text-brand-300 transition">
                      {exp.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {exp.objective || 'No objective specified.'}
                    </p>
                  </div>

                  <div className="flex sm:flex-col sm:items-end justify-between text-xs text-slate-400 flex-shrink-0">
                    <span className="font-medium text-slate-300">{exp.authorName}</span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(exp.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals Card (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span>Pending Sign-off Queue</span>
            </h2>
            <button
              onClick={() => setActiveTab('approvals')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No pending sign-off requests in queue.</p>
              </div>
            ) : (
              pendingApprovals.map((appr) => (
                <div
                  key={appr.id}
                  onClick={() => setActiveTab('approvals')}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-amber-500/40 transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {appr.experimentNumber} (v{appr.versionNumber})
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {appr.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 line-clamp-2">
                    {appr.experimentTitle}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Requested by: {appr.requesterName}</span>
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
