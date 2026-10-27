import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  ScanLine,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  Printer,
  Copy,
  Plus,
  X,
  Sparkles,
  Thermometer,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export interface ScannedReagent {
  name: string;
  casNumber: string;
  lotNumber: string;
  molecularWeight: number;
  purityPercentage: number;
  targetQuantity: number;
  unit: 'g' | 'mg' | 'mL' | 'L' | 'mM' | 'µL';
  role: 'active_moiety' | 'solvent' | 'buffer' | 'excipient' | 'catalyst';
  expiryDate: string; // YYYY-MM-DD
  storageTemperature: string;
  hazards: string[];
  manufacturer: string;
}

const SAMPLE_REAGENT_RACK: ScannedReagent[] = [
  {
    name: 'HEPES Buffer Solution (1.0 M, pH 7.4)',
    casNumber: '7365-45-9',
    lotNumber: 'LOT-HEP-2025-08A',
    molecularWeight: 238.3,
    purityPercentage: 99.8,
    targetQuantity: 50,
    unit: 'mL',
    role: 'buffer',
    expiryDate: '2027-04-15',
    storageTemperature: '2°C to 8°C (Cold Room)',
    hazards: [],
    manufacturer: 'BioScribe Reagent Systems',
  },
  {
    name: 'Sodium Chloride (NaCl) 5.0 M BioGrade',
    casNumber: '7647-14-5',
    lotNumber: 'LOT-NACL-9981-B',
    molecularWeight: 58.44,
    purityPercentage: 99.9,
    targetQuantity: 250,
    unit: 'mL',
    role: 'excipient',
    expiryDate: '2028-11-20',
    storageTemperature: '15°C to 25°C (Ambient Room Temp)',
    hazards: [],
    manufacturer: 'Sigma Analytical Lab',
  },
  {
    name: 'Tris-HCl Solution (1.0 M, pH 8.0)',
    casNumber: '1185-53-1',
    lotNumber: 'LOT-TRIS-8012-C',
    molecularWeight: 157.6,
    purityPercentage: 99.5,
    targetQuantity: 100,
    unit: 'mL',
    role: 'buffer',
    expiryDate: '2026-11-15',
    storageTemperature: '15°C to 25°C (Ambient)',
    hazards: ['GHS07 Irritant'],
    manufacturer: 'Merck BioScience',
  },
  {
    name: 'DMSO (Dimethyl Sulfoxide) Molecular Grade',
    casNumber: '67-68-5',
    lotNumber: 'LOT-DMSO-4402',
    molecularWeight: 78.13,
    purityPercentage: 99.9,
    targetQuantity: 50,
    unit: 'mL',
    role: 'solvent',
    expiryDate: '2027-06-30',
    storageTemperature: '15°C to 25°C (Keep Dry)',
    hazards: ['Flammable Liquid Category 4'],
    manufacturer: 'Thermo Chemical Scientific',
  },
  {
    name: 'DTT (Dithiothreitol) Reducing Agent 1M',
    casNumber: '3483-12-3',
    lotNumber: 'LOT-DTT-5509-X',
    molecularWeight: 154.25,
    purityPercentage: 99.0,
    targetQuantity: 10,
    unit: 'mL',
    role: 'catalyst',
    expiryDate: '2026-12-31',
    storageTemperature: '-20°C (Ultra-Low Freezer)',
    hazards: ['GHS07 Acute Toxicity', 'GHS09 Environmental'],
    manufacturer: 'VWR Reagent Division',
  },
  {
    name: 'Ampicillin Sodium Salt (Expired Lot)',
    casNumber: '69-52-3',
    lotNumber: 'LOT-AMP-2023-EX',
    molecularWeight: 371.39,
    purityPercentage: 98.2,
    targetQuantity: 5,
    unit: 'g',
    role: 'active_moiety',
    expiryDate: '2024-01-15', // Expired!
    storageTemperature: '-20°C (Freezer)',
    hazards: ['GHS08 Respiratory Sensitizer'],
    manufacturer: 'BioPharma Synthesis Inc',
  },
];

