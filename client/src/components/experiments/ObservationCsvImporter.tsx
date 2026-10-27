import React, { useState, useRef } from 'react';
import { apiRequest } from '../../api/client';
import { useNotification } from '../../context/NotificationContext';
import { UploadCloud, FileSpreadsheet, X, Check, AlertCircle, Sparkles } from 'lucide-react';

interface CsvRow {
  category: string;
  parameter: string;
  value: number | string;
  unit: string;
  status: 'normal' | 'anomaly';
  notes?: string;
}

interface ObservationCsvImporterProps {
  experimentId: string;
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const SAMPLE_CSV_CONTENT = `category,parameter,value,unit,status,notes
spectroscopy,OD600 Cell Density,0.485,OD,normal,Bioreactor log cycle 1
spectroscopy,OD600 Cell Density,0.612,OD,normal,Bioreactor log cycle 2
spectroscopy,OD600 Cell Density,0.845,OD,normal,Mid-log phase inflection
spectroscopy,OD600 Cell Density,1.210,OD,anomaly,Exceeded target optical density setpoint
environmental,Bioreactor Dissolved O2,45.2,%,normal,Steady state sparging
environmental,Bioreactor Dissolved O2,38.6,%,anomaly,Air pump pressure fluctuation
chromatography,HPLC Peak Retention Time,12.4,min,normal,Elution matches standard reference
chromatography,Purity Ratio (AUC),98.6,%,normal,Single sharp monomeric peak`;

export const ObservationCsvImporter: React.FC<ObservationCsvImporterProps> = ({
  experimentId,
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { success, error } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string, sourceName: string) => {
    try {
      setParseError(null);
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setParseError('CSV file is empty or does not contain a header line.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const paramIdx = headers.indexOf('parameter');
      const valIdx = headers.indexOf('value');

      if (paramIdx === -1 || valIdx === -1) {
        setParseError('Missing required columns. Header must include at least "parameter" and "value".');
        return;
      }

      const catIdx = headers.indexOf('category');
      const unitIdx = headers.indexOf('unit');
      const statusIdx = headers.indexOf('status');
      const notesIdx = headers.indexOf('notes');

      const rows: CsvRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim());

        const param = cols[paramIdx];
        const valStr = cols[valIdx];
        if (!param || valStr === undefined) continue;

        const numVal = Number(valStr);
        const val = isNaN(numVal) ? valStr : numVal;
        const category = catIdx !== -1 && cols[catIdx] ? cols[catIdx] : 'measurement';
        const unit = unitIdx !== -1 && cols[unitIdx] ? cols[unitIdx] : '';
        const statusRaw = statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx].toLowerCase() : 'normal';
        const status = statusRaw === 'anomaly' ? 'anomaly' : 'normal';
        const notes = notesIdx !== -1 ? cols[notesIdx] : '';

        rows.push({
          category,
          parameter: param,
          value: val,
          unit,
          status,
          notes,
        });
      }

      if (rows.length === 0) {
        setParseError('No valid data rows could be extracted from this CSV.');
        return;
      }

      setParsedRows(rows);
      setFileName(sourceName);
    } catch (err: any) {
      setParseError('CSV Parsing Error: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCsvText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    parseCsvText(SAMPLE_CSV_CONTENT, 'sample_plate_reader_run.csv');
  };

  const handleCommitImport = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of parsedRows) {
      try {
        await apiRequest(`/experiments/${experimentId}/observations`, {
          method: 'POST',
          body: JSON.stringify(row),
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      success(
        'Batch Ingestion Complete',
        `Successfully imported ${successCount} analytical observations into the laboratory notebook.${
          failCount > 0 ? ` (${failCount} failed)` : ''
        }`
      );
      onImportSuccess();
      onClose();
    } else {
      error('Import Failed', 'Unable to import records. Please check notebook lock status.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Instrument & Plate Reader CSV Import
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Batch ingest spectrophotometry, chromatography, or environmental data points.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-950/40 hover:bg-brand-50/20 dark:hover:bg-brand-950/10"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,text/csv"
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Click to browse or drop instrument CSV file here
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
              Accepted format: parameter, value, unit, category, status, notes
            </p>
          </div>

          {/* Quick Demo Option */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
            <span>Want to test immediately without a physical CSV?</span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="flex items-center space-x-1.5 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load 8-point Spectrophotometry Demo CSV</span>
            </button>
          </div>

          {/* Error display */}
          {parseError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>
                  Preview: <strong className="text-brand-600 dark:text-brand-400">{parsedRows.length}</strong> data points from{' '}
                  <span className="font-mono text-slate-500">{fileName}</span>
                </span>
                <span className="text-slate-400 text-[11px]">All points will generate certified audit entries</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Parameter</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-3 capitalize font-mono text-[11px]">{row.category}</td>
                        <td className="py-1.5 px-3 font-semibold">{row.parameter}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {row.value} {row.unit}
                        </td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              row.status === 'anomaly'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-400 truncate max-w-[150px]">{row.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCommitImport}
            disabled={parsedRows.length === 0 || isImporting}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-slate-950 text-xs font-bold transition flex items-center space-x-2 shadow-sm"
          >
            {isImporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Ingesting Records...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Commit & Ingest {parsedRows.length} Points</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
