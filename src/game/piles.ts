export const FOUNDATION_IDS = ['foundation-1', 'foundation-2', 'foundation-3', 'foundation-4'] as const;
export const TABLEAU_IDS = [
  'tableau-1',
  'tableau-2',
  'tableau-3',
  'tableau-4',
  'tableau-5',
  'tableau-6',
  'tableau-7',
] as const;

export type FoundationId = (typeof FOUNDATION_IDS)[number];
export type TableauId = (typeof TABLEAU_IDS)[number];
export type PileId = 'stock' | 'waste' | FoundationId | TableauId;

export const PILE_IDS: readonly PileId[] = ['stock', 'waste', ...FOUNDATION_IDS, ...TABLEAU_IDS];

/** Narrows an untrusted string, such as a data attribute read back from the DOM. */
export function parsePileId(value: string | undefined): PileId | null {
  return PILE_IDS.find((id) => id === value) ?? null;
}

/** "tableau-3" becomes "tableau 3", ready to drop into a sentence. */
export function pileName(id: PileId): string {
  return id.replace('-', ' ');
}

/** "tableau-3" becomes "Tableau 3", for labels. */
export function pileLabel(id: PileId): string {
  const name = pileName(id);
  return name.charAt(0).toUpperCase() + name.slice(1);
}
