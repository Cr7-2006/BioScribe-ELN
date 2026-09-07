import { Response } from 'express';
import { dbManager } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';
import { calculateStoichiometry, scaleFormulation } from '../services/formulation';
import { Formulation, FormulationIngredient } from '../types';

function getParamStr(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export async function getFormulations(req: AuthRequest, res: Response) {
  const formulations = dbManager.db.formulations.map((f) => ({
    ...f,
    ingredientsCount: f.ingredients.length,
  }));
  return res.json({ formulations });
}

export async function getFormulationById(req: AuthRequest, res: Response) {
  const id = getParamStr(req.params.id);
  const formulation = dbManager.db.formulations.find((f) => f.id === id);

  if (!formulation) {
    return res.status(404).json({ message: 'Formulation not found.' });
  }

  const enrichedIngredients = calculateStoichiometry(
    formulation.ingredients,
    formulation.targetBatchSize,
    formulation.batchUnit
  );

  return res.json({
    formulation: {
      ...formulation,
      ingredients: enrichedIngredients,
    },
  });
}

export async function createFormulation(req: AuthRequest, res: Response) {
  const {
    name,
    description,
    targetBatchSize,
    batchUnit = 'mL',
    theoreticalYieldPercentage = 100,
    ingredients = [],
  } = req.body;
  const user = req.user!;

  if (!name || !targetBatchSize) {
    return res.status(400).json({ message: 'Formulation name and target batch size are required.' });
  }

  const formCount = dbManager.db.formulations.length + 1;
  const code = `FORM-${String(formCount).padStart(4, '0')}`;
  const formulationId = 'form-' + Math.random().toString(36).substring(2, 9);

  const formattedIngredients: FormulationIngredient[] = ingredients.map((ing: any, idx: number) => ({
    id: ing.id || `ing-${idx + 1}`,
    formulationId,
    name: ing.name || 'Component',
    casNumber: ing.casNumber || 'N/A',
    lotNumber: ing.lotNumber || 'LOT-AUTO',
    molecularWeight: Number(ing.molecularWeight) || 0,
    purityPercentage: Number(ing.purityPercentage) || 100,
    targetQuantity: Number(ing.targetQuantity) || 0,
    unit: ing.unit || 'g',
    role: ing.role || 'active_moiety',
    hazards: ing.hazards || [],
  }));

  const now = new Date().toISOString();
  const newFormulation: Formulation = {
    id: formulationId,
    code,
    name,
    description: description || '',
    targetBatchSize: Number(targetBatchSize),
    batchUnit,
    theoreticalYieldPercentage: Number(theoreticalYieldPercentage),
    authorId: user.id,
    authorName: user.name,
    ingredients: formattedIngredients,
    createdAt: now,
    updatedAt: now,
  };

  dbManager.db.formulations.unshift(newFormulation);
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'CREATE',
    entityType: 'formulation',
    entityId: formulationId,
    details: `Formulation ${code} created: "${name}" (${targetBatchSize} ${batchUnit}) with ${formattedIngredients.length} ingredients.`,
  });

  return res.status(201).json({ formulation: newFormulation });
}

export async function calculateBatchScale(req: AuthRequest, res: Response) {
  const { ingredients, currentBatchSize, newBatchSize, batchUnit = 'mL' } = req.body;

  if (!ingredients || !currentBatchSize || !newBatchSize) {
    return res.status(400).json({ message: 'Missing required parameters for batch scaling.' });
  }

  const curSize = Number(currentBatchSize);
  const newSize = Number(newBatchSize);
  if (isNaN(curSize) || curSize <= 0 || isNaN(newSize) || newSize <= 0) {
    return res.status(400).json({ message: 'Batch sizes must be valid positive numbers.' });
  }

  const scaledIngredients = scaleFormulation(ingredients, curSize, newSize);
  const enriched = calculateStoichiometry(scaledIngredients, newSize, batchUnit);

  return res.json({
    scaledBatchSize: Number(newBatchSize),
    batchUnit,
    ingredients: enriched,
  });
}
