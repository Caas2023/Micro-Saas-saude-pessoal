export interface ExamMarker {
  marker_name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
}

export interface OCRResult {
  results: ExamMarker[];
}

export type ClinicalStatus = 'LOW' | 'NORMAL' | 'HIGH';

export interface SavedResult extends ExamMarker {
  clinical_status: ClinicalStatus;
}
