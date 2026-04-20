/**
 * Mapeia marcadores comuns para categorias clínicas
 */
export const categorizeMarker = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('leucócitos') || n.includes('hemoglobina') || n.includes('plaquetas') || n.includes('glicose')) return 'Sangue';
  if (n.includes('densidade') || n.includes('ph') || n.includes('creatinina') || n.includes('ureia')) return 'Urina';
  if (n.includes('tsh') || n.includes('t4') || n.includes('cortisol') || n.includes('testosterona')) return 'Hormônios';
  return 'Geral';
};
