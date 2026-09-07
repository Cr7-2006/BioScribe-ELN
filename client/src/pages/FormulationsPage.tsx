import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Formulation, FormulationIngredient } from '../types';
import { useNotification } from '../context/NotificationContext';
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
} from 'lucide-react';

interface FormulationsPageProps {
  initialFormulationId?: string;
}

export const FormulationsPage: React.FC<FormulationsPageProps> = ({ initialFormulationId }) => {
  const { success, error } = useNotification();

  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [selectedFormulation, setSelectedFormulation] = useState<Formulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Scaling Calculator State
  const [targetScaleSize, setTargetScaleSize] = useState<number>(1000);
  const [scaledData, setScaledData] = useState<any>(null);

  // New Formulation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FlaskRound className="w-6 h-6 text-indigo-400" />
            <span>Chemical & Biological Formulations</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Standardized reagent recipes, dynamic stoichiometry, and batch scaling calculator.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-lg shadow-indigo-500/20 text-sm"
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
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading recipes...</div>
            ) : filteredFormulations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                No formulations matched.
              </div>
            ) : (
              filteredFormulations.map((f) => {
                const isSelected = selectedFormulation?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => loadFormulationDetails(f.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        {f.code}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {f.targetBatchSize} {f.batchUnit}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white line-clamp-1">{f.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{f.description}</p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80">
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
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                        {selectedFormulation.code}
                      </span>
                      <span className="text-xs text-slate-400">
                        Author: {selectedFormulation.authorName}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">
                      {selectedFormulation.name}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-slate-500 block text-[10px] uppercase">Base Batch</span>
                      <span className="font-bold text-slate-200">
                        {selectedFormulation.targetBatchSize} {selectedFormulation.batchUnit}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-slate-500 block text-[10px] uppercase">Theor. Yield</span>
                      <span className="font-bold text-emerald-400">
                        {selectedFormulation.theoreticalYieldPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedFormulation.description}
                </p>

                {/* Interactive Dynamic Batch Scaling Calculator Slider */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Interactive Batch Scaling Calculator
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">Target Size:</span>
                      <input
                        type="number"
                        value={targetScaleSize}
                        onChange={(e) => handleScaleChange(Number(e.target.value))}
                        className="w-24 p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white text-center focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs font-mono text-slate-400">
                        {selectedFormulation.batchUnit}
                      </span>
                    </div>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={10}
                    max={10000}
                    step={10}
                    value={targetScaleSize}
                    onChange={(e) => handleScaleChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>10 {selectedFormulation.batchUnit} (Micro/Pilot)</span>
                    <span>Scaling Factor: {((targetScaleSize / (selectedFormulation.targetBatchSize || 1))).toFixed(2)}x</span>
                    <span>10,000 {selectedFormulation.batchUnit} (Production)</span>
                  </div>
                </div>
              </div>

              {/* Ingredients & Stoichiometry Table */}
              <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-sm space-y-3">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-brand-400" />
                    <span>Scaled Stoichiometry & Reagent Inventory Requirements</span>
                  </h3>
                  <span className="text-xs font-mono text-indigo-400">
                    {targetScaleSize} {selectedFormulation.batchUnit} Batch
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
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
                    <tbody className="divide-y divide-slate-800/80">
                      {(scaledData?.ingredients || selectedFormulation.ingredients).map((ing: any) => (
                        <tr key={ing.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-semibold text-white">
                            {ing.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {ing.casNumber}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {ing.lotNumber}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {ing.molecularWeight || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                            {ing.targetQuantity} {ing.unit}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                            {ing.calculatedConcentration || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {ing.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ing.hazards && ing.hazards.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {ing.hazards.map((h: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                  >
                                    {h}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Non-hazardous</span>
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
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              Select a formulation from the catalog to view details and calculate batch scaling.
            </div>
          )}
        </div>
      </div>

      {/* New Formulation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FlaskRound className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Create New Formulation Recipe</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFormulation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Recipe Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. HEPES 20mM + Trehalose 50mM Cryoprotectant Solution"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Batch Size *</label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      value={newBatchSize}
                      onChange={(e) => setNewBatchSize(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                      required
                    />
                    <select
                      value={newBatchUnit}
                      onChange={(e) => setNewBatchUnit(e.target.value as any)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
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
                <label className="block text-slate-300 font-semibold mb-1">Recipe Description & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Mixing instructions, pH adjustment specs, sterile filtration procedures..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 resize-none"
                />
              </div>

              {/* Dynamic Reagents Table Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Reagents & Ingredients ({ingredients.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Reagent</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-400 font-semibold">
                          Ingredient #{idx + 1}
                        </span>
                        {ingredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Component Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Tris Base or Trehalose"
                            value={ing.name}
                            onChange={(e) => handleIngChange(idx, 'name', e.target.value)}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">CAS Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 77-86-1"
                            value={ing.casNumber}
                            onChange={(e) => handleIngChange(idx, 'casNumber', e.target.value)}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Lot Number</label>
                          <input
                            type="text"
                            placeholder="LOT-2026-X"
                            value={ing.lotNumber}
                            onChange={(e) => handleIngChange(idx, 'lotNumber', e.target.value)}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Target Quantity</label>
                          <input
                            type="number"
                            step="any"
                            value={ing.targetQuantity}
                            onChange={(e) => handleIngChange(idx, 'targetQuantity', Number(e.target.value))}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Unit</label>
                          <select
                            value={ing.unit}
                            onChange={(e) => handleIngChange(idx, 'unit', e.target.value)}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                          >
                            <option value="g">g</option>
                            <option value="mg">mg</option>
                            <option value="mL">mL</option>
                            <option value="L">L</option>
                            <option value="mM">mM</option>
                            <option value="µL">µL</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">MW (g/mol)</label>
                          <input
                            type="number"
                            step="any"
                            value={ing.molecularWeight}
                            onChange={(e) => handleIngChange(idx, 'molecularWeight', Number(e.target.value))}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Role</label>
                          <select
                            value={ing.role}
                            onChange={(e) => handleIngChange(idx, 'role', e.target.value)}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
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

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
                >
                  Save Formulation Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
