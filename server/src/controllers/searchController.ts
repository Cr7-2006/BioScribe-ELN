import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  ExperimentModel,
  FormulationModel,
  AuditLogModel,
  ExperimentVersionModel,
} from '../models';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (!query) {
      return res.json({
        query: '',
        total: 0,
        results: {
          experiments: [],
          formulations: [],
          reagents: [],
          auditLogs: [],
          versions: [],
        },
      });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    // Run parallel searches across collections
    const [experiments, formulations, formulationsWithReagents, auditLogs, versions] = await Promise.all([
      ExperimentModel.find({
        $or: [
          { title: regex },
          { experimentNumber: regex },
          { projectCode: regex },
          { objective: regex },
          { hypothesis: regex },
          { authorName: regex },
        ],
      })
        .limit(8)
        .lean(),

      FormulationModel.find({
        $or: [
          { name: regex },
          { code: regex },
          { description: regex },
          { authorName: regex },
        ],
      })
        .limit(8)
        .lean(),

      FormulationModel.find({
        $or: [
          { 'ingredients.name': regex },
          { 'ingredients.casNumber': regex },
          { 'ingredients.lotNumber': regex },
        ],
      })
        .limit(10)
        .lean(),

      AuditLogModel.find({
        $or: [
          { action: regex },
          { userName: regex },
          { entityType: regex },
          { details: regex },
          { checksum: regex },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(8)
        .lean(),

      ExperimentVersionModel.find({
        $or: [
          { hashSha256: regex },
          { changeSummary: regex },
          { title: regex },
        ],
      })
        .limit(6)
        .lean(),
    ]);

    // Extract reagent matches from formulations
    const reagentMap = new Map<string, any>();
    for (const form of formulationsWithReagents as any[]) {
      for (const ing of form.ingredients || []) {
        const matchesName = regex.test(ing.name);
        const matchesCas = ing.casNumber && regex.test(ing.casNumber);
        const matchesLot = ing.lotNumber && regex.test(ing.lotNumber);

        if (matchesName || matchesCas || matchesLot) {
          const key = `${ing.name}-${ing.casNumber}-${form.id}`;
          if (!reagentMap.has(key)) {
            reagentMap.set(key, {
              ingredient: ing,
              formulationId: form.id,
              formulationCode: form.code,
              formulationName: form.name,
              matchType: matchesCas ? 'CAS Number' : matchesLot ? 'Lot Number' : 'Chemical Name',
            });
          }
        }
      }
    }
    const reagents = Array.from(reagentMap.values()).slice(0, 10);

    const total =
      experiments.length +
      formulations.length +
      reagents.length +
      auditLogs.length +
      versions.length;

    return res.json({
      query,
      total,
      results: {
        experiments,
        formulations,
        reagents,
        auditLogs,
        versions,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Global search failed' });
  }
};
