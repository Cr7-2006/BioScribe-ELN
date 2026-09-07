import bcrypt from 'bcryptjs';
import { dbManager } from '../config/db';
import { computeVersionHash, computeSignatureDigest, computeAuditChecksum } from '../services/crypto';
import {
  User,
  Project,
  Experiment,
  ExperimentVersion,
  Observation,
  Formulation,
  Approval,
  AuditLog,
} from '../types';

export async function seedDatabase() {
  // If users already exist, don't overwrite unless explicitly forced
  if (dbManager.db.users && dbManager.db.users.length > 0) {
    return;
  }

  console.log('🌱 Seeding initial BioScribe ELN research database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users: User[] = [
    {
      id: 'usr-elena',
      name: 'Dr. Elena Vance',
      email: 'elena.vance@bioscribe.io',
      role: 'researcher',
      department: 'Molecular Oncology & Proteomics',
      passwordHash,
      createdAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'usr-marcus',
      name: 'Dr. Marcus Chen',
      email: 'marcus.chen@bioscribe.io',
      role: 'reviewer',
      department: 'Bioprocess & Cell Engineering',
      passwordHash,
      createdAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'usr-sarah',
      name: 'Sarah Jenkins, RAC',
      email: 'sarah.jenkins@bioscribe.io',
      role: 'qa_manager',
      department: 'Quality Assurance & Regulatory Compliance',
      passwordHash,
      createdAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'usr-admin',
      name: 'Lab Informatics Administrator',
      email: 'admin@bioscribe.io',
      role: 'admin',
      department: 'Research Computing & Informatics',
      passwordHash,
      createdAt: '2026-01-10T08:00:00.000Z',
    },
  ];

  const projects: Project[] = [
    {
      id: 'prj-onc-01',
      code: 'PRJ-ONC-01',
      name: 'Targeted Proteolysis of KRAS G12D in Pancreatic Ductal Adenocarcinoma',
      description: 'Design and surface plasmon resonance validation of bivalent PROTAC degrader candidates targeting oncogenic KRAS mutants.',
      therapeuticArea: 'Oncology',
      leadId: 'usr-elena',
      leadName: 'Dr. Elena Vance',
      createdAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 'prj-imm-04',
      code: 'PRJ-IMM-04',
      name: 'Next-Gen CAR-T Cryopreservation & Functional Recovery Profiling',
      description: 'Optimization of DMSO-free vitrification formulations to maximize post-thaw T-cell viability and cytotoxicity.',
      therapeuticArea: 'Cell & Gene Therapy',
      leadId: 'usr-marcus',
      leadName: 'Dr. Marcus Chen',
      createdAt: '2026-02-01T10:00:00.000Z',
    },
    {
      id: 'prj-syn-09',
      code: 'PRJ-SYN-09',
      name: 'Continuous-Flow Enantioselective Biocatalysis for Chiral Precursors',
      description: 'Microfluidic enzyme immobilization using engineered transaminases to produce enantiopure beta-amino acids.',
      therapeuticArea: 'Biochemical Synthesis',
      leadId: 'usr-elena',
      leadName: 'Dr. Elena Vance',
      createdAt: '2026-02-20T11:00:00.000Z',
    },
  ];

  const formulations: Formulation[] = [
    {
      id: 'form-kras-504',
      code: 'FORM-KRAS-504',
      name: 'SPR High-Affinity Sensor Running Buffer (pH 7.4)',
      description: 'Low-autofluorescence phosphate-buffered saline supplemented with surfactant and reducing agent for kinetic analysis.',
      targetBatchSize: 1000,
      batchUnit: 'mL',
      theoreticalYieldPercentage: 100,
      actualYieldPercentage: 99.4,
      authorId: 'usr-elena',
      authorName: 'Dr. Elena Vance',
      createdAt: '2026-02-05T14:30:00.000Z',
      updatedAt: '2026-02-05T14:30:00.000Z',
      ingredients: [
        {
          id: 'ing-1',
          formulationId: 'form-kras-504',
          name: 'Tris(hydroxymethyl)aminomethane (Tris Base)',
          casNumber: '77-86-1',
          lotNumber: 'TRIS-2026-09A',
          molecularWeight: 121.14,
          purityPercentage: 99.8,
          targetQuantity: 6.057,
          unit: 'g',
          role: 'buffer',
          hazards: ['GHS07 Eye/Skin Irritant'],
        },
        {
          id: 'ing-2',
          formulationId: 'form-kras-504',
          name: 'Sodium Chloride (NaCl)',
          casNumber: '7647-14-5',
          lotNumber: 'NACL-884-X',
          molecularWeight: 58.44,
          purityPercentage: 99.9,
          targetQuantity: 8.766,
          unit: 'g',
          role: 'excipient',
          hazards: [],
        },
        {
          id: 'ing-3',
          formulationId: 'form-kras-504',
          name: 'Tris(2-carboxyethyl)phosphine (TCEP-HCl)',
          casNumber: '51805-45-9',
          lotNumber: 'TCP-2025-41C',
          molecularWeight: 286.65,
          purityPercentage: 98.5,
          targetQuantity: 0.287,
          unit: 'g',
          role: 'active_moiety',
          hazards: ['GHS05 Corrosive'],
        },
        {
          id: 'ing-4',
          formulationId: 'form-kras-504',
          name: 'Polysorbate 20 (Tween-20)',
          casNumber: '9005-64-5',
          lotNumber: 'TW20-992B',
          molecularWeight: 1227.5,
          purityPercentage: 100,
          targetQuantity: 0.5,
          unit: 'mL',
          role: 'solvent',
          hazards: [],
        },
      ],
    },
    {
      id: 'form-cryo-101',
      code: 'FORM-CRYO-101',
      name: 'Vitrification Preservation Matrix (DMSO-Reduced 5%)',
      description: 'Sterile cryopreservation formulation using trehalose disaccharide and human serum albumin for cellular preservation.',
      targetBatchSize: 500,
      batchUnit: 'mL',
      theoreticalYieldPercentage: 100,
      actualYieldPercentage: 98.8,
      authorId: 'usr-marcus',
      authorName: 'Dr. Marcus Chen',
      createdAt: '2026-02-12T09:15:00.000Z',
      updatedAt: '2026-02-12T09:15:00.000Z',
      ingredients: [
        {
          id: 'ing-5',
          formulationId: 'form-cryo-101',
          name: 'D-(+)-Trehalose Dihydrate',
          casNumber: '6138-23-4',
          lotNumber: 'TRE-2025-014',
          molecularWeight: 378.33,
          purityPercentage: 99.0,
          targetQuantity: 18.91,
          unit: 'g',
          role: 'active_moiety',
          hazards: [],
        },
        {
          id: 'ing-6',
          formulationId: 'form-cryo-101',
          name: 'Human Serum Albumin 20% solution',
          casNumber: '70024-90-7',
          lotNumber: 'HSA-CLIN-002',
          molecularWeight: 66500,
          purityPercentage: 96.0,
          targetQuantity: 50.0,
          unit: 'mL',
          role: 'excipient',
          hazards: [],
        },
      ],
    },
  ];

  // Experiment 1: In Review with 2 versions
  const exp1Id = 'exp-kras-spr-0042';
  const exp1V1Steps = [
    {
      id: 'step-1',
      stepNumber: 1,
      title: 'CM5 Chip Docking & Equilibrating',
      instruction: 'Dock certified CM5 optical sensor chip into Biacore T200. Prime system 3 times with filtered degassed MilliQ H2O at 25°C.',
      durationMinutes: 30,
      temperatureCelsius: 25,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Pressure steady at 1.4 bar, baseline stabilized within ±0.2 RU.',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      title: 'Surface Activation via EDC/NHS',
      instruction: 'Inject 1:1 mixture of 0.4 M EDC and 0.1 M NHS for 420 seconds at flow rate 10 µL/min to activate carboxymethyl dextran matrix.',
      durationMinutes: 15,
      temperatureCelsius: 25,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Delta RU = +320 RU activation peak observed on channel 2.',
    },
    {
      id: 'step-3',
      stepNumber: 3,
      title: 'KRAS G12D Recombinant Protein Immobilization',
      instruction: 'Dilute His-tagged KRAS G12D (10 µg/mL in 10 mM Sodium Acetate pH 5.0). Inject for 360 seconds targeting 1200 RU density.',
      durationMinutes: 20,
      temperatureCelsius: 25,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Final immobilized level: 1245 RU.',
    },
    {
      id: 'step-4',
      stepNumber: 4,
      title: 'PROTAC Degrader BSC-401 Multi-cycle Titration',
      instruction: 'Inject BSC-401 in two-fold serial dilutions (0.39 nM to 50 nM) at 45 µL/min. Association: 180s, Dissociation: 600s.',
      durationMinutes: 120,
      temperatureCelsius: 25,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Rapid 1:1 Langmuir binding kinetics recorded without bulk refractive index anomalies.',
    },
  ];

  const exp1V1Hash = computeVersionHash({
    experimentId: exp1Id,
    versionNumber: '1.0',
    title: 'Dose-Response Surface Plasmon Resonance (SPR) of Small Molecule PROTAC Degrader BSC-401',
    objective: 'Quantify kinetic binding constants (ka, kd, and KD) of BSC-401 with recombinant KRAS G12D on gold CM5 sensor surface.',
    hypothesis: 'BSC-401 exhibits nanomolar binding affinity (KD < 15 nM) with slow dissociation kinetics compared to parental monovalent ligands.',
    protocolSteps: exp1V1Steps,
    conclusion: 'Initial runs confirm sub-10 nM binding with acceptable mass transfer limitation bounds.',
    authorId: 'usr-elena',
  });

  const exp1V2Steps = [
    ...exp1V1Steps,
    {
      id: 'step-5',
      stepNumber: 5,
      title: 'Regeneration with 10 mM Glycine-HCl pH 2.2',
      instruction: 'Pulse 10 µL of glycine regeneration solution at 30 µL/min for 30 seconds between compound concentrations. Re-equilibrate in running buffer for 300s.',
      durationMinutes: 25,
      temperatureCelsius: 25,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Surface fully regenerated; baseline drift < 1.2 RU across all 8 injection cycles.',
    },
  ];

  const exp1V2Hash = computeVersionHash({
    experimentId: exp1Id,
    versionNumber: '1.1',
    title: 'Dose-Response Surface Plasmon Resonance (SPR) of Small Molecule PROTAC Degrader BSC-401',
    objective: 'Quantify kinetic binding constants (ka, kd, and KD) of BSC-401 with recombinant KRAS G12D on gold CM5 sensor surface with regeneration protocol.',
    hypothesis: 'BSC-401 exhibits nanomolar binding affinity (KD < 15 nM) with slow dissociation kinetics compared to parental monovalent ligands.',
    protocolSteps: exp1V2Steps,
    conclusion: 'Regeneration protocol verified. Steady baseline maintained. Apparent KD determined to be 8.42 ± 0.35 nM.',
    authorId: 'usr-elena',
  });

  const exp1Versions: ExperimentVersion[] = [
    {
      id: 'ver-kras-001',
      experimentId: exp1Id,
      versionNumber: '1.0',
      title: 'Dose-Response Surface Plasmon Resonance (SPR) of Small Molecule PROTAC Degrader BSC-401',
      objective: 'Quantify kinetic binding constants (ka, kd, and KD) of BSC-401 with recombinant KRAS G12D on gold CM5 sensor surface.',
      hypothesis: 'BSC-401 exhibits nanomolar binding affinity (KD < 15 nM) with slow dissociation kinetics compared to parental monovalent ligands.',
      protocolSteps: exp1V1Steps,
      conclusion: 'Initial runs confirm sub-10 nM binding with acceptable mass transfer limitation bounds.',
      authorId: 'usr-elena',
      authorName: 'Dr. Elena Vance',
      changeSummary: 'Initial experimental design and baseline SPR protocol commitment.',
      hashSha256: exp1V1Hash,
      isLocked: true,
      createdAt: '2026-02-18T10:00:00.000Z',
    },
    {
      id: 'ver-kras-002',
      experimentId: exp1Id,
      versionNumber: '1.1',
      title: 'Dose-Response Surface Plasmon Resonance (SPR) of Small Molecule PROTAC Degrader BSC-401',
      objective: 'Quantify kinetic binding constants (ka, kd, and KD) of BSC-401 with recombinant KRAS G12D on gold CM5 sensor surface with regeneration protocol.',
      hypothesis: 'BSC-401 exhibits nanomolar binding affinity (KD < 15 nM) with slow dissociation kinetics compared to parental monovalent ligands.',
      protocolSteps: exp1V2Steps,
      conclusion: 'Regeneration protocol verified. Steady baseline maintained. Apparent KD determined to be 8.42 ± 0.35 nM.',
      authorId: 'usr-elena',
      authorName: 'Dr. Elena Vance',
      changeSummary: 'Added Step 5 regeneration pulse protocol and updated steady-state kinetic evaluation parameters.',
      hashSha256: exp1V2Hash,
      isLocked: false,
      createdAt: '2026-02-22T16:45:00.000Z',
    },
  ];

  // Experiment 2: Approved Experiment with 21 CFR Part 11 Electronic Signature
  const exp2Id = 'exp-cart-cryo-0038';
  const exp2Steps = [
    {
      id: 'step-c1',
      stepNumber: 1,
      title: 'Cell Count and Viability Baseline Assessment',
      instruction: 'Harvest expanded CD19-targeting CAR-T cells at day 12. Determine cell viability by automated acridine orange/propidium iodide (AO/PI) fluorescence.',
      durationMinutes: 20,
      temperatureCelsius: 20,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Initial viable cell density: 4.82 x 10^6 cells/mL with 97.4% initial viability.',
    },
    {
      id: 'step-c2',
      stepNumber: 2,
      title: 'Formulation Resuspension & Controlled-Rate Freezing',
      instruction: 'Resuspend cell pellet into chilled FORM-CRYO-101 at 1 x 10^7 cells/mL. Transfer to 2 mL cryovials. Freeze at controlled rate -1°C/min down to -80°C.',
      durationMinutes: 120,
      temperatureCelsius: -80,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Controlled cooling chamber ramp confirmed linear within ±0.15°C margin.',
    },
    {
      id: 'step-c3',
      stepNumber: 3,
      title: 'Liquid Nitrogen Vapor Phase Storage & Thaw Analysis',
      instruction: 'Submerge in LN2 vapor phase (-196°C) for 72 hours. Thaw in 37°C water bath for 90s, dilute with pre-warmed media, and assay post-thaw recovery.',
      durationMinutes: 60,
      temperatureCelsius: 37,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Post-thaw recovery: 94.2% viable cells after 24 hours in culture.',
    },
  ];

  const exp2Hash = computeVersionHash({
    experimentId: exp2Id,
    versionNumber: '2.0',
    title: 'Validation of Cryopreservation Protocol for T-Cell Viability at -196°C Liquid Nitrogen',
    objective: 'Establish Good Manufacturing Practice (GMP) compliant vitrification SOP achieving >90% cell viability post-cryo preservation.',
    hypothesis: 'Reduced DMSO (5%) formulation with 50 mM trehalose preserves membrane integrity superior to standard 10% DMSO without cytotoxicity.',
    protocolSteps: exp2Steps,
    conclusion: 'Formulation FORM-CRYO-101 demonstrated 94.2% viability, passing GLP release threshold (>85%). Protocol certified for Phase I clinical material.',
    authorId: 'usr-marcus',
  });

  const exp2Versions: ExperimentVersion[] = [
    {
      id: 'ver-cart-001',
      experimentId: exp2Id,
      versionNumber: '2.0',
      title: 'Validation of Cryopreservation Protocol for T-Cell Viability at -196°C Liquid Nitrogen',
      objective: 'Establish Good Manufacturing Practice (GMP) compliant vitrification SOP achieving >90% cell viability post-cryo preservation.',
      hypothesis: 'Reduced DMSO (5%) formulation with 50 mM trehalose preserves membrane integrity superior to standard 10% DMSO without cytotoxicity.',
      protocolSteps: exp2Steps,
      conclusion: 'Formulation FORM-CRYO-101 demonstrated 94.2% viability, passing GLP release threshold (>85%). Protocol certified for Phase I clinical material.',
      authorId: 'usr-marcus',
      authorName: 'Dr. Marcus Chen',
      changeSummary: 'Finalized and validated standard operating protocol with multi-lot replicates.',
      hashSha256: exp2Hash,
      isLocked: true,
      createdAt: '2026-02-14T11:00:00.000Z',
    },
  ];

  // Experiment 3: Draft
  const exp3Id = 'exp-syn-hplc-0055';
  const exp3Steps = [
    {
      id: 'step-h1',
      stepNumber: 1,
      title: 'Chiral Stationary Phase Column Conditioning',
      instruction: 'Mount Chiralpak AD-H column (250 x 4.6 mm, 5 µm). Equilibrate with 90:10 n-Hexane/Isopropanol at 1.0 mL/min for 45 min at 25°C.',
      durationMinutes: 45,
      temperatureCelsius: 25,
      criticalQualityAttribute: true,
      completed: true,
      notes: 'Column pressure stable at 68 bar.',
    },
    {
      id: 'step-h2',
      stepNumber: 2,
      title: 'Sample Derivatization & Autosampler Loading',
      instruction: 'Dissolve 2.0 mg biocatalytic transaminase reaction mixture in 1.0 mL mobile phase. Filter through 0.22 µm PTFE syringe filter.',
      durationMinutes: 15,
      temperatureCelsius: 20,
      criticalQualityAttribute: false,
      completed: false,
      notes: 'Clear colorless solution prepared in HPLC vial #14.',
    },
  ];

  const exp3Hash = computeVersionHash({
    experimentId: exp3Id,
    versionNumber: '0.1',
    title: 'HPLC Enantiomeric Excess Purity Analysis of Biocatalytic Transaminase Reaction',
    objective: 'Determine enantiomeric excess (ee%) of (R)-1-(4-trifluoromethylphenyl)ethylamine produced in enzymatic biocatalysis.',
    hypothesis: 'Engineered enzyme variant TA-048 will catalyze asymmetric amination with >98% enantioselectivity.',
    protocolSteps: exp3Steps,
    conclusion: '',
    authorId: 'usr-elena',
  });

  const exp3Versions: ExperimentVersion[] = [
    {
      id: 'ver-syn-001',
      experimentId: exp3Id,
      versionNumber: '0.1',
      title: 'HPLC Enantiomeric Excess Purity Analysis of Biocatalytic Transaminase Reaction',
      objective: 'Determine enantiomeric excess (ee%) of (R)-1-(4-trifluoromethylphenyl)ethylamine produced in enzymatic biocatalysis.',
      hypothesis: 'Engineered enzyme variant TA-048 will catalyze asymmetric amination with >98% enantioselectivity.',
      protocolSteps: exp3Steps,
      conclusion: '',
      authorId: 'usr-elena',
      authorName: 'Dr. Elena Vance',
      changeSummary: 'Work in progress draft setup.',
      hashSha256: exp3Hash,
      isLocked: false,
      createdAt: '2026-03-01T09:30:00.000Z',
    },
  ];

  const experiments: Experiment[] = [
    {
      id: exp1Id,
      projectCode: 'PRJ-ONC-01',
      experimentNumber: 'EXP-2026-0042',
      title: 'Dose-Response Surface Plasmon Resonance (SPR) of Small Molecule PROTAC Degrader BSC-401',
      objective: 'Quantify kinetic binding constants (ka, kd, and KD) of BSC-401 with recombinant KRAS G12D on gold CM5 sensor surface with regeneration protocol.',
      hypothesis: 'BSC-401 exhibits nanomolar binding affinity (KD < 15 nM) with slow dissociation kinetics compared to parental monovalent ligands.',
      status: 'in_review',
      currentVersionId: 'ver-kras-002',
      currentVersionNumber: '1.1',
      authorId: 'usr-elena',
      authorName: 'Dr. Elena Vance',
      formulationId: 'form-kras-504',
      createdAt: '2026-02-18T10:00:00.000Z',
      updatedAt: '2026-02-22T16:45:00.000Z',
    },
    {
      id: exp2Id,
      projectCode: 'PRJ-IMM-04',
      experimentNumber: 'EXP-2026-0038',
      title: 'Validation of Cryopreservation Protocol for T-Cell Viability at -196°C Liquid Nitrogen',
      objective: 'Establish Good Manufacturing Practice (GMP) compliant vitrification SOP achieving >90% cell viability post-cryo preservation.',
      hypothesis: 'Reduced DMSO (5%) formulation with 50 mM trehalose preserves membrane integrity superior to standard 10% DMSO without cytotoxicity.',
      status: 'approved',
      currentVersionId: 'ver-cart-001',
      currentVersionNumber: '2.0',
      authorId: 'usr-marcus',
      authorName: 'Dr. Marcus Chen',
      formulationId: 'form-cryo-101',
      createdAt: '2026-02-12T08:00:00.000Z',
      updatedAt: '2026-02-15T14:20:00.000Z',
    },
    {
      id: exp3Id,
      projectCode: 'PRJ-SYN-09',
      experimentNumber: 'EXP-2026-0055',
      title: 'HPLC Enantiomeric Excess Purity Analysis of Biocatalytic Transaminase Reaction',
      objective: 'Determine enantiomeric excess (ee%) of (R)-1-(4-trifluoromethylphenyl)ethylamine produced in enzymatic biocatalysis.',
      hypothesis: 'Engineered enzyme variant TA-048 will catalyze asymmetric amination with >98% enantioselectivity.',
      status: 'draft',
      currentVersionId: 'ver-syn-001',
      currentVersionNumber: '0.1',
      authorId: 'usr-elena',
      authorName: 'Dr. Elena Vance',
      createdAt: '2026-03-01T09:30:00.000Z',
      updatedAt: '2026-03-01T09:30:00.000Z',
    },
  ];

  const observations: Observation[] = [
    {
      id: 'obs-1',
      experimentId: exp1Id,
      timestamp: '2026-02-22T11:15:00.000Z',
      recordedById: 'usr-elena',
      recordedByName: 'Dr. Elena Vance',
      category: 'spectroscopy',
      parameter: 'Baseline Resonance Units (RU)',
      value: 1245.4,
      unit: 'RU',
      status: 'normal',
      notes: 'Initial CM5 chip immobilization reference level after running buffer wash.',
      createdAt: '2026-02-22T11:15:00.000Z',
    },
    {
      id: 'obs-2',
      experimentId: exp1Id,
      timestamp: '2026-02-22T12:00:00.000Z',
      recordedById: 'usr-elena',
      recordedByName: 'Dr. Elena Vance',
      category: 'measurement',
      parameter: 'Max Sensor Response (Rmax) at 50 nM BSC-401',
      value: 142.8,
      unit: 'RU',
      status: 'normal',
      notes: 'Binding curve achieved rapid saturation with Langmuir 1:1 stoichiometry fit.',
      createdAt: '2026-02-22T12:00:00.000Z',
    },
    {
      id: 'obs-3',
      experimentId: exp1Id,
      timestamp: '2026-02-22T13:30:00.000Z',
      recordedById: 'usr-elena',
      recordedByName: 'Dr. Elena Vance',
      category: 'environmental',
      parameter: 'Flow Cell Temperature',
      value: 25.04,
      unit: '°C',
      status: 'normal',
      notes: 'Peltier element maintained within tolerance (±0.05°C).',
      createdAt: '2026-02-22T13:30:00.000Z',
    },
    {
      id: 'obs-4',
      experimentId: exp1Id,
      timestamp: '2026-02-22T14:10:00.000Z',
      recordedById: 'usr-elena',
      recordedByName: 'Dr. Elena Vance',
      category: 'measurement',
      parameter: 'Calculated Equilibrium Dissociation Constant (KD)',
      value: 8.42,
      unit: 'nM',
      status: 'normal',
      notes: 'ka = 4.12e5 (1/Ms), kd = 3.47e-3 (1/s). Chi-square = 0.42.',
      createdAt: '2026-02-22T14:10:00.000Z',
    },
    {
      id: 'obs-5',
      experimentId: exp2Id,
      timestamp: '2026-02-14T10:15:00.000Z',
      recordedById: 'usr-marcus',
      recordedByName: 'Dr. Marcus Chen',
      category: 'measurement',
      parameter: 'Post-Thaw Cell Viability (24h AO/PI)',
      value: 94.2,
      unit: '%',
      status: 'normal',
      notes: 'Significantly exceeds 85% release criteria (p < 0.001 vs 10% DMSO control).',
      createdAt: '2026-02-14T10:15:00.000Z',
    },
    {
      id: 'obs-6',
      experimentId: exp2Id,
      timestamp: '2026-02-14T10:45:00.000Z',
      recordedById: 'usr-marcus',
      recordedByName: 'Dr. Marcus Chen',
      category: 'measurement',
      parameter: 'Effector-to-Target (E:T) Cytotoxicity Lysis',
      value: 88.6,
      unit: '%',
      status: 'normal',
      notes: 'Nalm-6 luciferase bioluminescence assay at 5:1 ratio.',
      createdAt: '2026-02-14T10:45:00.000Z',
    },
  ];

  // 21 CFR Part 11 Electronic Signature Ceremony for Exp 2
  const signedTimestamp = '2026-02-15T14:20:00.000Z';
  const sigReason = 'I approve this laboratory notebook record and confirm data integrity pursuant to 21 CFR Part 11 regulations.';
  const sigDigest = computeSignatureDigest({
    versionHash: exp2Hash,
    signerId: 'usr-sarah',
    role: 'qa_compliance',
    reason: sigReason,
    timestamp: signedTimestamp,
  });

  const approvals: Approval[] = [
    {
      id: 'appr-001',
      experimentId: exp1Id,
      experimentTitle: 'Dose-Response Surface Plasmon Resonance (SPR) of Small Molecule PROTAC Degrader BSC-401',
      experimentNumber: 'EXP-2026-0042',
      versionId: 'ver-kras-002',
      versionNumber: '1.1',
      requesterId: 'usr-elena',
      requesterName: 'Dr. Elena Vance',
      reviewerId: 'usr-marcus',
      reviewerName: 'Dr. Marcus Chen',
      role: 'peer_review',
      status: 'pending',
      signatureReason: 'Peer review verification of SPR kinetic fitting and regeneration protocol.',
      createdAt: '2026-02-22T17:00:00.000Z',
    },
    {
      id: 'appr-002',
      experimentId: exp2Id,
      experimentTitle: 'Validation of Cryopreservation Protocol for T-Cell Viability at -196°C Liquid Nitrogen',
      experimentNumber: 'EXP-2026-0038',
      versionId: 'ver-cart-001',
      versionNumber: '2.0',
      requesterId: 'usr-marcus',
      requesterName: 'Dr. Marcus Chen',
      reviewerId: 'usr-sarah',
      reviewerName: 'Sarah Jenkins, RAC',
      role: 'qa_compliance',
      status: 'approved',
      signatureReason: sigReason,
      signatureDigest: sigDigest,
      comments: 'Full compliance verified. All raw data audit logs reconciled. Batch FORM-CRYO-101 released for clinical phase.',
      signedAt: signedTimestamp,
      createdAt: '2026-02-14T15:00:00.000Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-001',
      timestamp: '2026-02-14T11:00:00.000Z',
      userId: 'usr-marcus',
      userName: 'Dr. Marcus Chen',
      userRole: 'reviewer',
      action: 'VERSION_COMMIT',
      entityType: 'experiment',
      entityId: exp2Id,
      details: 'Committed Version 2.0 of EXP-2026-0038 with SHA-256 hash ' + exp2Hash.substring(0, 12) + '...',
      checksum: computeAuditChecksum({
        id: 'aud-001',
        timestamp: '2026-02-14T11:00:00.000Z',
        userId: 'usr-marcus',
        action: 'VERSION_COMMIT',
        entityId: exp2Id,
        details: 'Committed Version 2.0 of EXP-2026-0038 with SHA-256 hash ' + exp2Hash.substring(0, 12) + '...',
      }),
    },
    {
      id: 'aud-002',
      timestamp: signedTimestamp,
      userId: 'usr-sarah',
      userName: 'Sarah Jenkins, RAC',
      userRole: 'qa_manager',
      action: 'E_SIGNATURE',
      entityType: 'approval',
      entityId: 'appr-002',
      details: '21 CFR Part 11 Electronic Signature executed with reason: Quality Assurance Release. Digest: ' + sigDigest.substring(0, 12) + '...',
      checksum: computeAuditChecksum({
        id: 'aud-002',
        timestamp: signedTimestamp,
        userId: 'usr-sarah',
        action: 'E_SIGNATURE',
        entityId: 'appr-002',
        details: '21 CFR Part 11 Electronic Signature executed with reason: Quality Assurance Release. Digest: ' + sigDigest.substring(0, 12) + '...',
      }),
    },
    {
      id: 'aud-003',
      timestamp: '2026-02-22T17:00:00.000Z',
      userId: 'usr-elena',
      userName: 'Dr. Elena Vance',
      userRole: 'researcher',
      action: 'UPDATE',
      entityType: 'approval',
      entityId: 'appr-001',
      details: 'Submitted experiment EXP-2026-0042 (v1.1) to Dr. Marcus Chen for peer review sign-off.',
      checksum: computeAuditChecksum({
        id: 'aud-003',
        timestamp: '2026-02-22T17:00:00.000Z',
        userId: 'usr-elena',
        action: 'UPDATE',
        entityId: 'appr-001',
        details: 'Submitted experiment EXP-2026-0042 (v1.1) to Dr. Marcus Chen for peer review sign-off.',
      }),
    },
  ];

  dbManager.db.users = users;
  dbManager.db.projects = projects;
  dbManager.db.formulations = formulations;
  dbManager.db.experiments = experiments;
  dbManager.db.experimentVersions = [...exp1Versions, ...exp2Versions, ...exp3Versions];
  dbManager.db.observations = observations;
  dbManager.db.approvals = approvals;
  dbManager.db.auditLogs = auditLogs;

  dbManager.saveLocalData();
  console.log('✅ Seeding completed: Loaded users, projects, formulations, experiments, and 21 CFR Part 11 records.');
}
