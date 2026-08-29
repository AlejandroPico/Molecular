import {
  ELEMENTS as PERIODIC_ELEMENTS,
  ELEMENT_BY_SYMBOL as PERIODIC_ELEMENT_BY_SYMBOL,
  QUICK_ELEMENTS as PERIODIC_QUICK_ELEMENTS,
  type ElementSymbol,
} from './periodic-table.data';

export type { ElementSymbol } from './periodic-table.data';

export interface ElementDefinition {
  symbol: ElementSymbol;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  valences: number[];
  covalentRadius: number;
  vanDerWaalsRadius: number;
  color: string;
  textColor: string;
  group: string;
  category?: string;
  period?: number;
  groupNumber?: number | null;
  tableColumn?: number;
  tableRow?: number;
  description: string;
  implicitHydrogens?: boolean;
}

export type BondKind = 'single' | 'double' | 'triple' | 'wedge' | 'hash' | 'aromatic' | 'any';

export interface Atom {
  id: string;
  element: ElementSymbol;
  x: number;
  y: number;
  charge: number;
}

export interface Bond {
  id: string;
  atomA: string;
  atomB: string;
  order: 1 | 2 | 3;
  kind?: BondKind;
}

export interface MoleculeDocument {
  id: string;
  name: string;
  atoms: Atom[];
  bonds: Bond[];
  createdAt: string;
  updatedAt: string;
}

export interface MoleculeStats {
  formula: string;
  explicitFormula: string;
  molecularMass: number;
  atomCount: number;
  bondCount: number;
  implicitHydrogens: number;
  warnings: string[];
  invalidAtomIds: Set<string>;
}

export const ELEMENTS = PERIODIC_ELEMENTS;
export const ELEMENT_BY_SYMBOL = PERIODIC_ELEMENT_BY_SYMBOL;
export const QUICK_ELEMENTS = PERIODIC_QUICK_ELEMENTS;

function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + '-' + crypto.randomUUID();
  }
  return prefix + '-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createAtom(element: ElementSymbol, x: number, y: number): Atom {
  return { id: uid('atom'), element, x, y, charge: 0 };
}

export function bondKindOrder(kind: BondKind): 1 | 2 | 3 {
  if (kind === 'double') return 2;
  if (kind === 'triple') return 3;
  return 1;
}

export function bondKindForOrder(order: 1 | 2 | 3): BondKind {
  return order === 2 ? 'double' : order === 3 ? 'triple' : 'single';
}

export function createBond(
  atomA: string,
  atomB: string,
  order: 1 | 2 | 3 = 1,
  kind: BondKind = bondKindForOrder(order),
): Bond {
  return { id: uid('bond'), atomA, atomB, order, kind };
}

export function createDocument(name = 'Molécula sin título'): MoleculeDocument {
  const now = new Date().toISOString();
  return { id: uid('molecule'), name, atoms: [], bonds: [], createdAt: now, updatedAt: now };
}

export function cloneDocument(document: MoleculeDocument): MoleculeDocument {
  return {
    ...document,
    atoms: document.atoms.map((atom) => ({ ...atom })),
    bonds: document.bonds.map((bond) => ({ ...bond })),
  };
}

export function bondOrderForAtom(document: MoleculeDocument, atomId: string): number {
  return document.bonds
    .filter((bond) => bond.atomA === atomId || bond.atomB === atomId)
    .reduce((sum, bond) => sum + bond.order, 0);
}

const CHARGED_VALENCES: Partial<Record<ElementSymbol, Partial<Record<number, number[]>>>> = {
  H: { [-1]: [0], [1]: [0] },
  B: { [-1]: [4], [1]: [2] },
  C: { [-1]: [3], [1]: [3] },
  N: { [-1]: [2], [1]: [4] },
  O: { [-1]: [1], [1]: [3] },
  F: { [-1]: [0], [1]: [2] },
  Si: { [-1]: [3], [1]: [3] },
  P: { [-1]: [2, 4], [1]: [4] },
  S: { [-1]: [1, 3, 5], [1]: [3, 5] },
  Cl: { [-1]: [0], [1]: [2, 4, 6] },
  Br: { [-1]: [0], [1]: [2, 4, 6] },
  I: { [-1]: [0], [1]: [2, 4, 6] },
};

export interface ChemistryValidation {
  valid: boolean;
  message: string;
}

export function allowedValencesForAtom(atom: Atom): number[] {
  const definition = ELEMENT_BY_SYMBOL.get(atom.element);
  if (!definition) return [];
  const charged = CHARGED_VALENCES[atom.element]?.[atom.charge];
  return charged ? [...charged] : [...definition.valences];
}

export function maxValenceForAtom(atom: Atom): number {
  return Math.max(0, ...allowedValencesForAtom(atom));
}

