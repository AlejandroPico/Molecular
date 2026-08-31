import {
  ELEMENTS as PERIODIC_ELEMENTS,
  ELEMENT_BY_SYMBOL as PERIODIC_ELEMENT_BY_SYMBOL,
  QUICK_ELEMENTS as PERIODIC_QUICK_ELEMENTS,
  type ElementSymbol,
} from './periodic-table.data';

export type { ElementSymbol } from './periodic-table.data';

export type AtomSymbol = ElementSymbol | 'R';

export interface ElementDefinition {
  symbol: AtomSymbol;
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

export type BondKind =
  | 'single'
  | 'double'
  | 'triple'
  | 'up'
  | 'down'
  | 'delocalized'
  | 'hydrogen'
  | 'aromatic'
  | 'dative'
  | 'any'
  | 'wedge'
  | 'hash';

export type ArrowKind = 'forward' | 'resonance' | 'equilibrium';
export type ComponentRole =
  'structure' | 'reactant' | 'product' | 'reagent' | 'catalyst' | 'solvent';
export type ElectronArrowKind = 'pair' | 'single';
export type AtomStereo = 'R' | 'S' | 'unknown';
export type BondStereo = 'E' | 'Z' | 'unknown';

export interface Atom {
  id: string;
  element: AtomSymbol;
  x: number;
  y: number;
  charge: number;
  lonePairs: number;
  radicalElectrons: number;
  implicitHydrogenOverride?: number;
  isotope?: number;
  chirality?: '@' | '@@';
  stereochemistry?: AtomStereo;
}

export interface Bond {
  id: string;
  atomA: string;
  atomB: string;
  order: 1 | 2 | 3;
  kind?: BondKind;
  color?: string;
  stereochemistry?: BondStereo;
}

export interface ReactionArrow {
  id: string;
  kind: ArrowKind;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ElectronArrow {
  id: string;
  kind: ElectronArrowKind;
  x1: number;
  y1: number;
  controlX: number;
  controlY: number;
  x2: number;
  y2: number;
}

export interface MolecularComponent {
  id: string;
  name: string;
  atomIds: string[];
  locked: boolean;
  hidden: boolean;
  role: ComponentRole;
  coefficient: number;
}

export interface ReactionScheme {
  id: string;
  name: string;
  arrowId?: string;
  reactantComponentIds: string[];
  productComponentIds: string[];
  reagentComponentIds: string[];
  catalyst: string;
  solvent: string;
  temperature: string;
  conditions: string;
}

export interface MoleculeDocument {
  schemaVersion?: 2;
  id: string;
  name: string;
  atoms: Atom[];
  bonds: Bond[];
  arrows: ReactionArrow[];
  electronArrows?: ElectronArrow[];
  components?: MolecularComponent[];
  reactions?: ReactionScheme[];
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

const R_GROUP: ElementDefinition = {
  symbol: 'R',
  name: 'Grupo R',
  atomicNumber: 0,
  atomicMass: 0,
  valences: [1],
  covalentRadius: 0.77,
  vanDerWaalsRadius: 1.7,
  color: '#8b5cf6',
  textColor: '#ffffff',
  group: 'Sustituyente',
  category: 'pseudo-element',
  description: 'Sustituyente genérico usado en fórmulas y mecanismos químicos.',
  implicitHydrogens: false,
};

export const ELEMENTS: ReadonlyArray<ElementDefinition> = PERIODIC_ELEMENTS;
export const ELEMENT_BY_SYMBOL = new Map<AtomSymbol, ElementDefinition>([
  ...[...PERIODIC_ELEMENT_BY_SYMBOL.entries()].map(
    ([symbol, definition]) => [symbol, definition] as [AtomSymbol, ElementDefinition],
  ),
  ['R', R_GROUP],
]);
export const QUICK_ELEMENTS = PERIODIC_QUICK_ELEMENTS;

function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + '-' + crypto.randomUUID();
  }
  return prefix + '-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createAtom(element: AtomSymbol, x: number, y: number): Atom {
  return { id: uid('atom'), element, x, y, charge: 0, lonePairs: 0, radicalElectrons: 0 };
}

export function bondKindOrder(kind: BondKind): 1 | 2 | 3 {
  if (kind === 'double') return 2;
  if (kind === 'triple') return 3;
  return 1;
}

export function bondValenceOrder(kind: BondKind, order: 1 | 2 | 3): number {
  if (kind === 'hydrogen' || kind === 'any') return 0;
  if (kind === 'aromatic' || kind === 'delocalized') return 1.5;
  return order;
}

export function bondKindForOrder(order: 1 | 2 | 3): BondKind {
  return order === 2 ? 'double' : order === 3 ? 'triple' : 'single';
}

export function createBond(
  atomA: string,
  atomB: string,
  order: 1 | 2 | 3 = 1,
  kind: BondKind = bondKindForOrder(order),
  color?: string,
): Bond {
  return { id: uid('bond'), atomA, atomB, order, kind, color };
}

export function createDocument(name = 'Molécula sin título'): MoleculeDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    id: uid('molecule'),
    name,
    atoms: [],
    bonds: [],
    arrows: [],
    electronArrows: [],
    components: [],
    reactions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneDocument(document: MoleculeDocument): MoleculeDocument {
  const cloned: MoleculeDocument = {
    ...document,
    schemaVersion: 2,
    atoms: document.atoms.map((atom) => ({
      ...atom,
      lonePairs: atom.lonePairs ?? 0,
      radicalElectrons: atom.radicalElectrons ?? 0,
    })),
    bonds: document.bonds.map((bond) => ({
      ...bond,
      kind: bond.kind === 'wedge' ? 'up' : bond.kind === 'hash' ? 'down' : bond.kind,
    })),
    arrows: (document.arrows ?? []).map((arrow) => ({ ...arrow })),
    electronArrows: (document.electronArrows ?? []).map((arrow) => ({ ...arrow })),
    components: (document.components ?? []).map((component) => ({
      ...component,
      atomIds: [...component.atomIds],
      coefficient: Math.max(1, component.coefficient ?? 1),
      role: component.role ?? 'structure',
    })),
    reactions: (document.reactions ?? []).map((reaction) => ({
      ...reaction,
      reactantComponentIds: [...(reaction.reactantComponentIds ?? [])],
      productComponentIds: [...(reaction.productComponentIds ?? [])],
      reagentComponentIds: [...(reaction.reagentComponentIds ?? [])],
      catalyst: reaction.catalyst ?? '',
      solvent: reaction.solvent ?? '',
      temperature: reaction.temperature ?? '',
      conditions: reaction.conditions ?? '',
    })),
  };
  synchronizeComponents(cloned);
  return cloned;
}

export function createReactionArrow(
  kind: ArrowKind,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): ReactionArrow {
  return { id: uid('arrow'), kind, x1, y1, x2, y2 };
}

export function createElectronArrow(
  kind: ElectronArrowKind,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): ElectronArrow {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const bend = Math.min(90, Math.max(34, length * 0.24));
  return {
    id: uid('electron-arrow'),
    kind,
    x1,
    y1,
    controlX: (x1 + x2) / 2 - (dy / length) * bend,
    controlY: (y1 + y2) / 2 + (dx / length) * bend,
    x2,
    y2,
  };
}

export function createMolecularComponent(
  atomIds: string[],
  name = 'Componente',
): MolecularComponent {
  return {
    id: uid('component'),
    name,
    atomIds: [...new Set(atomIds)],
    locked: false,
    hidden: false,
    role: 'structure',
    coefficient: 1,
  };
}

export function createReactionScheme(
  components: MolecularComponent[],
  arrowId?: string,
): ReactionScheme {
  return {
    id: uid('reaction'),
    name: 'Reacción 1',
    arrowId,
    reactantComponentIds: components
      .filter((component) => component.role === 'reactant')
      .map((component) => component.id),
    productComponentIds: components
      .filter((component) => component.role === 'product')
      .map((component) => component.id),
    reagentComponentIds: components
      .filter((component) => component.role === 'reagent')
      .map((component) => component.id),
    catalyst: components
      .filter((component) => component.role === 'catalyst')
      .map((component) => component.name)
      .join(', '),
    solvent: components
      .filter((component) => component.role === 'solvent')
      .map((component) => component.name)
      .join(', '),
    temperature: '',
    conditions: '',
  };
}

/**
 * Adds unassigned connected graphs as components and removes stale atom references.
 * Existing explicit groups are preserved, even when they contain disconnected structures.
 */
export function synchronizeComponents(document: MoleculeDocument): void {
  const atomIds = new Set(document.atoms.map((atom) => atom.id));
  const components = (document.components ?? [])
    .map((component) => ({
      ...component,
      atomIds: [...new Set(component.atomIds.filter((id) => atomIds.has(id)))],
      coefficient: Math.max(1, Math.floor(component.coefficient || 1)),
      role: component.role ?? ('structure' as ComponentRole),
      locked: Boolean(component.locked),
      hidden: Boolean(component.hidden),
    }))
    .filter((component) => component.atomIds.length > 0);
  const assigned = new Set(components.flatMap((component) => component.atomIds));
  const adjacency = new Map<string, string[]>();
  for (const atom of document.atoms) adjacency.set(atom.id, []);
  for (const bond of document.bonds) {
    adjacency.get(bond.atomA)?.push(bond.atomB);
    adjacency.get(bond.atomB)?.push(bond.atomA);
  }
  for (const atom of document.atoms) {
    if (assigned.has(atom.id)) continue;
    const queue = [atom.id];
    const connected: string[] = [];
    assigned.add(atom.id);
    while (queue.length) {
      const current = queue.shift()!;
      connected.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (assigned.has(neighbor)) continue;
        assigned.add(neighbor);
        queue.push(neighbor);
      }
    }
    components.push(createMolecularComponent(connected, `Componente ${components.length + 1}`));
  }
  document.components = components;
  const componentIds = new Set(components.map((component) => component.id));
  document.reactions = (document.reactions ?? []).map((reaction) => ({
    ...reaction,
    reactantComponentIds: reaction.reactantComponentIds.filter((id) => componentIds.has(id)),
    productComponentIds: reaction.productComponentIds.filter((id) => componentIds.has(id)),
    reagentComponentIds: reaction.reagentComponentIds.filter((id) => componentIds.has(id)),
  }));
}

