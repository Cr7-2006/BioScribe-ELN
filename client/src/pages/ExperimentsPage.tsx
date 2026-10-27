import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Experiment, Project, Formulation, ProtocolStep } from '../types';
import { useNotification } from '../context/NotificationContext';
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Layers,
  Clock,
  CheckCircle2,
  Trash2,
  FileText,
  ShieldCheck,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatDisplayDate } from '../utils/date';

interface ExperimentsPageProps {
  onOpenExperiment: (id: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const ExperimentsPage: React.FC<ExperimentsPageProps> = ({
  onOpenExperiment,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const { success, error } = useNotification();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // New Experiment Form State
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newFormulationId, setNewFormulationId] = useState('');
  const [steps, setSteps] = useState<Omit<ProtocolStep, 'id'>[]>([
    {
      stepNumber: 1,
      title: 'Initial Sample Preparation & Equipment Equilibration',
      instruction: 'Thaw reagents on ice. Equilibrate instrument to target temperature and baseline.',
      durationMinutes: 30,
      temperatureCelsius: 22,
      criticalQualityAttribute: true,
      notes: 'Verify buffer pH prior to injection.',
    },
    {
      stepNumber: 2,
      title: 'Compound Addition & Incubation Phase',
      instruction: 'Aliquot test compound into multi-well plate or flow channel. Incubate under controlled agitation.',
      durationMinutes: 60,
      temperatureCelsius: 37,
      criticalQualityAttribute: false,
      notes: '',
    },
  ]);

  const applyTemplate = (templateKey: 'spr' | 'cell' | 'purification') => {
    if (templateKey === 'spr') {
      setNewTitle('Surface Plasmon Resonance (SPR) Kinetics Assay');
      setNewObjective('Determine equilibrium dissociation constant (KD) and on/off association kinetics for lead candidate BSC-900.');
      setNewHypothesis('Analyte demonstrates nanomolar binding affinity (KD < 15 nM) with minimal non-specific sensor drift.');
      setSteps([
        {
          stepNumber: 1,
          title: 'Sensor Chip CM5 Equilibration & Baseline',
          instruction: 'Dock CM5 sensor chip into optical block. Equilibrate with running buffer at 25°C until baseline drift < 0.1 RU/min.',
          durationMinutes: 20,
          temperatureCelsius: 25,
          criticalQualityAttribute: true,
          notes: 'Buffer must be degassed and 0.22 um filtered.',
        },
        {
          stepNumber: 2,
          title: 'Target Protein Capture & Immobilization',
          instruction: 'Immobilize capture target via NHS/EDC amine coupling to reach target surface density of 500-800 RU.',
          durationMinutes: 30,
          temperatureCelsius: 25,
          criticalQualityAttribute: true,
          notes: 'Ensure reference flow cell remains untreated.',
        },
        {
          stepNumber: 3,
          title: 'Analyte Injection Series (Multi-Cycle Kinetics)',
          instruction: 'Inject 5 serial dilutions of test compound at 30 uL/min with 180s association time and 600s dissociation phase.',
          durationMinutes: 60,
          temperatureCelsius: 25,
          criticalQualityAttribute: true,
          notes: 'Include double-referencing buffer blank injections.',
        },
        {
          stepNumber: 4,
          title: 'Surface Regeneration Phase',
          instruction: 'Regenerate sensor surface with 10 mM Glycine-HCl (pH 2.0) pulse of 30 seconds to restore baseline.',
          durationMinutes: 15,
          temperatureCelsius: 25,
          criticalQualityAttribute: false,
          notes: '',
        },
      ]);
    } else if (templateKey === 'cell') {
      setNewTitle('Mammalian Cell Proliferation & Cytotoxicity Screen');
      setNewObjective('Evaluate dose-dependent cell viability using CellTiter-Glo luminescent assay.');
      setNewHypothesis('Lead candidate inhibits cellular proliferation with IC50 within target 5-20 nM range.');
      setSteps([
        {
          stepNumber: 1,
          title: 'Cell Seeding in 96-Well Microplates',
          instruction: 'Harvest cells, count with hemocytometer, and seed 5,000 cells/well in 100 uL complete growth medium.',
          durationMinutes: 45,
          temperatureCelsius: 37,
          criticalQualityAttribute: true,
          notes: 'Incubate overnight at 37°C in 5% CO2 for cell attachment.',
        },
        {
          stepNumber: 2,
          title: 'Serial Compound Addition & Incubation Phase',
          instruction: 'Add 10-point 3-fold serial dilutions of test compound in triplicate. Incubate for 72 hours.',
          durationMinutes: 60,
          temperatureCelsius: 37,
          criticalQualityAttribute: true,
          notes: 'Maintain DMSO concentration <= 0.1% across all wells.',
        },
        {
          stepNumber: 3,
          title: 'Luminescent Reagent Addition & Plate Reading',
          instruction: 'Add equal volume of CellTiter-Glo reagent, shake for 2 minutes, incubate for 10 minutes, and record luminescence on plate reader.',
          durationMinutes: 30,
          temperatureCelsius: 22,
          criticalQualityAttribute: false,
          notes: 'Record relative light units (RLU).',
        },
      ]);
    } else if (templateKey === 'purification') {
      setNewTitle('Affinity Chromatography & Buffer Exchange Protocol');
      setNewObjective('Purify recombinant His-tagged target protein to >95% purity for structural analysis.');
      setNewHypothesis('Single-step Ni-NTA purification yields active monomeric fraction without aggregation.');
      setSteps([
        {
          stepNumber: 1,
          title: 'Ni-NTA Column Equilibration',
          instruction: 'Wash and equilibrate 5 mL HisTrap column with 5 column volumes of binding buffer (50 mM Tris, 300 mM NaCl, 10 mM imidazole, pH 7.8).',
          durationMinutes: 30,
          temperatureCelsius: 4,
          criticalQualityAttribute: false,
          notes: 'Run at 2 mL/min in 4°C cold cabinet.',
        },
        {
          stepNumber: 2,
          title: 'Clarified Cell Lysate Loading & Wash',
          instruction: 'Load clarified lysate onto column at 1 mL/min. Wash with 10 column volumes of wash buffer (25 mM imidazole) until UV280 baseline.',
          durationMinutes: 60,
          temperatureCelsius: 4,
          criticalQualityAttribute: true,
          notes: 'Collect flowthrough and wash fractions.',
        },
        {
          stepNumber: 3,
          title: 'Elution with 300 mM Imidazole Buffer',
          instruction: 'Elute bound target protein using step gradient of 300 mM imidazole buffer. Collect 1 mL fractions across the UV absorption peak.',
          durationMinutes: 30,
          temperatureCelsius: 4,
          criticalQualityAttribute: true,
          notes: 'Peak fractions pooled based on A280 absorbances.',
        },
        {
          stepNumber: 4,
          title: 'Desalting Buffer Exchange into Storage Buffer',
          instruction: 'Pass pooled eluate through PD-10 desalting column equilibrated with 1x PBS buffer. Aliquot and flash freeze at -80°C.',
          durationMinutes: 45,
          temperatureCelsius: 4,
          criticalQualityAttribute: true,
          notes: 'Measure final protein concentration by Nanodrop A280.',
        },
      ]);
    }
    success('Template Loaded', 'Form pre-filled with sample scientific protocol!');
  };

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProject) params.append('projectCode', selectedProject);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery) params.append('query', searchQuery);

