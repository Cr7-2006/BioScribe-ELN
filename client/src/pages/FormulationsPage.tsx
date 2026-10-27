import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Formulation, FormulationIngredient } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { exportCertifiedFormulationPdf } from '../utils/pdfExport';
import { ReagentBarcodeModal, ScannedReagent } from '../components/reagents/ReagentBarcodeModal';
import {
  FlaskRound,
  Plus,
  Search,
  Scale,
  Calculator,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Printer,
  Sparkles,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

interface FormulationsPageProps {
  initialFormulationId?: string;
  isCreateModalOpen?: boolean;
  setIsCreateModalOpen?: (open: boolean) => void;
}

export const FormulationsPage: React.FC<FormulationsPageProps> = ({
  initialFormulationId,
  isCreateModalOpen: controlledCreateModalOpen,
  setIsCreateModalOpen: setControlledCreateModalOpen,
}) => {
  const { user } = useAuth();
  const { success, error } = useNotification();

  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [selectedFormulation, setSelectedFormulation] = useState<Formulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Scaling Calculator State
  const [targetScaleSize, setTargetScaleSize] = useState<number>(1000);
  const [scaledData, setScaledData] = useState<any>(null);

  // New Formulation Modal State
  const [internalCreateModalOpen, setInternalCreateModalOpen] = useState(false);
  const isCreateModalOpen =
    controlledCreateModalOpen !== undefined ? controlledCreateModalOpen : internalCreateModalOpen;
  const setIsCreateModalOpen = setControlledCreateModalOpen || setInternalCreateModalOpen;

  // Batch Preparation Sheet Modal State
  const [isBatchSheetModalOpen, setIsBatchSheetModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBatchSize, setNewBatchSize] = useState(1000);
  const [newBatchUnit, setNewBatchUnit] = useState<'mL' | 'L' | 'g' | 'kg'>('mL');
  const [ingredients, setIngredients] = useState<Omit<FormulationIngredient, 'id'>[]>([
    {
      name: 'Sodium Chloride (NaCl)',
      casNumber: '7647-14-5',
      lotNumber: 'LOT-NACL-01',
      molecularWeight: 58.44,
      purityPercentage: 99.5,
      targetQuantity: 8.766,
      unit: 'g',
      role: 'excipient',
      hazards: [],
    },
    {
      name: 'Tris Base',
      casNumber: '77-86-1',
      lotNumber: 'LOT-TRIS-02',
      molecularWeight: 121.14,
      purityPercentage: 99.8,
      targetQuantity: 6.057,
      unit: 'g',
      role: 'buffer',
      hazards: ['GHS07 Eye/Skin Irritant'],
    },
  ]);

  const applyRecipePreset = (presetKey: 'pbs' | 'tris' | 'ripa') => {
    if (presetKey === 'pbs') {
      setNewName('10x Phosphate-Buffered Saline (PBS) Stock Solution');
      setNewDesc('Standard biological buffer for cell washing and assays. Dilute 1:10 with ultrapure water for 1x PBS (pH 7.4).');
      setNewBatchSize(1000);
      setNewBatchUnit('mL');
      setIngredients([
        {
          name: 'Sodium Chloride (NaCl)',
          casNumber: '7647-14-5',
          lotNumber: 'LOT-NACL-01',
          molecularWeight: 58.44,
          purityPercentage: 99.5,
          targetQuantity: 80.0,
          unit: 'g',
          role: 'excipient',
          hazards: [],
        },
        {
          name: 'Potassium Chloride (KCl)',
          casNumber: '7447-40-7',
          lotNumber: 'LOT-KCL-02',
          molecularWeight: 74.55,
          purityPercentage: 99.0,
          targetQuantity: 2.0,
          unit: 'g',
          role: 'excipient',
          hazards: [],
        },
        {
          name: 'Disodium Hydrogen Phosphate (Na2HPO4)',
          casNumber: '7558-79-4',
          lotNumber: 'LOT-NA2HPO4-03',
          molecularWeight: 141.96,
          purityPercentage: 99.0,
          targetQuantity: 14.4,
          unit: 'g',
          role: 'buffer',
          hazards: [],
        },
        {
          name: 'Potassium Dihydrogen Phosphate (KH2PO4)',
          casNumber: '7778-77-0',
          lotNumber: 'LOT-KH2PO4-04',
          molecularWeight: 136.09,
          purityPercentage: 99.0,
          targetQuantity: 2.4,
          unit: 'g',
          role: 'buffer',
          hazards: [],
        },
      ]);
    } else if (presetKey === 'tris') {
      setNewName('1M Tris-HCl Buffer Stock (pH 8.0)');
      setNewDesc('Primary buffer solution for molecular biology, enzymatic assays, and electrophoresis.');
      setNewBatchSize(1000);
      setNewBatchUnit('mL');
      setIngredients([
        {
          name: 'Tris Base (Tris(hydroxymethyl)aminomethane)',
          casNumber: '77-86-1',
          lotNumber: 'LOT-TRIS-01',
          molecularWeight: 121.14,
          purityPercentage: 99.8,
          targetQuantity: 121.14,
          unit: 'g',
          role: 'buffer',
          hazards: ['GHS07 Eye/Skin Irritant'],
        },
        {
          name: 'Hydrochloric Acid (HCl 37%)',
          casNumber: '7647-01-0',
          lotNumber: 'LOT-HCL-02',
          molecularWeight: 36.46,
          purityPercentage: 37.0,
          targetQuantity: 42.0,
          unit: 'mL',
          role: 'buffer',
          hazards: ['GHS05 Corrosive', 'GHS07 Irritant'],
        },
      ]);
    } else if (presetKey === 'ripa') {
      setNewName('RIPA Cell Lysis & Protein Extraction Buffer');
      setNewDesc('High-efficiency lysis buffer with non-ionic and ionic detergents for total cellular protein extraction.');
      setNewBatchSize(500);
      setNewBatchUnit('mL');
      setIngredients([
        {
          name: 'Sodium Chloride (NaCl)',
          casNumber: '7647-14-5',
          lotNumber: 'LOT-NACL-01',
          molecularWeight: 58.44,
          purityPercentage: 99.5,
          targetQuantity: 4.38,
          unit: 'g',
          role: 'excipient',
          hazards: [],
        },
        {
          name: 'Triton X-100',
          casNumber: '9002-93-1',
          lotNumber: 'LOT-TRITON-02',
          molecularWeight: 624.82,
          purityPercentage: 100.0,
          targetQuantity: 5.0,
          unit: 'mL',
          role: 'excipient',
          hazards: ['GHS07 Eye Irritant', 'GHS09 Environmental'],
        },
        {
          name: 'Sodium Deoxycholate',
          casNumber: '302-95-4',
          lotNumber: 'LOT-DOC-03',
          molecularWeight: 414.55,
          purityPercentage: 98.0,
          targetQuantity: 2.5,
          unit: 'g',
          role: 'excipient',
          hazards: ['GHS07 Harmful'],
        },
        {
          name: 'Tris-HCl (pH 8.0, 50 mM)',
          casNumber: '1185-53-1',
          lotNumber: 'LOT-TRISHCL-04',
          molecularWeight: 157.60,
          purityPercentage: 99.0,
          targetQuantity: 3.94,
          unit: 'g',
          role: 'buffer',
          hazards: [],
        },
      ]);
    }
    success('Recipe Preset Loaded', 'Form pre-filled with standard laboratory buffer formula!');
  };

  const fetchFormulations = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ formulations: Formulation[] }>('/formulations');
      setFormulations(data.formulations);

      if (data.formulations.length > 0) {
        const toSelect = initialFormulationId
          ? data.formulations.find((f) => f.id === initialFormulationId) || data.formulations[0]
          : data.formulations[0];
        loadFormulationDetails(toSelect.id);
      }
    } catch (err: any) {
      error('Failed to load', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedFormulation) return;
    try {
      setIsExportingPdf(true);
      await exportCertifiedFormulationPdf(selectedFormulation, user?.name || 'Formulation Chemist');
      success('Formulation PDF Exported', `${selectedFormulation.code} master specification downloaded.`);
    } catch (err: any) {
      error('Export Failed', err.message || 'Failed to export formulation specification PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleImportReagent = (reagent: ScannedReagent) => {
    setIngredients((prev) => [
      ...prev,
      {
        name: reagent.name,
        casNumber: reagent.casNumber,
        lotNumber: reagent.lotNumber,
        molecularWeight: reagent.molecularWeight,
        purityPercentage: reagent.purityPercentage,
        targetQuantity: reagent.targetQuantity,
        unit: reagent.unit,
        role: reagent.role,
        hazards: reagent.hazards,
      },
    ]);
    success('Reagent Added', `${reagent.name} (Lot: ${reagent.lotNumber}) imported into formulation.`);
  };

  useEffect(() => {
    fetchFormulations();
  }, [initialFormulationId]);

  const loadFormulationDetails = async (id: string) => {
    try {
      const data = await apiRequest<{ formulation: Formulation }>(`/formulations/${id}`);
      setSelectedFormulation(data.formulation);
      setTargetScaleSize(data.formulation.targetBatchSize);
      calculateScale(data.formulation, data.formulation.targetBatchSize);
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  const calculateScale = async (form: Formulation, newSize: number) => {
    try {
      const res = await apiRequest('/formulations/calculate', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: form.ingredients,
          currentBatchSize: form.targetBatchSize,
          newBatchSize: newSize,
          batchUnit: form.batchUnit,
        }),
      });
      setScaledData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScaleChange = (val: number) => {
    setTargetScaleSize(val);
    if (selectedFormulation && val > 0) {
      calculateScale(selectedFormulation, val);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        name: '',
        casNumber: '',
        lotNumber: 'LOT-NEW',
        molecularWeight: 100,
        purityPercentage: 99.0,
        targetQuantity: 1.0,
        unit: 'g',
        role: 'active_moiety',
        hazards: [],
      },
    ]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleIngChange = (idx: number, field: string, val: any) => {
    const updated = [...ingredients];
    (updated[idx] as any)[field] = val;
    setIngredients(updated);
  };

  const handleCreateFormulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      error('Validation Error', 'Formulation name is required.');
      return;
    }

    try {
      const payload = {
        name: newName.trim(),
        description: newDesc.trim(),
        targetBatchSize: Number(newBatchSize),
        batchUnit: newBatchUnit,
        ingredients,
      };

      const res = await apiRequest<{ formulation: Formulation }>('/formulations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      success('Formulation Created', `Registered ${res.formulation.code}: ${res.formulation.name}`);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDesc('');
      fetchFormulations();
    } catch (err: any) {
      error('Creation Failed', err.message);
    }
  };

  const filteredFormulations = formulations.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <FlaskRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Chemical & Biological Formulations</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Standardized reagent recipes, dynamic stoichiometry, and batch scaling calculator.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-md shadow-indigo-500/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Recipe</span>
        </button>
      </div>

      {/* Main Grid: List on Left, Active Formulation & Calculator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Recipes Catalog */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search formulations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading recipes...</div>
            ) : filteredFormulations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                No formulations matched.
              </div>
            ) : (
              filteredFormulations.map((f) => {
                const isSelected = selectedFormulation?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => loadFormulationDetails(f.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 shadow-sm ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-500/50 ring-1 ring-indigo-400/30'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {f.code}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {f.targetBatchSize} {f.batchUnit}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{f.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{f.description}</p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
                      <span>{f.ingredients?.length || f.ingredientsCount || 0} Ingredients</span>
                      <span>By {f.authorName}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Active Formulation Details & Batch Scaling Calculator (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedFormulation ? (
            <>
              {/* Formulation Header Banner */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                        {selectedFormulation.code}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Author: {selectedFormulation.authorName}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {selectedFormulation.name}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Base Batch</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedFormulation.targetBatchSize} {selectedFormulation.batchUnit}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Theor. Yield</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedFormulation.theoreticalYieldPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedFormulation.description}
                </p>

                {/* Interactive Dynamic Batch Scaling Calculator Slider */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Interactive Batch Scaling Calculator
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Target Size:</span>
                      <input
                        type="number"
                        value={targetScaleSize}
                        onChange={(e) => handleScaleChange(Number(e.target.value))}
                        className="w-24 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white text-center focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {selectedFormulation.batchUnit}
                      </span>
                    </div>
                  </div>

                  {/* Preset Multipliers */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mr-1">Scaling Presets:</span>
                    {[0.25, 0.5, 1, 2, 5, 10].map((mult) => {
                      const baseline = selectedFormulation.targetBatchSize || 1000;
                      const computedSize = Math.round(baseline * mult);
                      const isCurrent = targetScaleSize === computedSize;
                      return (
                        <button
                          key={mult}
                          type="button"
                          onClick={() => handleScaleChange(computedSize)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
                          }`}
                        >
                          {mult}x {mult === 1 ? '(Baseline)' : ''}
                        </button>
                      );
                    })}
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={10}
                    max={10000}
                    step={10}
                    value={targetScaleSize}
                    onChange={(e) => handleScaleChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    <span>10 {selectedFormulation.batchUnit} (Micro/Pilot)</span>
                    <span>Scaling Factor: {((targetScaleSize / (selectedFormulation.targetBatchSize || 1))).toFixed(2)}x</span>
                    <span>10,000 {selectedFormulation.batchUnit} (Production)</span>
                  </div>
                </div>
              </div>

              {/* Ingredients & Stoichiometry Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm space-y-3">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Scaled Stoichiometry & Reagent Inventory Requirements</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsBatchSheetModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Cleanroom Batch Sheet</span>
                    </button>
                    <button
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand-600 dark:hover:bg-brand-500 text-xs font-semibold transition shadow-sm disabled:opacity-50"
                      title="Export Official Master Formulation PDF"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-400 dark:text-brand-200" />
                      <span>{isExportingPdf ? 'Exporting...' : 'Certified PDF'}</span>
                    </button>
                    <button
                      onClick={() => setIsBarcodeModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 dark:text-brand-300 text-xs font-semibold border border-brand-200 dark:border-brand-800 transition shadow-sm"
                      title="Scan 2D Barcode / QR Code for Reagent Bottles"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan Reagents</span>
                    </button>
                    <span className="text-xs font-mono text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                      {targetScaleSize} {selectedFormulation.batchUnit} Batch
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Component / Reagent</th>
                        <th className="py-3 px-4 font-mono">CAS #</th>
                        <th className="py-3 px-4 font-mono">Lot #</th>
                        <th className="py-3 px-4 font-mono">MW (g/mol)</th>
                        <th className="py-3 px-4 font-mono">Scaled Amount</th>
                        <th className="py-3 px-4">Concentration</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Hazards</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {(scaledData?.ingredients || selectedFormulation.ingredients).map((ing: any) => (
                        <tr key={ing.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {ing.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {ing.casNumber}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {ing.lotNumber}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {ing.molecularWeight || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-300">
                            {ing.targetQuantity} {ing.unit}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {ing.calculatedConcentration || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {ing.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ing.hazards && ing.hazards.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {ing.hazards.map((h: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                                  >
                                    {h}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-[11px]">Non-hazardous</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              Select a formulation from the catalog to view details and calculate batch scaling.
            </div>
          )}
        </div>
      </div>

      {/* New Formulation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FlaskRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Formulation Recipe</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                ✕
              </button>
            </div>

            {/* Quick Preset Selector */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>1-Click Sample Recipes</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Pre-populates reagents, CAS, and weights</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => applyRecipePreset('pbs')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-indigo-300 dark:border-indigo-800/80 shadow-sm transition flex items-center space-x-1.5"
                >
                  <span>🧪 10x PBS Buffer</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyRecipePreset('tris')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-indigo-300 dark:border-indigo-800/80 shadow-sm transition flex items-center space-x-1.5"
                >
                  <span>⚗️ 1M Tris-HCl Buffer (pH 8.0)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyRecipePreset('ripa')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-indigo-300 dark:border-indigo-800/80 shadow-sm transition flex items-center space-x-1.5"
                >
                  <span>🧫 RIPA Lysis Buffer</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateFormulation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Recipe Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. HEPES 20mM + Trehalose 50mM Cryoprotectant Solution"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Target Batch Size *</label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      value={newBatchSize}
                      onChange={(e) => setNewBatchSize(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                      required
                    />
                    <select
                      value={newBatchUnit}
                      onChange={(e) => setNewBatchUnit(e.target.value as any)}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="mL">mL</option>
                      <option value="L">L</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Recipe Description & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Mixing instructions, pH adjustment specs, sterile filtration procedures..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 resize-none focus:border-indigo-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              {/* Dynamic Reagents Table Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Reagents & Ingredients ({ingredients.length})
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsBarcodeModalOpen(true)}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold flex items-center space-x-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan & Import Reagent</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Reagent</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-700 dark:text-slate-400 font-semibold">
                          Ingredient #{idx + 1}
                        </span>
                        {ingredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Component Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Tris Base or Trehalose"
                            value={ing.name}
                            onChange={(e) => handleIngChange(idx, 'name', e.target.value)}
                            className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">CAS Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 77-86-1"
                            value={ing.casNumber}
                            onChange={(e) => handleIngChange(idx, 'casNumber', e.target.value)}
                            className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Lot Number</label>
                          <input
                            type="text"
                            placeholder="e.g. LOT-401"
                            value={ing.lotNumber}
                            onChange={(e) => handleIngChange(idx, 'lotNumber', e.target.value)}
                            className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Target Quantity *</label>
                          <input
                            type="number"
                            step="any"
                            value={ing.targetQuantity}
                            onChange={(e) => handleIngChange(idx, 'targetQuantity', Number(e.target.value))}
                            className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Unit</label>
                          <select
                            value={ing.unit}
                            onChange={(e) => handleIngChange(idx, 'unit', e.target.value)}
                            className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="g">g</option>
                            <option value="mg">mg</option>
                            <option value="mL">mL</option>
                            <option value="uL">µL</option>
                            <option value="L">L</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Mol. Weight (g/mol)</label>
                          <input
                            type="number"
                            step="any"
                            value={ing.molecularWeight || ''}
                            onChange={(e) => handleIngChange(idx, 'molecularWeight', Number(e.target.value))}
                            className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Role</label>
                          <select
                            value={ing.role}
                            onChange={(e) => handleIngChange(idx, 'role', e.target.value)}
                            className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="active_moiety">Active Moiety</option>
                            <option value="buffer">Buffer</option>
                            <option value="solvent">Solvent</option>
                            <option value="excipient">Excipient</option>
                            <option value="catalyst">Catalyst</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20"
                >
                  Save Formulation Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Cleanroom Batch Preparation Sheet Modal */}
      {isBatchSheetModalOpen && selectedFormulation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-slate-950">BioScribe ELN</span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-200 text-slate-800">
                    Batch Preparation & Formulation Sheet
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">Cleanroom Compounding & Recipe Execution Record</p>
              </div>
              <div className="flex items-center space-x-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center space-x-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sheet / PDF</span>
                </button>
                <button
                  onClick={() => setIsBatchSheetModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Batch Metadata Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Formulation Code</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedFormulation.code}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Batch Size</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {targetScaleSize} {selectedFormulation.batchUnit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Author / Lead</span>
                <span className="font-semibold text-slate-900">{selectedFormulation.authorName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Scaling Factor</span>
                <span className="font-mono font-semibold text-slate-900">
                  {((targetScaleSize / (selectedFormulation.targetBatchSize || 1))).toFixed(2)}x
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-950">{selectedFormulation.name}</h2>
              {selectedFormulation.description && (
                <p className="text-xs text-slate-600 mt-1">{selectedFormulation.description}</p>
              )}
            </div>

            {/* Reagents Table with Weigh-in Checkboxes */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Dispensed Reagents & Tare Weight Verification
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 w-8 text-center">✓</th>
                    <th className="p-2">Ingredient / Reagent</th>
                    <th className="p-2 font-mono">CAS / Lot</th>
                    <th className="p-2 font-mono text-right">Target Weight</th>
                    <th className="p-2 w-28">Actual Tare</th>
                    <th className="p-2 w-24 text-center">Tech Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(scaledData?.ingredients || selectedFormulation.ingredients).map((ing: any) => (
                    <tr key={ing.id} className="text-slate-800">
                      <td className="p-2 text-center">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-400" />
                      </td>
                      <td className="p-2 font-semibold">
                        {ing.name}
                        {ing.hazards && ing.hazards.length > 0 && (
                          <div className="text-[10px] text-amber-700 font-normal">⚠️ {ing.hazards.join(', ')}</div>
                        )}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-600">
                        {ing.casNumber} / {ing.lotNumber}
                      </td>
                      <td className="p-2 font-mono font-bold text-right text-slate-950">
                        {ing.targetQuantity} {ing.unit}
                      </td>
                      <td className="p-2 border-b border-dashed border-slate-400">______ {ing.unit}</td>
                      <td className="p-2 border-b border-dashed border-slate-400 text-center">________</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Operator Attestation Signature Box */}
            <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <span className="block font-bold text-slate-900">Compounding Technician / Operator:</span>
                <div className="border-b border-slate-400 pt-6"></div>
                <span className="text-[10px] text-slate-500">Signature / Employee ID / Date</span>
              </div>
              <div className="space-y-2">
                <span className="block font-bold text-slate-900">QA / Witness Verification:</span>
                <div className="border-b border-slate-400 pt-6"></div>
                <span className="text-[10px] text-slate-500">Signature / Date / Witness Verification</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2D Barcode & QR Code Reagent Scanner / Generator Modal */}
      <ReagentBarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onImportReagent={handleImportReagent}
      />
    </div>
  );
};