export function validateBondChange(
  document: MoleculeDocument,
  atomAId: string,
  atomBId: string,
  order: 1 | 2 | 3,
): ChemistryValidation {
  if (atomAId === atomBId)
    return { valid: false, message: 'Un átomo no puede enlazarse consigo mismo.' };
  const atoms = [atomAId, atomBId].map((id) => document.atoms.find((atom) => atom.id === id));
  if (!atoms[0] || !atoms[1]) return { valid: false, message: 'No se encuentran ambos átomos.' };
  const existing = document.bonds.find(
    (bond) =>
      (bond.atomA === atomAId && bond.atomB === atomBId) ||
      (bond.atomA === atomBId && bond.atomB === atomAId),
  );

  for (const atom of atoms as Atom[]) {
    const occupied = bondOrderForAtom(document, atom.id) - (existing?.order ?? 0) + order;
    const maximum = maxValenceForAtom(atom);
    if (occupied > maximum) {
      const definition = ELEMENT_BY_SYMBOL.get(atom.element)!;
      return {
        valid: false,
        message: `${definition.name} (${atom.element}) admite hasta ${maximum} unidades de enlace con su carga actual; la operación exigiría ${occupied}.`,
      };
    }
  }
  return { valid: true, message: '' };
}

export function validateElementChange(
  document: MoleculeDocument,
  atom: Atom,
  element: ElementSymbol,
): ChemistryValidation {
  const candidate: Atom = { ...atom, element };
  const occupied = bondOrderForAtom(document, atom.id);
  const maximum = maxValenceForAtom(candidate);
  if (occupied <= maximum) return { valid: true, message: '' };
  const definition = ELEMENT_BY_SYMBOL.get(element)!;
  return {
    valid: false,
    message: `No se puede convertir en ${definition.name}: tiene ${occupied} unidades de enlace y ${element} admite ${maximum}.`,
  };
}

export function validateChargeChange(
  document: MoleculeDocument,
  atom: Atom,
  charge: number,
): ChemistryValidation {
  const candidate: Atom = { ...atom, charge };
  const occupied = bondOrderForAtom(document, atom.id);
  const maximum = maxValenceForAtom(candidate);
  if (occupied <= maximum) return { valid: true, message: '' };
  return {
    valid: false,
    message: `${atom.element} con carga ${charge > 0 ? '+' : ''}${charge} admitiría ${maximum} unidades de enlace, pero ya utiliza ${occupied}.`,
  };
}

export function implicitHydrogensForAtom(document: MoleculeDocument, atom: Atom): number {
  if (atom.element === 'H') return 0;
  const definition = ELEMENT_BY_SYMBOL.get(atom.element);
  if (!definition?.implicitHydrogens) return 0;
  const occupied = bondOrderForAtom(document, atom.id);
  const target = allowedValencesForAtom(atom).find((valence) => valence >= occupied) ?? 0;
  return Math.max(0, target - occupied);
}

export function calculateStats(document: MoleculeDocument): MoleculeStats {
  const elementCounts = new Map<ElementSymbol, number>();
  let implicitHydrogens = 0;
  let molecularMass = 0;
  const warnings: string[] = [];
  const invalidAtomIds = new Set<string>();

  for (const atom of document.atoms) {
    elementCounts.set(atom.element, (elementCounts.get(atom.element) ?? 0) + 1);
    molecularMass += ELEMENT_BY_SYMBOL.get(atom.element)?.atomicMass ?? 0;
    const usedValence = bondOrderForAtom(document, atom.id);
    const maxValence = maxValenceForAtom(atom);
    if (usedValence > maxValence) {
      invalidAtomIds.add(atom.id);
      warnings.push(
        atom.element + ' supera su valencia admitida (' + usedValence + '/' + maxValence + ').',
      );
    }
    const implicit = implicitHydrogensForAtom(document, atom);
    implicitHydrogens += implicit;
    molecularMass += implicit * (ELEMENT_BY_SYMBOL.get('H')?.atomicMass ?? 1.008);
  }

  if (implicitHydrogens > 0) {
    elementCounts.set('H', (elementCounts.get('H') ?? 0) + implicitHydrogens);
  }

  const explicitCounts = new Map<ElementSymbol, number>();
  for (const atom of document.atoms) {
    explicitCounts.set(atom.element, (explicitCounts.get(atom.element) ?? 0) + 1);
  }

  return {
    formula: formatFormula(elementCounts),
    explicitFormula: formatFormula(explicitCounts),
    molecularMass,
    atomCount: document.atoms.length + implicitHydrogens,
    bondCount: document.bonds.length + implicitHydrogens,
    implicitHydrogens,
    warnings,
    invalidAtomIds,
  };
}