      const [expData, prjData, formData] = await Promise.all([
        apiRequest<{ experiments: Experiment[] }>(`/experiments?${params.toString()}`),
        apiRequest<{ projects: Project[] }>('/projects'),
        apiRequest<{ formulations: Formulation[] }>('/formulations'),
      ]);

      setExperiments(expData.experiments);
      setProjects(prjData.projects);
      setFormulations(formData.formulations);
      if (!newProjectCode && prjData.projects.length > 0) {
        setNewProjectCode(prjData.projects[0].code);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [selectedProject, selectedStatus, searchQuery]);

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        title: `Protocol Step ${steps.length + 1}`,
        instruction: '',
        durationMinutes: 15,
        temperatureCelsius: 25,
        criticalQualityAttribute: false,
        notes: '',
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(updated);
  };

  const handleStepChange = (index: number, field: string, val: any) => {
    const updated = [...steps];
    (updated[index] as any)[field] = val;
    setSteps(updated);
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProjectCode) {
      error('Validation Error', 'Title and Project Code are required.');
      return;
    }

    try {
      const payload = {
        projectCode: newProjectCode,
        title: newTitle.trim(),
        objective: newObjective.trim(),
        hypothesis: newHypothesis.trim(),
        formulationId: newFormulationId || undefined,
        protocolSteps: steps,
      };

      const res = await apiRequest<{ experiment: Experiment }>('/experiments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      success('Experiment Created', `${res.experiment.experimentNumber} registered with initial version 1.0.`);
      setIsCreateModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewObjective('');
      setNewHypothesis('');
      setNewFormulationId('');
      fetchExperiments();
      onOpenExperiment(res.experiment.id);
    } catch (err: any) {
      error('Creation Failed', err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Electronic Laboratory Notebooks (ELN)</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Browse, version, and document experimental protocols with immutable audit trails.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-semibold transition shadow-md shadow-brand-500/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by experiment #, title, objective, or investigator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-sm focus:outline-none focus:border-brand-500 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-brand-500 transition"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code}: {p.name.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-brand-500 transition capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved & Locked</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Experiments Grid / List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Fetching notebook entries...</p>
        </div>
      ) : experiments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">No experiments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new notebook experiment entry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {experiments.map((exp) => {
            const statusConfig = {
              draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
              in_review: { label: 'In Review', color: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30' },
              approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30' },
              rejected: { label: 'Rejected', color: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30' },
            }[exp.status];

            return (
              <div
                key={exp.id}
                onClick={() => onOpenExperiment(exp.id)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:shadow-brand-500/5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-500/20">
                      {exp.experimentNumber}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-brand-600 dark:group-hover:text-brand-300 transition line-clamp-2">
                    {exp.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {exp.objective || 'No objective outlined.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Investigator: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{exp.authorName}</strong></span>
                    <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]">
                      v{exp.currentVersionNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDisplayDate(exp.updatedAt)}</span>
                    </span>
                    <span>
                      {exp.observationsCount || 0} observations • {exp.versionsCount || 1} versions
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Experiment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Laboratory Experiment</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registers baseline version 1.0 with SHA-256 cryptographic verification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Template Selector */}
            <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-900 dark:text-brand-300">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>1-Click Quick-Fill Templates</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Pre-populates fields & protocol steps</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => applyTemplate('spr')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-brand-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-brand-300 dark:border-brand-800/80 shadow-sm transition flex items-center space-x-1.5"
                >
                  <span>🧪 Surface Plasmon Resonance</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('cell')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-brand-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-brand-300 dark:border-brand-800/80 shadow-sm transition flex items-center space-x-1.5"
                >
                  <span>🧫 Cell Viability Assay</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('purification')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-brand-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-brand-300 dark:border-brand-800/80 shadow-sm transition flex items-center space-x-1.5"
                >
                  <span>🔬 Protein Purification</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Project / Study Code *
                  </label>
                  <select
                    value={newProjectCode}
                    onChange={(e) => setNewProjectCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.code}>
                        {p.code} - {p.name.substring(0, 35)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Linked Formulation Recipe (Optional)
                  </label>
                  <select
                    value={newFormulationId}
                    onChange={(e) => setNewFormulationId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">None (Stand-alone Protocol)</option>
                    {formulations.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code}: {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Experiment Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dose-Response Surface Plasmon Resonance of PROTAC BSC-401"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:border-brand-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Scientific Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="State the core objective or research aim of this protocol..."
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:border-brand-500 focus:outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Testable Hypothesis
                </label>
                <textarea
                  rows={2}
                  placeholder="Specify the working hypothesis and anticipated outcome..."
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:border-brand-500 focus:outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              {/* Protocol Steps Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Sequential Protocol Steps ({steps.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center space-x-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          Step #{step.stepNumber}
                        </span>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Step title (e.g. Column Equilibration)"
                        value={step.title}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-brand-500 focus:outline-none"
                        required
                      />

                      <textarea
                        rows={2}
                        placeholder="Detailed execution instructions..."
                        value={step.instruction}
                        onChange={(e) => handleStepChange(idx, 'instruction', e.target.value)}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-brand-500 focus:outline-none resize-none"
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                            Duration (min)
                          </label>
                          <input
                            type="number"
                            value={step.durationMinutes || 0}
                            onChange={(e) => handleStepChange(idx, 'durationMinutes', e.target.value)}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                            Temp (°C)
                          </label>
                          <input
                            type="number"
                            value={step.temperatureCelsius || 0}
                            onChange={(e) => handleStepChange(idx, 'temperatureCelsius', e.target.value)}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-4">
                          <input
                            type="checkbox"
                            id={`cqa-${idx}`}
                            checked={step.criticalQualityAttribute}
                            onChange={(e) => handleStepChange(idx, 'criticalQualityAttribute', e.target.checked)}
                            className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-0"
                          />
                          <label htmlFor={`cqa-${idx}`} className="text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                            Critical Quality CQA
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory preview notice */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Upon submission, an immutable SHA-256 fingerprint will be generated for Version 1.0.</span>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 text-sm font-semibold shadow-md shadow-brand-500/20"
                >
                  Initialize Experiment & Version 1.0
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
