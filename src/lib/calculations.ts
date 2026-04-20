import type { ClinicalStatus, ExamMarker, SavedResult } from "../types/exam";

/**
 * Calcula o status clínico baseado nos valores de referência
 */
export const calculateClinicalStatus = (
  value: number,
  min: number | null,
  max: number | null
): ClinicalStatus => {
  if (min !== null && value < min) return 'LOW';
  if (max !== null && value > max) return 'HIGH';
  return 'NORMAL';
};

/**
 * Calcula a variação percentual (Delta) entre dois valores
 */
export const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Prepara os resultados extraídos para salvamento, injetando o status clínico
 */
export const prepareResultsForSave = (markers: ExamMarker[]): SavedResult[] => {
  return markers.map(m => ({
    ...m,
    clinical_status: calculateClinicalStatus(m.value, m.reference_min, m.reference_max)
  }));
};