function formatFormula(counts: Map<ElementSymbol, number>): string {
  if (!counts.size) return '—';
  const symbols = [...counts.keys()];
  const ordered = symbols.includes('C')
    ? ['C', 'H', ...symbols.filter((symbol) => symbol !== 'C' && symbol !== 'H').sort()]
    : symbols.sort(
        (a, b) =>
          (ELEMENT_BY_SYMBOL.get(a)?.atomicNumber ?? 0) -
          (ELEMENT_BY_SYMBOL.get(b)?.atomicNumber ?? 0),
      );
  return ordered
    .filter(
      (symbol, index, all) =>
        all.indexOf(symbol) === index && (counts.get(symbol as ElementSymbol) ?? 0) > 0,
    )
    .map((symbol) => {
      const count = counts.get(symbol as ElementSymbol) ?? 0;
      return symbol + (count > 1 ? count : '');
    })
    .join('');
}

interface PresetAtom {
  key: string;
  element: ElementSymbol;
  x: number;
  y: number;
}

interface PresetBond {
  a: string;
  b: string;
  order: 1 | 2 | 3;
}

export interface MoleculePreset {
  id: string;
  name: string;
  commonName: string;
  category: string;
  description: string;
  atoms: PresetAtom[];
  bonds: PresetBond[];
}

export const MOLECULE_PRESETS: MoleculePreset[] = [
  {
    id: 'ethanol',
    name: 'Etanol',
    commonName: 'Alcohol etílico',
    category: 'Orgánica',
    description: 'Molécula orgánica sencilla con un grupo hidroxilo.',
    atoms: [
      { key: 'c1', element: 'C', x: 560, y: 390 },
      { key: 'c2', element: 'C', x: 700, y: 390 },
      { key: 'o', element: 'O', x: 840, y: 390 },
    ],
    bonds: [
      { a: 'c1', b: 'c2', order: 1 },
      { a: 'c2', b: 'o', order: 1 },
    ],
  },
  {
    id: 'water',
    name: 'Agua',
    commonName: 'Agua',
    category: 'Inorgánica',
    description: 'Molécula angular esencial para la vida.',
    atoms: [{ key: 'o', element: 'O', x: 700, y: 390 }],
    bonds: [],
  },
  {
    id: 'methane',
    name: 'Metano',
    commonName: 'Metano',
    category: 'Orgánica',
    description: 'El alcano más sencillo, con geometría tetraédrica.',
    atoms: [{ key: 'c', element: 'C', x: 700, y: 390 }],
    bonds: [],
  },
  {
    id: 'ammonia',
    name: 'Amoniaco',
    commonName: 'Amoniaco',
    category: 'Inorgánica',
    description: 'Molécula piramidal con un par electrónico libre.',
    atoms: [{ key: 'n', element: 'N', x: 700, y: 390 }],
    bonds: [],
  },
  {
    id: 'carbon-dioxide',
    name: 'Dióxido de carbono',
    commonName: 'Anhídrido carbónico',
    category: 'Inorgánica',
    description: 'Molécula lineal con dos enlaces dobles.',
    atoms: [
      { key: 'o1', element: 'O', x: 540, y: 390 },
      { key: 'c', element: 'C', x: 700, y: 390 },
      { key: 'o2', element: 'O', x: 860, y: 390 },
    ],
    bonds: [
      { a: 'o1', b: 'c', order: 2 },
      { a: 'c', b: 'o2', order: 2 },
    ],
  },
  {
    id: 'benzene',
    name: 'Benceno',
    commonName: 'Benceno',
    category: 'Aromática',
    description: 'Anillo aromático de seis carbonos con enlaces conjugados.',
    atoms: [
      { key: 'c1', element: 'C', x: 700, y: 245 },
      { key: 'c2', element: 'C', x: 825, y: 318 },
      { key: 'c3', element: 'C', x: 825, y: 462 },
      { key: 'c4', element: 'C', x: 700, y: 535 },
      { key: 'c5', element: 'C', x: 575, y: 462 },
      { key: 'c6', element: 'C', x: 575, y: 318 },
    ],
    bonds: [
      { a: 'c1', b: 'c2', order: 2 },
      { a: 'c2', b: 'c3', order: 1 },
      { a: 'c3', b: 'c4', order: 2 },
      { a: 'c4', b: 'c5', order: 1 },
      { a: 'c5', b: 'c6', order: 2 },
      { a: 'c6', b: 'c1', order: 1 },
    ],
  },
];

export function documentFromPreset(preset: MoleculePreset): MoleculeDocument {
  const document = createDocument(preset.name);
  const ids = new Map<string, string>();
  document.atoms = preset.atoms.map((presetAtom) => {
    const atom = createAtom(presetAtom.element, presetAtom.x, presetAtom.y);
    ids.set(presetAtom.key, atom.id);
    return atom;
  });
  document.bonds = preset.bonds.map((presetBond) =>
    createBond(ids.get(presetBond.a)!, ids.get(presetBond.b)!, presetBond.order),
  );
  return document;
}