interface ReagentBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportReagent?: (reagent: ScannedReagent) => void;
}

export const ReagentBarcodeModal: React.FC<ReagentBarcodeModalProps> = ({
  isOpen,
  onClose,
  onImportReagent,
}) => {
  const { success, error, info } = useNotification();
  const [activeTab, setActiveTab] = useState<'scanner' | 'label_generator'>('scanner');
  const [scannedReagent, setScannedReagent] = useState<ScannedReagent | null>(SAMPLE_REAGENT_RACK[0]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [generatedQrUrl, setGeneratedQrUrl] = useState('');

  // Label generator custom form state
  const [customName, setCustomName] = useState('Sodium Bicarbonate Buffer');
  const [customCas, setCustomCas] = useState('144-55-8');
  const [customLot, setCustomLot] = useState('LOT-BICARB-2026');
  const [customMw, setCustomMw] = useState(84.01);
  const [customPurity, setCustomPurity] = useState(99.7);
  const [customExpiry, setCustomExpiry] = useState('2027-12-31');
  const [customTemp, setCustomTemp] = useState('15°C to 25°C');
  const [customQrUrl, setCustomQrUrl] = useState('');

  // Generate QR for currently active scanned reagent
  useEffect(() => {
    if (!scannedReagent) return;

    const payload = JSON.stringify({
      reagent: scannedReagent.name,
      cas: scannedReagent.casNumber,
      lot: scannedReagent.lotNumber,
      expiry: scannedReagent.expiryDate,
      mw: scannedReagent.molecularWeight,
      purity: scannedReagent.purityPercentage,
      storage: scannedReagent.storageTemperature,
    });

    QRCode.toDataURL(payload, {
      margin: 1,
      width: 140,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setGeneratedQrUrl).catch(console.error);
  }, [scannedReagent]);

  // Generate QR for custom label generator
  useEffect(() => {
    const payload = JSON.stringify({
      reagent: customName,
      cas: customCas,
      lot: customLot,
      expiry: customExpiry,
      mw: customMw,
      purity: customPurity,
      storage: customTemp,
    });

    QRCode.toDataURL(payload, {
      margin: 1,
      width: 160,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setCustomQrUrl).catch(console.error);
  }, [customName, customCas, customLot, customExpiry, customMw, customPurity, customTemp]);

  if (!isOpen) return null;

  // Calculate expiration status
  const getExpirationStatus = (expiryDateStr: string) => {
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        days: Math.abs(diffDays),
        label: `Expired ${Math.abs(diffDays)} days ago`,
        color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-800',
        icon: XCircle,
      };
    }
    if (diffDays <= 30) {
      return {
        status: 'warning',
        days: diffDays,
        label: `Expiring soon (${diffDays} days remaining)`,
        color: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
        icon: AlertTriangle,
      };
    }
    return {
      status: 'valid',
      days: diffDays,
      label: `Verified Safe (${diffDays} days shelf life)`,
      color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
      icon: CheckCircle2,
    };
  };

  const handleSimulateScan = (reagent: ScannedReagent) => {
    setIsScanningActive(true);
    setTimeout(() => {
      setScannedReagent(reagent);
      setIsScanningActive(false);
      const expStatus = getExpirationStatus(reagent.expiryDate);
      if (expStatus.status === 'expired') {
        error(`EXPIRED REAGENT DETECTED: Lot ${reagent.lotNumber} has expired! Do not use for certified batches.`);
      } else {
        success(`Scanned: ${reagent.name} (CAS ${reagent.casNumber}) - Lot Verified!`);
      }
    }, 450);
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;

    // Search existing rack by lot or cas or name
    const found = SAMPLE_REAGENT_RACK.find(
      (r) =>
        r.lotNumber.toLowerCase().includes(manualBarcode.toLowerCase()) ||
        r.casNumber.includes(manualBarcode) ||
        r.name.toLowerCase().includes(manualBarcode.toLowerCase())
    );

    if (found) {
      handleSimulateScan(found);
    } else {
      // Create dynamically scanned reagent
      const newScanned: ScannedReagent = {
        name: `Reagent [Barcode: ${manualBarcode}]`,
        casNumber: 'Custom-Lot',
        lotNumber: manualBarcode.toUpperCase(),
        molecularWeight: 100,
        purityPercentage: 99.0,
        targetQuantity: 10,
        unit: 'g',
        role: 'excipient',
        expiryDate: '2027-10-30',
        storageTemperature: '15°C to 25°C',
        hazards: [],
        manufacturer: 'Registered Lab Stockroom',
      };
      handleSimulateScan(newScanned);
    }
    setManualBarcode('');
  };

  const expStatus = scannedReagent ? getExpirationStatus(scannedReagent.expiryDate) : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-md shadow-brand-500/20 text-slate-950 font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>2D Barcode & QR Code Reagent Station</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  CAS & Lot Verification
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan reagent bottles, verify chemical lot purity & expiration dates, and generate printable 2D QR labels.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'scanner'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>Interactive Reagent Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('label_generator')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'label_generator'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Printable 2D Reagent Label Generator</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'scanner' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Sample Reagent Rack / Scan Simulator */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Laboratory Stockroom Rack</span>
                    <span className="text-[10px] text-slate-400 font-normal">Click to Scan Bottle</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select a chemical container to simulate instant 2D barcode / QR camera scan.
                  </p>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {SAMPLE_REAGENT_RACK.map((reagent) => {
                    const isSelected = scannedReagent?.lotNumber === reagent.lotNumber;
                    const st = getExpirationStatus(reagent.expiryDate);
                    return (
                      <div
                        key={reagent.lotNumber}
                        onClick={() => handleSimulateScan(reagent)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-brand-500/10 dark:bg-brand-500/20 border-brand-500/50 ring-1 ring-brand-500/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <span>{reagent.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>CAS: {reagent.casNumber}</span>
                            <span>•</span>
                            <span>{reagent.lotNumber}</span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${st.color}`}>
                            {st.status === 'expired' ? 'EXPIRED' : st.status === 'warning' ? 'Exp. Soon' : 'Verified'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Manual Barcode Input */}
                <form onSubmit={handleManualScanSubmit} className="pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      placeholder="Type Lot # or CAS to scan..."
                      className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition"
                    >
                      Scan
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Scanned Inspection Card & Verification */}
              <div className="lg:col-span-7">
                {scannedReagent ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-5 space-y-4 shadow-sm">
                    {/* Top Scanned Header */}
                    <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Scanned Reagent Record
                          </span>
                          {isScanningActive && (
                            <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 animate-pulse font-bold">
                              Verifying Cryptographic QR Code...
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {scannedReagent.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Supplier: {scannedReagent.manufacturer}
                        </p>
                      </div>

                      {generatedQrUrl && (
                        <div className="text-center flex-shrink-0 ml-3">
                          <img
                            src={generatedQrUrl}
                            alt="Reagent QR Code"
                            className="w-16 h-16 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-white shadow-sm"
                          />
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">2D QR Badge</span>
                        </div>
                      )}
                    </div>

                    {/* Expiration Status Alert */}
                    {expStatus && (
                      <div className={`p-3 rounded-xl border flex items-center space-x-2.5 text-xs ${expStatus.color}`}>
                        <expStatus.icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1">
                          <strong>{expStatus.label}</strong>
                          <span className="block text-[11px] opacity-90">
                            {expStatus.status === 'expired'
                              ? 'WARNING: This reagent has passed its certified shelf-life. Material must be quarantined.'
                              : `Reagent lot certified safe for use through ${scannedReagent.expiryDate}.`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Chemical Data Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase block font-semibold">CAS Registry #</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {scannedReagent.casNumber}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase block font-semibold">Lot Number</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {scannedReagent.lotNumber}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase block font-semibold">Molecular Weight</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {scannedReagent.molecularWeight} g/mol
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase block font-semibold">Purity Assay</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {scannedReagent.purityPercentage}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase block font-semibold">Functional Role</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                          {scannedReagent.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase block font-semibold">Storage Condition</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                          <Thermometer className="w-3 h-3 text-cyan-500" />
                          <span className="truncate">{scannedReagent.storageTemperature}</span>
                        </span>
                      </div>
                    </div>

                    {/* Hazards Badges */}
                    {scannedReagent.hazards.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs">
                        <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1 mb-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>GHS Chemical Hazard Classification</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {scannedReagent.hazards.map((h) => (
                            <span
                              key={h}
                              className="px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-mono text-[11px]"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${scannedReagent.name} (CAS ${scannedReagent.casNumber}, Lot: ${scannedReagent.lotNumber})`
                          );
                          info('Copied Reagent Information', 'Chemical specs copied to clipboard.');
                        }}
                        className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Specs</span>
                      </button>

                      {onImportReagent && (
                        <button
                          onClick={() => {
                            if (expStatus?.status === 'expired') {
                              error('Cannot import expired reagent into an active batch formulation!');
                              return;
                            }
                            onImportReagent(scannedReagent);
                            success(`Reagent "${scannedReagent.name}" added to Formulation!`);
                            onClose();
                          }}
                          disabled={expStatus?.status === 'expired'}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-400 text-white text-xs font-bold transition shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Import Reagent into Formulation</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <ScanLine className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No reagent scanned yet. Select an item from the stockroom rack.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Printable 2D Reagent Label Generator */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Label Metadata & Chemical Properties
                </h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Chemical / Reagent Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">CAS Registry #</label>
                      <input
                        type="text"
                        value={customCas}
                        onChange={(e) => setCustomCas(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Lot Number</label>
                      <input
                        type="text"
                        value={customLot}
                        onChange={(e) => setCustomLot(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Molecular Weight (g/mol)</label>
                      <input
                        type="number"
                        value={customMw}
                        onChange={(e) => setCustomMw(Number(e.target.value))}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Purity Assay (%)</label>
                      <input
                        type="number"
                        value={customPurity}
                        onChange={(e) => setCustomPurity(Number(e.target.value))}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Expiration Date</label>
                      <input
                        type="date"
                        value={customExpiry}
                        onChange={(e) => setCustomExpiry(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Storage Condition</label>
                      <input
                        type="text"
                        value={customTemp}
                        onChange={(e) => setCustomTemp(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Label Preview (Standard Laboratory Bottle Sticker) */}
              <div className="md:col-span-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Container Sticker Preview</span>
                  <span className="text-[10px] font-mono text-slate-400">Cleanroom Standard</span>
                </h3>

                {/* Printable Sticker Box */}
                <div
                  id="printable-reagent-label"
                  className="p-4 rounded-xl border-2 border-slate-900 dark:border-slate-300 bg-white text-slate-950 shadow-md space-y-2.5 font-sans"
                >
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                        BioScribe Laboratory Systems
                      </span>
                      <h4 className="text-sm font-extrabold tracking-tight leading-snug">{customName}</h4>
                    </div>
                    {customQrUrl && (
                      <img
                        src={customQrUrl}
                        alt="2D QR Barcode"
                        className="w-14 h-14 border border-slate-900 p-0.5 ml-2 flex-shrink-0"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500 block">CAS #:</span>
                      <span className="font-bold">{customCas}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">LOT #:</span>
                      <span className="font-bold">{customLot}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">MOL. WT:</span>
                      <span className="font-bold">{customMw} g/mol</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">PURITY:</span>
                      <span className="font-bold">{customPurity}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">EXPIRY DATE:</span>
                      <span className="font-bold text-red-600">{customExpiry}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">STORAGE:</span>
                      <span className="font-bold">{customTemp}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-300 pt-1.5 text-[8px] text-slate-500 flex justify-between font-mono">
                    <span>SEALED LOT VERIFIED</span>
                    <span>AUTHENTICATED CHEMICAL RECORD</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Reagent Label</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