export function bondOrderForAtom(document: MoleculeDocument, atomId: string): number {
  return document.bonds
    .filter((bond) => bond.atomA === atomId || bond.atomB === atomId)
    .reduce(
      (sum, bond) => sum + bondValenceOrder(bond.kind ?? bondKindForOrder(bond.order), bond.order),
      0,
    );
}

const CHARGED_VALENCES: Partial<Record<AtomSymbol, Partial<Record<number, number[]>>>> = {
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
  kind: BondKind = bondKindForOrder(order),
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
    const previous = existing
      ? bondValenceOrder(existing.kind ?? bondKindForOrder(existing.order), existing.order)
      : 0;
    const occupied = bondOrderForAtom(document, atom.id) - previous + bondValenceOrder(kind, order);
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
  element: AtomSymbol,
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
  if (atom.implicitHydrogenOverride != null)
    return Math.max(0, Math.floor(atom.implicitHydrogenOverride));
  const definition = ELEMENT_BY_SYMBOL.get(atom.element);
  if (!definition?.implicitHydrogens) return 0;
  if (atom.charge !== 0 && !CHARGED_VALENCES[atom.element]?.[atom.charge]) return 0;
  const occupied = bondOrderForAtom(document, atom.id);
  const target = allowedValencesForAtom(atom).find((valence) => valence >= occupied) ?? 0;
  return Math.max(0, target - occupied);
}

