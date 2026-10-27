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
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/Sidebar';
import { formatDisplayDate } from '../utils/date';

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
  const [showQuickStart, setShowQuickStart] = useState<boolean>(() => {
    return localStorage.getItem('bioscribe_hide_quickstart') !== 'true';
  });

  const toggleQuickStart = () => {
    const next = !showQuickStart;
    setShowQuickStart(next);
    localStorage.setItem('bioscribe_hide_quickstart', next ? 'false' : 'true');
  };

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
        <div className="flex flex-col items-center space-y-3 text-slate-500 dark:text-slate-400">
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
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Research Laboratory Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
              Simple Mode Ready
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Electronic Laboratory Notebook (ELN) & Research Management Platform.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleQuickStart}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
            title="Toggle New User Guide"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{showQuickStart ? 'Hide Guide' : 'Quick Guide'}</span>
            {showQuickStart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onNewFormulation}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-sm font-medium border border-slate-300 dark:border-slate-700 transition shadow-sm"
          >
            <FlaskRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>New Formulation</span>
          </button>
          <button
            onClick={onNewExperiment}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 text-sm font-semibold transition shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Experiment</span>
          </button>
        </div>
      </div>

      {/* New User Guided Quick-Start (3 Simple Steps) */}
      {showQuickStart && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-500/10 via-slate-50 to-emerald-500/10 dark:from-brand-950/40 dark:via-slate-900/60 dark:to-emerald-950/30 border border-brand-500/30 dark:border-brand-500/20 shadow-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-700 dark:text-brand-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>👋 New User Quick-Start Guide</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                    3 Easy Steps
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Follow these 3 simple workflows to test and explore the entire Electronic Laboratory Notebook:
                </p>
              </div>
            </div>

            <button
              onClick={toggleQuickStart}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between space-y-3 shadow-sm hover:border-brand-500/50 transition">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 font-mono">STEP 1</span>
                  <BookOpen className="w-4 h-4 text-brand-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Explore an Experiment</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Open an existing notebook protocol. Compare version diffs (v1.0 vs v1.1), inspect time-series charts, and view raw observations.
                </p>
              </div>
              <button
                onClick={() => {
                  if (recentExperiments.length > 0) {
                    onOpenExperiment(recentExperiments[0].id);
                  } else {
                    setActiveTab('experiments');
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition flex items-center justify-center space-x-1"
              >
                <span>Open Sample Experiment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between space-y-3 shadow-sm hover:border-amber-500/50 transition">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">STEP 2</span>
                  <FileCheck2 className="w-4 h-4 text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Review & Sign Experiments</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Experience digital signatures and peer review. Switch between Dr. Kamalesh (Author), Dr. Thameem (Reviewer), and Dr. Subbu (QA) with 1 click!
                </p>
              </div>
              <button
                onClick={() => setActiveTab('approvals')}
                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-semibold text-xs border border-amber-300/40 transition flex items-center justify-center space-x-1"
              >
                <span>View Sign-Off Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between space-y-3 shadow-sm hover:border-emerald-500/50 transition">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">STEP 3</span>
                  <FlaskRound className="w-4 h-4 text-emerald-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Smart Recipe Scaling</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Test dynamic batch recipe scaling (e.g. 500 mL &rarr; 5,000 mL) and automatic molar concentration computations with no manual math.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('formulations')}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-semibold text-xs border border-emerald-300/40 transition flex items-center justify-center space-x-1"
              >
                <span>Try Recipe Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Experiments & Notebooks
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {metrics.totalExperiments || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              ({metrics.approvedExperiments || 0} locked)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>{metrics.draftExperiments || 0} Drafts • {metrics.inReviewExperiments || 0} In Review</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Signatures
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {metrics.pendingApprovals || 0}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Awaiting Review</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Electronic signature verification required</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Formulations
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FlaskRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {metrics.totalFormulations || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Validated Recipes</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">With stoichiometry & GHS safety badges</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recorded Observations
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {metrics.totalObservations || 0}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Time-Series Logs</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Absorbance, pH, SPR, and cell viability</p>
        </div>
      </div>

      {/* System Integrity & Regulatory Banner */}
      <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-emerald-500/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Research Integrity Engine Active
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                SHA-256 Verified
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              All notebook entries, protocol modifications, formulations, and approval signatures are cryptographically fingerprinted using SHA-256 with immutable audit trails.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="font-medium">{system.databaseStorage}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium">{system.backendRuntime || 'Node.js + Express Active (MERN)'}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Experiments & Pending Signatures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Experiments (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Recent Notebook Experiments</span>
            </h2>
            <button
              onClick={() => setActiveTab('experiments')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-semibold flex items-center space-x-1"
            >
              <span>View All ({metrics.totalExperiments || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/80 shadow-sm">
            {recentExperiments.map((exp) => {
              const statusColors = {
                draft: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                in_review: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
                approved: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
                rejected: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
              }[exp.status];

              return (
                <div
                  key={exp.id}
                  onClick={() => onOpenExperiment(exp.id)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                        {exp.experimentNumber}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        v{exp.currentVersionNumber}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColors}`}>
                        {exp.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-300 transition">
                      {exp.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {exp.objective || 'No objective specified.'}
                    </p>
                  </div>

                  <div className="flex sm:flex-col sm:items-end justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{exp.authorName}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {formatDisplayDate(exp.updatedAt)}
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Pending Sign-off Queue</span>
            </h2>
            <button
              onClick={() => setActiveTab('approvals')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-semibold flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs">No pending sign-off requests in queue.</p>
              </div>
            ) : (
              pendingApprovals.map((appr) => (
                <div
                  key={appr.id}
                  onClick={() => setActiveTab('approvals')}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {appr.experimentNumber} (v{appr.versionNumber})
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                      {appr.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {appr.experimentTitle}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>Requested by: <strong className="text-slate-700 dark:text-slate-300 font-medium">{appr.requesterName}</strong></span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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
