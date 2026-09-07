import { FormulationIngredient } from '../types';

export function calculateStoichiometry(
  ingredients: FormulationIngredient[],
  targetBatchSize: number,
  batchUnit: 'mL' | 'L' | 'g' | 'kg'
) {
  return ingredients.map((ing) => {
    // Standardize to grams or milliliters
    let concentration = '';
    if (batchUnit === 'mL' || batchUnit === 'L') {
      const volumeLiters = batchUnit === 'L' ? targetBatchSize : targetBatchSize / 1000;
      let massGrams = 0;
      if (ing.unit === 'g') massGrams = ing.targetQuantity;
      if (ing.unit === 'mg') massGrams = ing.targetQuantity / 1000;

      if (ing.molecularWeight > 0 && volumeLiters > 0 && massGrams > 0) {
        const molarity = massGrams / (ing.molecularWeight * volumeLiters);
        concentration = molarity < 0.01 
          ? `${(molarity * 1000).toFixed(2)} mM` 
          : `${molarity.toFixed(3)} M`;
      }
    }

    return {
      ...ing,
      calculatedConcentration: concentration || 'N/A',
      effectivePurityRatio: (ing.purityPercentage / 100).toFixed(3),
    };
  });
}

export function scaleFormulation(
  ingredients: FormulationIngredient[],
  currentBatchSize: number,
  newBatchSize: number
): FormulationIngredient[] {
  if (currentBatchSize <= 0 || newBatchSize <= 0) return ingredients;
  const scaleRatio = newBatchSize / currentBatchSize;

  return ingredients.map((ing) => ({
    ...ing,
    targetQuantity: parseFloat((ing.targetQuantity * scaleRatio).toFixed(4)),
  }));
}