export function calculateStats(document: MoleculeDocument): MoleculeStats {
  const elementCounts = new Map<AtomSymbol, number>();
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

  const explicitCounts = new Map<AtomSymbol, number>();
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

function formatFormula(counts: Map<AtomSymbol, number>): string {
  if (!counts.size) return '—';
  const symbols = [...counts.keys()];
  const ordered: AtomSymbol[] = symbols.includes('C')
    ? ([
        'C',
        'H',
        ...symbols.filter((symbol) => symbol !== 'C' && symbol !== 'H').sort(),
      ] as AtomSymbol[])
    : symbols.sort(
        (a, b) =>
          (ELEMENT_BY_SYMBOL.get(a)?.atomicNumber ?? 0) -
          (ELEMENT_BY_SYMBOL.get(b)?.atomicNumber ?? 0),
      );
  return ordered
    .filter((symbol, index, all) => all.indexOf(symbol) === index && (counts.get(symbol) ?? 0) > 0)
    .map((symbol) => {
      const count = counts.get(symbol) ?? 0;
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
    id: 'sulfuric-acid',
    name: 'Ácido sulfúrico',
    commonName: 'Ácido sulfúrico',
    category: 'Inorgánica',
    description: 'Oxoácido tetraédrico con dos grupos hidroxilo y dos enlaces S=O.',
    atoms: [
      { key: 's', element: 'S', x: 700, y: 390 },
      { key: 'o1', element: 'O', x: 560, y: 390 },
      { key: 'o2', element: 'O', x: 840, y: 390 },
      { key: 'o3', element: 'O', x: 700, y: 260 },
      { key: 'o4', element: 'O', x: 700, y: 520 },
      { key: 'h1', element: 'H', x: 700, y: 160 },
      { key: 'h2', element: 'H', x: 700, y: 620 },
    ],
    bonds: [
      { a: 's', b: 'o1', order: 2 },
      { a: 's', b: 'o2', order: 2 },
      { a: 's', b: 'o3', order: 1 },
      { a: 's', b: 'o4', order: 1 },
      { a: 'o3', b: 'h1', order: 1 },
      { a: 'o4', b: 'h2', order: 1 },
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
  synchronizeComponents(document);
  return document;
}
