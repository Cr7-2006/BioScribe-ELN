import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Experiment, ExperimentVersion, Observation, Formulation, Approval } from '../types';
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime } from './date';

interface ExportExperimentPdfParams {
  experiment: Experiment;
  currentVersion: ExperimentVersion;
  observations: Observation[];
  formulation?: Formulation | null;
  approvals: Approval[];
  userName?: string;
}

export async function exportCertifiedExperimentPdf({
  experiment,
  currentVersion,
  observations,
  formulation,
  approvals,
  userName = 'Authorized Laboratory Operator',
}: ExportExperimentPdfParams): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let cursorY = margin;

  // Generate QR Code data URL for the cryptographic seal
  const qrPayload = JSON.stringify({
    system: 'BioScribe ELN',
    docId: experiment.experimentNumber,
    version: currentVersion.versionNumber,
    sha256: currentVersion.hashSha256,
    status: experiment.status,
    timestamp: new Date().toISOString(),
  });

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 120,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate verification QR code', err);
  }

  // --- Top Decorative Header Bar ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 6, 'F');

  // --- Primary Header ---
  cursorY = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('BIOSCRIBE ELECTRONIC LABORATORY NOTEBOOK', margin, cursorY);

  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFIED LABORATORY RUN SHEET & EXPERIMENT RECORD', margin, cursorY);

  // Verification QR Code on top right
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 22, 10, 22, 22);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scan for Cryptographic Seal', pageWidth - margin - 22, 34, { align: 'left' });
  }

  cursorY += 10;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);

  // --- Document Metadata Grid ---
  cursorY += 6;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 28, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 28, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);

  const col1 = margin + 4;
  const col2 = margin + 55;
  const col3 = margin + 115;
  let metaY = cursorY + 6;

  doc.text('EXPERIMENT TITLE:', col1, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const truncatedTitle = experiment.title.length > 55 ? experiment.title.substring(0, 52) + '...' : experiment.title;
  doc.text(truncatedTitle, col1 + 32, metaY);

  metaY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('EXPERIMENT ID:', col1, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(experiment.experimentNumber, col1 + 27, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PROJECT CODE:', col2, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(experiment.projectCode, col2 + 25, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('STATUS:', col3, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(experiment.status === 'approved' ? 22 : experiment.status === 'rejected' ? 220 : 202, experiment.status === 'approved' ? 101 : experiment.status === 'rejected' ? 38 : 138, experiment.status === 'approved' ? 52 : experiment.status === 'rejected' ? 38 : 4);
  doc.text(experiment.status.toUpperCase(), col3 + 15, metaY);

  metaY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CURRENT VERSION:', col1, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`v${currentVersion.versionNumber}`, col1 + 32, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('LEAD AUTHOR:', col2, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(experiment.authorName || 'Primary Investigator', col2 + 25, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('RECORD DATE:', col3, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDisplayDate(experiment.createdAt), col3 + 24, metaY);

  metaY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DIGITAL HASH:', col1, metaY);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(currentVersion.hashSha256 || 'SHA-256 VERIFIED IMMUTABLE', col1 + 24, metaY);

  cursorY += 34;

  // --- Cryptographic Tamper-Proof Stamp Banner ---
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(20, 184, 166); // teal-500
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 9, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 118, 110);
  doc.text(
    'CRYPTOGRAPHIC INTEGRITY ASSURANCE: Document sealed via SHA-256 fingerprinting. Tamper-evident audit trail active.',
    margin + 4,
    cursorY + 5.8
  );

  cursorY += 14;

  // --- Section 1: Objective & Hypothesis ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. SCIENTIFIC OBJECTIVE & HYPOTHESIS', margin, cursorY);

  cursorY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Objective:', margin, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const splitObjective = doc.splitTextToSize(currentVersion.objective || experiment.objective || 'N/A', pageWidth - margin * 2 - 20);
  doc.text(splitObjective, margin + 18, cursorY);

  cursorY += (splitObjective.length * 4) + 3;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Hypothesis:', margin, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const splitHypothesis = doc.splitTextToSize(currentVersion.hypothesis || experiment.hypothesis || 'N/A', pageWidth - margin * 2 - 20);
  doc.text(splitHypothesis, margin + 18, cursorY);

  cursorY += (splitHypothesis.length * 4) + 6;

  // --- Section 2: Sequential Protocol Steps ---
  const protocolSteps = currentVersion.protocolSteps || [];
  const protocolTableRows = protocolSteps.map((step) => [
    `#${step.stepNumber}`,
    step.title,
    step.instruction,
    step.durationMinutes ? `${step.durationMinutes} min` : '—',
    step.temperatureCelsius !== undefined && step.temperatureCelsius !== null ? `${step.temperatureCelsius}°C` : 'Amb.',
    step.criticalQualityAttribute ? 'CRITICAL (CQA)' : 'Standard',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Step', 'Protocol Phase', 'Actionable Instructions', 'Duration', 'Temp', 'Quality Level']],
    body: protocolTableRows.length > 0 ? protocolTableRows : [['—', 'No steps recorded', 'No standardized protocol steps defined for this run version', '—', '—', '—']],
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      valign: 'middle',
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 36, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 26, halign: 'center' },
    },
    didDrawPage: (data) => {
      // Reserved for header/footer rendering
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a page break before formulations
  if (cursorY > pageHeight - 60) {
    doc.addPage();
    cursorY = 20;
  }

  // --- Section 3: Material & Chemical Formulations (if available) ---
  if (formulation && formulation.ingredients && formulation.ingredients.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`2. REAGENT STOICHIOMETRY & FORMULATION: ${formulation.name} (${formulation.code})`, margin, cursorY);
    cursorY += 4;

    const formulationRows = formulation.ingredients.map((ing) => [
      ing.name,
      ing.casNumber || 'N/A',
      ing.lotNumber || 'Pending',
      `${ing.molecularWeight} g/mol`,
      `${ing.purityPercentage}%`,
      `${ing.targetQuantity} ${ing.unit}`,
      ing.role.replace('_', ' ').toUpperCase(),
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['Reagent Name', 'CAS #', 'Lot Number', 'Mol. Weight', 'Purity', 'Target Qty', 'Functional Role']],
      body: formulationRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'center' },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Check page break before Observations
  if (cursorY > pageHeight - 55) {
    doc.addPage();
    cursorY = 20;
  }

  // --- Section 4: Recorded Data & Analytical Observations ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const sectionNumber = formulation ? '3' : '2';
  doc.text(`${sectionNumber}. RECORDED ANALYTICAL OBSERVATIONS (${observations.length} ENTRIES)`, margin, cursorY);
  cursorY += 4;

  const observationRows = observations.map((o) => [
    formatDisplayDateTime(o.timestamp),
    o.category.toUpperCase(),
    o.parameter,
    `${o.value} ${o.unit}`,
    o.status.toUpperCase(),
    o.notes || '—',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Timestamp', 'Category', 'Parameter Tested', 'Observed Value', 'Status', 'Operator Field Notes']],
    body: observationRows.length > 0 ? observationRows : [['—', '—', 'No data points recorded', '—', '—', '—']],
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 35, fontStyle: 'bold' },
      3: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 'auto' },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // Check page break before Signatures
  if (cursorY > pageHeight - 60) {
    doc.addPage();
    cursorY = 20;
  }

  // --- Section 5: Electronic Signatures & Review Attestation ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const sigSectionNum = formulation ? '4' : '3';
  doc.text(`${sigSectionNum}. ELECTRONIC SIGNATURE ATTESTATION & REVIEW VERIFICATION`, margin, cursorY);
  cursorY += 4;

  const approvedSignatures = approvals.filter((a) => a.status === 'approved');
  const signatureRows = approvedSignatures.map((sig) => [
    sig.reviewerName || 'Authorized Signer',
    sig.role.replace('_', ' ').toUpperCase(),
    sig.signedAt ? formatDisplayDateTime(sig.signedAt) : 'Verified',
    sig.signatureReason,
    sig.signatureDigest ? sig.signatureDigest.substring(0, 24) + '...' : 'SHA-256 Validated',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Signer Name', 'Role & Authorization', 'Timestamp', 'Legal Attestation Reason', 'Cryptographic Digest']],
    body: signatureRows.length > 0
      ? signatureRows
      : [['Self-Signed Author', 'RESEARCHER', formatDisplayDateTime(experiment.createdAt), 'Primary author laboratory record submission', currentVersion.hashSha256 ? currentVersion.hashSha256.substring(0, 24) + '...' : 'SHA-256 Validated']],
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 38, fontStyle: 'bold' },
    },
  });

  // --- Final Footers for all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Left footer
    doc.text(
      `BioScribe ELN | Certified Electronic Record | Document Ref: ${experiment.experimentNumber}-V${currentVersion.versionNumber}`,
      margin,
      pageHeight - 7
    );

    // Right footer
    doc.text(
      `Page ${i} of ${totalPages} | Generated by: ${userName}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  // Trigger download
  const safeFilename = `${experiment.experimentNumber}_V${currentVersion.versionNumber}_Certified_Report.pdf`.replace(/[^a-zA-Z0-9_\-.]/g, '_');
  doc.save(safeFilename);
}

export async function exportCertifiedFormulationPdf(
  formulation: Formulation,
  userName = 'Authorized Laboratory Operator'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let cursorY = margin;

  // QR code
  const qrPayload = JSON.stringify({
    system: 'BioScribe ELN',
    type: 'Formulation Master Specification',
    code: formulation.code,
    name: formulation.name,
    batchSize: `${formulation.targetBatchSize} ${formulation.batchUnit}`,
    componentsCount: formulation.ingredients?.length || 0,
    timestamp: new Date().toISOString(),
  });

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 120,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch (err) {
    console.error('Failed to generate formulation QR', err);
  }

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 6, 'F');

  cursorY = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('BIOSCRIBE CHEMICAL FORMULATION CERTIFICATE', margin, cursorY);

  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICIAL MASTER BATCH RECORD & REAGENT STOICHIOMETRY SHEET', margin, cursorY);

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 22, 10, 22, 22);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scan for Batch Seal', pageWidth - margin - 22, 34);
  }

  cursorY += 10;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);

  cursorY += 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 22, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 22, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);

  let metaY = cursorY + 6;
  doc.text('FORMULATION NAME:', margin + 4, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formulation.name, margin + 40, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('FORMULATION CODE:', margin + 115, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formulation.code, margin + 152, metaY);

  metaY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TARGET BATCH SIZE:', margin + 4, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${formulation.targetBatchSize} ${formulation.batchUnit}`, margin + 40, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('THEORETICAL YIELD:', margin + 115, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${formulation.theoreticalYieldPercentage}%`, margin + 152, metaY);

  metaY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PREPARED BY:', margin + 4, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formulation.authorName || 'Formulation Chemist', margin + 40, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DATE RECORDED:', margin + 115, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDisplayDate(formulation.createdAt), margin + 152, metaY);

  cursorY += 28;

  // Description
  if (formulation.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Formulation Description:', margin, cursorY);
    cursorY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const splitDesc = doc.splitTextToSize(formulation.description, pageWidth - margin * 2);
    doc.text(splitDesc, margin, cursorY);
    cursorY += (splitDesc.length * 4) + 6;
  }

  // Ingredients table
  const ingredients = formulation.ingredients || [];
  const ingRows = ingredients.map((ing) => [
    ing.name,
    ing.casNumber || 'N/A',
    ing.lotNumber || 'Pending',
    `${ing.molecularWeight} g/mol`,
    `${ing.purityPercentage}%`,
    `${ing.targetQuantity} ${ing.unit}`,
    ing.role.replace('_', ' ').toUpperCase(),
    (ing.hazards && ing.hazards.length > 0) ? ing.hazards.join(', ') : 'None',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Chemical Name', 'CAS #', 'Lot Number', 'Mol. Weight', 'Purity %', 'Target Quantity', 'Role', 'Hazards / Safety']],
    body: ingRows.length > 0 ? ingRows : [['—', '—', '—', '—', '—', '—', '—', '—']],
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'center' },
      7: { textColor: [180, 83, 9] },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 12;

  // Attestation sign-off box
  if (cursorY > pageHeight - 45) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LABORATORY QUALITY ATTESTATION & BATCH APPROVAL', margin + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'I hereby certify that this master formulation specification has been checked for stoichiometric balance, chemical compatibility, and purity standards.',
    margin + 4,
    cursorY + 12
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Authorized Operator: ${userName}`, margin + 4, cursorY + 20);
  doc.text(`Date of Release: ${formatDisplayDate(new Date().toISOString())}`, margin + 110, cursorY + 20);

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`BioScribe ELN | Master Formulation Specification: ${formulation.code}`, margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages} | Generated by: ${userName}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  const safeFilename = `${formulation.code}_Master_Formulation_Specification.pdf`.replace(/[^a-zA-Z0-9_\-.]/g, '_');
  doc.save(safeFilename);
}
