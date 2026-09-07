import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Experiment,
  ExperimentVersion,
  Observation,
  Formulation,
  Approval,
  ProtocolStep,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  BookOpen,
  ArrowLeft,
  GitCommit,
  GitCompare,
  FileCheck2,
  Activity,
  Printer,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface ExperimentDetailProps {
  experimentId: string;
  onBack: () => void;
  onOpenFormulation?: (id: string) => void;
}

type TabType = 'protocol' | 'versions' | 'observations' | 'approvals' | 'report';

export const ExperimentDetail: React.FC<ExperimentDetailProps> = ({
  experimentId,
  onBack,
  onOpenFormulation,
}) => {
  const { user } = useAuth();
  const { success, error, info } = useNotification();

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [currentVersion, setCurrentVersion] = useState<ExperimentVersion | null>(null);
  const [versions, setVersions] = useState<ExperimentVersion[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('protocol');
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);

  // Version Commit Modal State
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitSummary, setCommitSummary] = useState('');
  const [bumpType, setBumpType] = useState<'minor' | 'major'>('minor');
  const [editableSteps, setEditableSteps] = useState<ProtocolStep[]>([]);
  const [editableConclusion, setEditableConclusion] = useState('');

  // Diff Inspector State
  const [diffV1Id, setDiffV1Id] = useState<string>('');
  const [diffV2Id, setDiffV2Id] = useState<string>('');
  const [diffData, setDiffData] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // New Observation Form State
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [obsParam, setObsParam] = useState('');
  const [obsValue, setObsValue] = useState<string | number>('');
  const [obsUnit, setObsUnit] = useState('');
  const [obsCategory, setObsCategory] = useState<Observation['category']>('measurement');
  const [obsStatus, setObsStatus] = useState<'normal' | 'anomaly'>('normal');
  const [obsNotes, setObsNotes] = useState('');

  // Submit for Approval Modal
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalRole, setApprovalRole] = useState<'peer_review' | 'qa_compliance'>('peer_review');
  const [approvalReason, setApprovalReason] = useState('');

  const fetchExperiment = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{
        experiment: Experiment;
        currentVersion: ExperimentVersion;
        versions: ExperimentVersion[];
        observations: Observation[];
        formulation: Formulation | null;
        approvals: Approval[];
      }>(`/experiments/${experimentId}`);

      setExperiment(data.experiment);
      setCurrentVersion(data.currentVersion);
      setVersions(data.versions);
      setObservations(data.observations);
      setFormulation(data.formulation);
      setApprovals(data.approvals);

      setEditableSteps(data.currentVersion.protocolSteps || []);
      setEditableConclusion(data.currentVersion.conclusion || '');

      // Set default diff versions if available
      if (data.versions.length >= 2) {
        setDiffV1Id(data.versions[1].id);
        setDiffV2Id(data.versions[0].id);
      }
    } catch (err: any) {
      error('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiment();
  }, [experimentId]);

  // Load Diff data when v1 and v2 change
  useEffect(() => {
    if (diffV1Id && diffV2Id && diffV1Id !== diffV2Id) {
      const loadDiff = async () => {
        try {
          setDiffLoading(true);
          const data = await apiRequest(
            `/experiments/${experimentId}/diff?v1=${diffV1Id}&v2=${diffV2Id}`
          );
          setDiffData(data);
        } catch (err: any) {
          console.error(err);
        } finally {
          setDiffLoading(false);
        }
      };
      loadDiff();
    }
  }, [diffV1Id, diffV2Id, experimentId]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    info('Copied to Clipboard', 'SHA-256 integrity hash copied.');
  };

  const handleCommitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitSummary.trim()) {
      error('Commit Error', 'Please describe what changed in this revision.');
      return;
    }

    try {
      const res = await apiRequest<{ experiment: Experiment; version: ExperimentVersion }>(
        `/experiments/${experimentId}/versions`,
        {
          method: 'POST',
          body: JSON.stringify({
            changeSummary: commitSummary,
            bumpType,
            protocolSteps: editableSteps,
            conclusion: editableConclusion,
          }),
        }
      );

      success(
        'Revision Committed',
        `Version ${res.version.versionNumber} committed with SHA-256 hash ${res.version.hashSha256.substring(0, 8)}...`
      );
      setIsCommitModalOpen(false);
      setCommitSummary('');
      fetchExperiment();
    } catch (err: any) {
      error('Commit Failed', err.message);
    }
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsParam.trim() || obsValue === '') {
      error('Validation Error', 'Parameter name and measurement value are required.');
      return;
    }

    try {
      await apiRequest(`/experiments/${experimentId}/observations`, {
        method: 'POST',
        body: JSON.stringify({
          category: obsCategory,
          parameter: obsParam.trim(),
          value: isNaN(Number(obsValue)) ? obsValue : Number(obsValue),
          unit: obsUnit.trim(),
          status: obsStatus,
          notes: obsNotes.trim(),
        }),
      });

      success('Observation Recorded', `Logged ${obsParam} in laboratory notebook.`);
      setIsObsModalOpen(false);
      setObsParam('');
      setObsValue('');
      setObsUnit('');
      setObsNotes('');
      fetchExperiment();
    } catch (err: any) {
      error('Failed to Record', err.message);
    }
  };

  const handleDeleteObservation = async (obsId: string) => {
    if (!confirm('Are you sure you want to delete this observation log?')) return;
    try {
      await apiRequest(`/observations/${obsId}`, { method: 'DELETE' });
      success('Observation Removed', 'Observation deleted from notebook.');
      fetchExperiment();
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  const handleSubmitForApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/approvals/request', {
        method: 'POST',
        body: JSON.stringify({
          experimentId,
          role: approvalRole,
          reason: approvalReason || 'Formal sign-off and verification for research release.',
        }),
      });

      success('Sign-off Requested', 'Notebook submitted for peer/QA approval.');
      setIsApprovalModalOpen(false);
      setApprovalReason('');
      fetchExperiment();
    } catch (err: any) {
      error('Request Failed', err.message);
    }
  };

  if (loading || !experiment || !currentVersion) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading laboratory notebook record...</p>
      </div>
    );
  }

  const isApproved = experiment.status === 'approved';

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-brand-400">
                {experiment.experimentNumber}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                Version {experiment.currentVersionNumber}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                  isApproved
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : experiment.status === 'in_review'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {experiment.status.replace('_', ' ')}
              </span>
              {isApproved && (
                <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Lock className="w-3 h-3" />
                  <span>Locked (21 CFR Part 11)</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white mt-1">{experiment.title}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {!isApproved && (
            <>
              <button
                onClick={() => setIsCommitModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <GitCommit className="w-3.5 h-3.5 text-brand-400" />
                <span>Commit Revision</span>
              </button>
              <button
                onClick={() => setIsApprovalModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Submit for Sign-off</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Cryptographic SHA-256 Checksum Strip */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span className="text-slate-400">SHA-256 Cryptographic Hash:</span>
          <code className="font-mono text-brand-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
            {currentVersion.hashSha256}
          </code>
        </div>
        <button
          onClick={() => copyHash(currentVersion.hashSha256)}
          className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white transition"
        >
          {copiedHash ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800">
        {[
          { id: 'protocol', label: 'Notebook Protocol', icon: BookOpen },
          {
            id: 'versions',
            label: `Version Control & Diff (${versions.length})`,
            icon: GitCompare,
          },
          {
            id: 'observations',
            label: `Data & Observations (${observations.length})`,
            icon: Activity,
          },
          {
            id: 'approvals',
            label: `Signatures & 21 CFR Part 11 (${approvals.length})`,
            icon: FileCheck2,
          },
          { id: 'report', label: 'Official GLP Report', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                isActive
                  ? 'border-brand-500 text-brand-300 bg-brand-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Protocol & Procedure */}
      {activeTab === 'protocol' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Protocol Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Objective & Hypothesis */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                  Scientific Objective
                </h3>
                <p className="text-sm text-slate-200 mt-1.5 leading-relaxed">
                  {currentVersion.objective || 'No objective documented.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Hypothesis
                </h3>
                <p className="text-sm text-slate-200 mt-1.5 leading-relaxed">
                  {currentVersion.hypothesis || 'No hypothesis documented.'}
                </p>
              </div>
            </div>

            {/* Protocol Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-brand-400" />
                  <span>Sequential Experimental Protocol ({currentVersion.protocolSteps.length} Steps)</span>
                </h2>
              </div>

              <div className="space-y-3">
                {currentVersion.protocolSteps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-300 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {step.stepNumber}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] flex-shrink-0">
                        {step.criticalQualityAttribute && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-semibold">
                            CQA Critical
                          </span>
                        )}
                        {step.temperatureCelsius !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {step.temperatureCelsius}°C
                          </span>
                        )}
                        {step.durationMinutes !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {step.durationMinutes} min
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 pl-10 leading-relaxed">
                      {step.instruction}
                    </p>

                    {step.notes && (
                      <div className="ml-10 mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
                        <strong className="text-slate-300">Operator Notes:</strong> {step.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Results & Conclusion */}
            {currentVersion.conclusion && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Experimental Findings & Conclusion
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {currentVersion.conclusion}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Metadata & Linked Formulation (1 Col) */}
          <div className="space-y-6">
            {/* Formulation Card */}
            {formulation ? (
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Linked Formulation
                  </span>
                  <span className="text-xs font-mono font-bold text-brand-400">
                    {formulation.code}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white">{formulation.name}</h4>
                <p className="text-xs text-slate-400">{formulation.description}</p>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batch Volume:</span>
                    <span className="font-mono">{formulation.targetBatchSize} {formulation.batchUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Components:</span>
                    <span className="font-mono">{formulation.ingredients.length} reagents</span>
                  </div>
                </div>

                {onOpenFormulation && (
                  <button
                    onClick={() => onOpenFormulation(formulation.id)}
                    className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center justify-center space-x-1"
                  >
                    <span>View Stoichiometry & Scaling</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500 space-y-1">
                <p>No chemical formulation linked to this study.</p>
              </div>
            )}

            {/* Experiment Metadata */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs text-slate-400">
              <h3 className="font-semibold uppercase tracking-wider text-slate-300 text-xs">
                Notebook Metadata
              </h3>
              <div className="space-y-2 pt-1 divide-y divide-slate-800/60">
                <div className="flex justify-between pt-1">
                  <span>Lead Investigator:</span>
                  <strong className="text-slate-200">{experiment.authorName}</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Project Study:</span>
                  <span className="font-mono text-brand-400">{experiment.projectCode}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Registered:</span>
                  <span>{new Date(experiment.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Last Modified:</span>
                  <span>{new Date(experiment.updatedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Regulatory Status:</span>
                  <span className="text-emerald-400 font-semibold">GLP Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Version History & Diff Inspector */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          {/* Version Diff Inspector Controls */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <GitCompare className="w-4 h-4 text-brand-400" />
                  <span>Version Revision Diff Inspector</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compare protocol steps, objectives, and parameters between any two revisions.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-medium">Base:</span>
                  <select
                    value={diffV1Id}
                    onChange={(e) => setDiffV1Id(e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-medium">Compare With:</span>
                  <select
                    value={diffV2Id}
                    onChange={(e) => setDiffV2Id(e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Render Diff Output */}
            {diffLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Computing cryptographic diff...</div>
            ) : diffData ? (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                {/* Meta Diff info */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase">Base Version</span>
                    <div className="font-bold text-slate-200">v{diffData.v1.versionNumber} by {diffData.v1.authorName}</div>
                    <div className="text-[10px] text-slate-400">SHA-256: {diffData.v1.hash.substring(0, 16)}...</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase">Compared Revision</span>
                    <div className="font-bold text-brand-400">v{diffData.v2.versionNumber} by {diffData.v2.authorName}</div>
                    <div className="text-[10px] text-slate-400">SHA-256: {diffData.v2.hash.substring(0, 16)}...</div>
                  </div>
                </div>

                {/* Steps Diff List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Protocol Steps Comparison
                  </h4>
                  {diffData.stepsDiff?.map((d: any, idx: number) => {
                    const isAdded = d.status === 'added';
                    const isRemoved = d.status === 'removed';
                    const isModified = d.status === 'modified';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isAdded
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                            : isRemoved
                            ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                            : isModified
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold">Step #{d.stepNumber}: {d.current?.title || d.previous?.title}</span>
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {d.status}
                          </span>
                        </div>

                        {isModified && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300">
                              <div className="text-[10px] text-rose-400 font-bold mb-0.5">Previous (v{diffData.v1.versionNumber}):</div>
                              <div>{d.previous.instruction}</div>
                            </div>
                            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                              <div className="text-[10px] text-emerald-400 font-bold mb-0.5">Modified (v{diffData.v2.versionNumber}):</div>
                              <div>{d.current.instruction}</div>
                            </div>
                          </div>
                        )}

                        {!isModified && (
                          <p className="text-[11px] opacity-90">
                            {d.current?.instruction || d.previous?.instruction}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Version Commits Timeline */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-brand-400" />
              <span>Full Revision Commit History</span>
            </h3>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
              {versions.map((v) => (
                <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded border border-brand-500/20">
                        Version {v.versionNumber}
                      </span>
                      <span className="text-xs text-slate-400">by {v.authorName}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{v.changeSummary}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                      <span>SHA-256: {v.hashSha256}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs font-mono text-slate-400">
                      {v.protocolSteps.length} Protocol Steps
                    </span>
                    {v.isLocked && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Real-Time Observations & Data Logger */}
      {activeTab === 'observations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-brand-400" />
                <span>Laboratory Observations & Time-Series Data</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured telemetry, analytical assays, spectrometer readings, and environmental factors.
              </p>
            </div>

            {!isApproved && (
              <button
                onClick={() => setIsObsModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Observation</span>
              </button>
            )}
          </div>

          {/* Observations Table */}
          {observations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 space-y-2">
              <Activity className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No observations recorded yet. Click "Log Observation" to add data.</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Parameter</th>
                      <th className="py-3 px-4 font-mono">Recorded Value</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4">Recorded By</th>
                      {!isApproved && <th className="py-3 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {observations.map((obs) => (
                      <tr key={obs.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(obs.timestamp).toLocaleTimeString()} ({new Date(obs.timestamp).toLocaleDateString()})
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {obs.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {obs.parameter}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-brand-300">
                          {obs.value} {obs.unit}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              obs.status === 'normal'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {obs.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {obs.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {obs.recordedByName}
                        </td>
                        {!isApproved && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteObservation(obs.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Approvals & 21 CFR Part 11 Electronic Signatures */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-start space-x-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                FDA 21 CFR Part 11 Electronic Signatures & Approvals
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Signatures executed on this record are legally binding electronic records. Dual-factor authentication (password re-verification), explicit intent manifestation, and cryptographic digest hashing are enforced.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Signature & Approval Registry ({approvals.length})
            </h4>

            {approvals.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
                <FileCheck2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">No formal approval reviews requested yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((appr) => (
                  <div
                    key={appr.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-brand-400">
                          {appr.experimentNumber}
                        </span>
                        <span className="text-xs text-slate-400">Version {appr.versionNumber}</span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                            appr.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : appr.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {appr.status}
                        </span>
                      </div>

                      <span className="text-xs text-slate-400 font-mono">
                        Requested: {new Date(appr.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p><strong>Intent / Reason:</strong> {appr.signatureReason}</p>
                      {appr.comments && <p><strong>Comments:</strong> {appr.comments}</p>}
                    </div>

                    {appr.status === 'approved' && appr.signatureDigest && (
                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="text-emerald-400">
                          Signed by: <strong>{appr.reviewerName}</strong> ({appr.role.replace('_', ' ')})
                        </div>
                        <div className="text-slate-400 text-right sm:text-right">
                          Timestamp: {new Date(appr.signedAt!).toUTCString()}
                        </div>
                        <div className="sm:col-span-2 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 truncate">
                          Electronic Signature Digest: <span className="text-brand-300">{appr.signatureDigest}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Printable Official GLP Report */}
      {activeTab === 'report' && (
        <div className="p-8 rounded-2xl bg-white text-slate-900 space-y-6 shadow-2xl print:p-0">
          {/* Print Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  BIOSCRIBE ELECTRONIC LABORATORY NOTEBOOK
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Official GLP Analytical Study Protocol & Data Archive
              </p>
            </div>
            <div className="text-right font-mono text-xs text-slate-700">
              <div>RECORD: <strong>{experiment.experimentNumber}</strong></div>
              <div>VERSION: <strong>{currentVersion.versionNumber}</strong></div>
              <div>STATUS: <strong className="uppercase">{experiment.status}</strong></div>
            </div>
          </div>

          {/* Study Summary */}
          <div className="space-y-3 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
              1. General Study Specification
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Title:</strong> {experiment.title}</div>
              <div><strong>Project Code:</strong> {experiment.projectCode}</div>
              <div><strong>Primary Investigator:</strong> {experiment.authorName}</div>
              <div><strong>Registration Date:</strong> {new Date(experiment.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <strong>Objective:</strong> {currentVersion.objective}
            </div>
            <div>
              <strong>Hypothesis:</strong> {currentVersion.hypothesis}
            </div>
          </div>

          {/* Protocol Steps Table */}
          <div className="space-y-2 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
              2. Standard Operating Procedure (SOP)
            </h2>
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 w-12 text-center">Step</th>
                  <th className="p-2">Title & Execution Instruction</th>
                  <th className="p-2 w-24">Temp (°C)</th>
                  <th className="p-2 w-24">Duration</th>
                  <th className="p-2 w-20">CQA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentVersion.protocolSteps.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2 text-center font-bold">{s.stepNumber}</td>
                    <td className="p-2">
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-slate-600 text-[11px]">{s.instruction}</div>
                    </td>
                    <td className="p-2 font-mono">{s.temperatureCelsius ?? '—'}</td>
                    <td className="p-2 font-mono">{s.durationMinutes ? `${s.durationMinutes} min` : '—'}</td>
                    <td className="p-2 font-bold text-center">{s.criticalQualityAttribute ? 'YES' : 'NO'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observations Table */}
          <div className="space-y-2 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
              3. Recorded Data & Analytical Observations ({observations.length})
            </h2>
            <table className="w-full text-left border border-slate-300 text-[11px]">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Parameter</th>
                  <th className="p-2">Observed Value</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Operator Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {observations.map((o) => (
                  <tr key={o.id}>
                    <td className="p-2 font-mono">{new Date(o.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2 font-semibold">{o.parameter}</td>
                    <td className="p-2 font-mono font-bold">{o.value} {o.unit}</td>
                    <td className="p-2 font-bold uppercase">{o.status}</td>
                    <td className="p-2 text-slate-600">{o.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signature Block */}
          <div className="pt-4 border-t-2 border-slate-900 space-y-3 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              4. FDA 21 CFR Part 11 Electronic Signature Attestation
            </h2>
            <div className="p-4 border border-slate-300 bg-slate-50 space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span>Document SHA-256 Hash: {currentVersion.hashSha256}</span>
                <span>Audit Trail Verified: TRUE</span>
              </div>
              {approvals.filter((a) => a.status === 'approved').map((a) => (
                <div key={a.id} className="pt-2 border-t border-slate-200 text-xs">
                  <div>Electronically Signed by: <strong>{a.reviewerName}</strong> ({a.role})</div>
                  <div>Legal Attestation Reason: {a.signatureReason}</div>
                  <div className="font-mono text-[10px] text-slate-500">Digest: {a.signatureDigest}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Commit Revision Modal */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <GitCommit className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">Commit Protocol Revision</h3>
              </div>
              <button onClick={() => setIsCommitModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCommitRevision} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Revision Increment Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bump"
                      value="minor"
                      checked={bumpType === 'minor'}
                      onChange={() => setBumpType('minor')}
                    />
                    <span className="text-slate-300">Minor Revision (e.g. v1.1 - parameter adjustments)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bump"
                      value="major"
                      checked={bumpType === 'major'}
                      onChange={() => setBumpType('major')}
                    />
                    <span className="text-slate-300">Major Revision (e.g. v2.0 - structural change)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Change Summary / Justification *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the scientific justification for modifying the protocol steps or parameters..."
                  value={commitSummary}
                  onChange={(e) => setCommitSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-brand-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Discussion / Results Conclusion
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize analytical findings and conclusions..."
                  value={editableConclusion}
                  onChange={(e) => setEditableConclusion(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-brand-500 focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                A new SHA-256 fingerprint will be computed. Previous version snapshots remain permanently locked in history.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCommitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold shadow-lg shadow-brand-500/20"
                >
                  Commit New Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Observation Modal */}
      {isObsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">Log Analytical Observation</h3>
              </div>
              <button onClick={() => setIsObsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddObservation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={obsCategory}
                    onChange={(e) => setObsCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    <option value="measurement">General Measurement</option>
                    <option value="spectroscopy">Spectroscopy / SPR</option>
                    <option value="chromatography">Chromatography (HPLC/MS)</option>
                    <option value="environmental">Environmental Factor</option>
                    <option value="visual">Visual Observation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status / Quality</label>
                  <select
                    value={obsStatus}
                    onChange={(e) => setObsStatus(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    <option value="normal">Normal / In Spec</option>
                    <option value="anomaly">Anomaly / Out of Spec</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Parameter Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Absorbance (OD600) or Binding KD"
                  value={obsParam}
                  onChange={(e) => setObsParam(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Observed Value *</label>
                  <input
                    type="text"
                    placeholder="e.g. 8.42 or 94.2"
                    value={obsValue}
                    onChange={(e) => setObsValue(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="e.g. nM, %, RU, °C"
                    value={obsUnit}
                    onChange={(e) => setObsUnit(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operator Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional experimental observations or remarks..."
                  value={obsNotes}
                  onChange={(e) => setObsNotes(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsObsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold shadow-lg shadow-brand-500/20"
                >
                  Save Data Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit for Approval Modal */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Submit for Regulatory Sign-off</h3>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForApproval} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Required Review Role</label>
                <select
                  value={approvalRole}
                  onChange={(e) => setApprovalRole(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="peer_review">Peer Review Verification (Dr. Marcus Chen)</option>
                  <option value="qa_compliance">Quality Assurance & Release (Sarah Jenkins, RAC)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Signature Intent / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Formal verification of SPR protocol and kinetic fitting"
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200">
                Submitting will move this experiment to <strong>In Review</strong> status. Once approved, the record is permanently locked from alterations under 21 CFR Part 11.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  Send Sign-off Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
