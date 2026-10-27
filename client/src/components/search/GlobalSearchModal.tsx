import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../api/client';
import {
  Search,
  X,
  BookOpen,
  FlaskRound,
  ShieldCheck,
  GitCommit,
  Atom,
  Clock,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileText,
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '../../utils/date';

interface SearchResultItem {
  id?: string;
  _id?: string;
  [key: string]: any;
}

interface SearchResults {
  experiments: SearchResultItem[];
  formulations: SearchResultItem[];
  reagents: SearchResultItem[];
  auditLogs: SearchResultItem[];
  versions: SearchResultItem[];
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExperiment: (id: string) => void;
  onOpenFormulation: (id: string) => void;
  onOpenAuditLog: () => void;
}

type FilterCategory = 'all' | 'experiments' | 'formulations' | 'reagents' | 'audit' | 'versions';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onOpenExperiment,
  onOpenFormulation,
  onOpenAuditLog,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    experiments: [],
    formulations: [],
    reagents: [],
    auditLogs: [],
    versions: [],
  });
  const [category, setCategory] = useState<FilterCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults({
        experiments: [],
        formulations: [],
        reagents: [],
        auditLogs: [],
        versions: [],
      });
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults({
        experiments: [],
        formulations: [],
        reagents: [],
        auditLogs: [],
        versions: [],
      });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiRequest<{
          query: string;
          total: number;
          results: SearchResults;
        }>(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data.results);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search request failed', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.experiments.length +
    results.formulations.length +
    results.reagents.length +
    results.auditLogs.length +
    results.versions.length;

  const filterMatches = () => {
    const list: { type: string; item: any }[] = [];
    if (category === 'all' || category === 'experiments') {
      results.experiments.forEach((item) => list.push({ type: 'experiment', item }));
    }
    if (category === 'all' || category === 'formulations') {
      results.formulations.forEach((item) => list.push({ type: 'formulation', item }));
    }
    if (category === 'all' || category === 'reagents') {
      results.reagents.forEach((item) => list.push({ type: 'reagent', item }));
    }
    if (category === 'all' || category === 'audit') {
      results.auditLogs.forEach((item) => list.push({ type: 'audit', item }));
    }
    if (category === 'all' || category === 'versions') {
      results.versions.forEach((item) => list.push({ type: 'version', item }));
    }
    return list;
  };

  const displayedItems = filterMatches();

  const handleSelectItem = (entry: { type: string; item: any }) => {
    if (entry.type === 'experiment') {
      onOpenExperiment(entry.item.id);
      onClose();
    } else if (entry.type === 'formulation') {
      onOpenFormulation(entry.item.id);
      onClose();
    } else if (entry.type === 'reagent') {
      onOpenFormulation(entry.item.formulationId);
      onClose();
    } else if (entry.type === 'audit') {
      onOpenAuditLog();
      onClose();
    } else if (entry.type === 'version') {
      if (entry.item.experimentId) {
        onOpenExperiment(entry.item.experimentId);
        onClose();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayedItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayedItems[selectedIndex]) {
        handleSelectItem(displayedItems[selectedIndex]);
      }
    }
  };

  const quickSearch = (text: string) => {
    setQuery(text);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 bg-slate-50/70 dark:bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search experiments, protocols, chemical CAS numbers, formulations, or audit records..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-brand-500 animate-spin mr-2" />}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="ml-3 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Filter Pills */}
        {query.trim().length > 0 && (
          <div className="flex items-center space-x-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30 overflow-x-auto text-xs">
            <button
              onClick={() => setCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                category === 'all'
                  ? 'bg-slate-900 text-white dark:bg-brand-500 dark:text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              All ({totalResults})
            </button>
            <button
              onClick={() => setCategory('experiments')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                category === 'experiments'
                  ? 'bg-brand-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Experiments ({results.experiments.length})
            </button>
            <button
              onClick={() => setCategory('formulations')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                category === 'formulations'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Formulations ({results.formulations.length})
            </button>
            <button
              onClick={() => setCategory('reagents')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                category === 'reagents'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Reagents & CAS# ({results.reagents.length})
            </button>
            <button
              onClick={() => setCategory('audit')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                category === 'audit'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Audit Trail ({results.auditLogs.length})
            </button>
            <button
              onClick={() => setCategory('versions')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                category === 'versions'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Hashes & Versions ({results.versions.length})
            </button>
          </div>
        )}

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {query.trim().length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Global Scientific Search
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Instant search across laboratory experiments, protocol formulations, chemical CAS numbers, and cryptographic SHA-256 ledgers.
                </p>
              </div>

              {/* Quick suggestion pills */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Search Suggestions
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['EXP-', '7647-14-5 (NaCl)', '77-86-1 (Tris)', 'HEPES', 'Buffer', 'SHA-256', 'E_SIGNATURE'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() => quickSearch(tag.split(' ')[0])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 transition"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : displayedItems.length === 0 && !loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <p className="text-sm font-medium">No records matching "{query}"</p>
              <p className="text-xs text-slate-400">Try searching by experiment code, reagent name, CAS registry number, or lot #.</p>
            </div>
          ) : (
            displayedItems.map((entry, index) => {
              const isSelected = index === selectedIndex;

              if (entry.type === 'experiment') {
                const exp = entry.item;
                return (
                  <div
                    key={`exp-${exp.id}`}
                    onClick={() => handleSelectItem(entry)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-brand-500/10 dark:bg-brand-500/20 ring-1 ring-brand-500/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                            {exp.experimentNumber}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {exp.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {exp.objective || exp.hypothesis || 'Laboratory protocol'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                          <span>Author: {exp.authorName}</span>
                          <span>•</span>
                          <span className="capitalize">{exp.status}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                );
              }

              if (entry.type === 'formulation') {
                const form = entry.item;
                return (
                  <div
                    key={`form-${form.id}`}
                    onClick={() => handleSelectItem(entry)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/20 ring-1 ring-indigo-500/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FlaskRound className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {form.code}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {form.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {form.description || `Batch Size: ${form.targetBatchSize} ${form.batchUnit}`}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                          <span>Components: {form.ingredients?.length || 0}</span>
                          <span>•</span>
                          <span>Yield: {form.theoreticalYieldPercentage}%</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                );
              }

              if (entry.type === 'reagent') {
                const r = entry.item;
                const ing = r.ingredient;
                return (
                  <div
                    key={`reagent-${r.formulationId}-${ing.name}`}
                    onClick={() => handleSelectItem(entry)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 ring-1 ring-emerald-500/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Atom className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {ing.name}
                          </span>
                          {ing.casNumber && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              CAS: {ing.casNumber}
                            </span>
                          )}
                          {ing.lotNumber && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Lot: {ing.lotNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          In Formulation: <span className="font-semibold text-slate-700 dark:text-slate-300">{r.formulationName}</span> ({r.formulationCode})
                        </p>
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                          <span>MW: {ing.molecularWeight} g/mol</span>
                          <span>•</span>
                          <span>Purity: {ing.purityPercentage}%</span>
                          <span>•</span>
                          <span className="capitalize">Role: {ing.role?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                );
              }

              if (entry.type === 'audit') {
                const log = entry.item;
                return (
                  <div
                    key={`audit-${log.id}`}
                    onClick={() => handleSelectItem(entry)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 dark:bg-amber-500/20 ring-1 ring-amber-500/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase">
                            {log.action}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {log.entityType?.toUpperCase()}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300">{log.userName}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {log.details}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                          {formatDisplayDate(log.timestamp)} {formatDisplayTime(log.timestamp)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                );
              }

              if (entry.type === 'version') {
                const ver = entry.item;
                return (
                  <div
                    key={`ver-${ver.id}`}
                    onClick={() => handleSelectItem(entry)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-purple-500/10 dark:bg-purple-500/20 ring-1 ring-purple-500/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GitCommit className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            Version {ver.versionNumber}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {ver.changeSummary || 'Protocol Revision'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-lg">
                          SHA-256: {ver.hashSha256}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Footer Shortcut Info */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-2 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Enter</kbd> to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Esc</kbd> to close
            </span>
          </div>
          <span>BioScribe Global Search Engine</span>
        </div>
      </div>
    </div>
  );
};
