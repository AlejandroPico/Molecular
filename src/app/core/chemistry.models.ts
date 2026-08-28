export type ElementSymbol =
  | 'H'
  | 'C'
  | 'N'
  | 'O'
  | 'F'
  | 'P'
  | 'S'
  | 'Cl'
  | 'Br'
  | 'I'
  | 'B'
  | 'Si'
  | 'Na'
  | 'Mg'
  | 'K'
  | 'Ca'
  | 'Fe'
  | 'Cu'
  | 'Zn';

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
  description: string;
}

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

export const ELEMENTS: ReadonlyArray<ElementDefinition> = [
  {
    symbol: 'H',
    name: 'Hidrógeno',
    atomicNumber: 1,
    atomicMass: 1.008,
    valences: [1],
    covalentRadius: 0.31,
    vanDerWaalsRadius: 1.2,
    color: '#f8fafc',
    textColor: '#172033',
    group: 'No metal',
    description: 'El elemento más ligero. Forma habitualmente un enlace covalente.',
  },
  {
    symbol: 'B',
    name: 'Boro',
    atomicNumber: 5,
    atomicMass: 10.81,
    valences: [3],
    covalentRadius: 0.84,
    vanDerWaalsRadius: 1.92,
    color: '#f29b7f',
    textColor: '#2a1711',
    group: 'Metaloide',
    description: 'Metaloide electrón-deficiente frecuente en boranos y boratos.',
  },
  {
    symbol: 'C',
    name: 'Carbono',
    atomicNumber: 6,
    atomicMass: 12.011,
    valences: [4],
    covalentRadius: 0.76,
    vanDerWaalsRadius: 1.7,
    color: '#384152',
    textColor: '#ffffff',
    group: 'No metal',
    description: 'Base de la química orgánica. Puede formar enlaces simples, dobles y triples.',
  },
  {
    symbol: 'N',
    name: 'Nitrógeno',
    atomicNumber: 7,
    atomicMass: 14.007,
    valences: [3, 5],
    covalentRadius: 0.71,
    vanDerWaalsRadius: 1.55,
    color: '#3f6fe5',
    textColor: '#ffffff',
    group: 'No metal',
    description: 'Presente en aminoácidos, bases nitrogenadas y numerosos grupos funcionales.',
  },
  {
    symbol: 'O',
    name: 'Oxígeno',
    atomicNumber: 8,
    atomicMass: 15.999,
    valences: [2],
    covalentRadius: 0.66,
    vanDerWaalsRadius: 1.52,
    color: '#e34d59',
    textColor: '#ffffff',
    group: 'No metal',
    description: 'Elemento electronegativo que forma normalmente dos enlaces covalentes.',
  },
  {
    symbol: 'F',
    name: 'Flúor',
    atomicNumber: 9,
    atomicMass: 18.998,
    valences: [1],
    covalentRadius: 0.57,
    vanDerWaalsRadius: 1.47,
    color: '#59c98d',
    textColor: '#10251b',
    group: 'Halógeno',
    description: 'El elemento más electronegativo; forma habitualmente un solo enlace.',
  },
  {
    symbol: 'Na',
    name: 'Sodio',
    atomicNumber: 11,
    atomicMass: 22.99,
    valences: [1],
    covalentRadius: 1.66,
    vanDerWaalsRadius: 2.27,
    color: '#9b72d9',
    textColor: '#ffffff',
    group: 'Metal alcalino',
    description: 'Metal alcalino que suele participar en compuestos iónicos con carga +1.',
  },
  {
    symbol: 'Mg',
    name: 'Magnesio',
    atomicNumber: 12,
    atomicMass: 24.305,
    valences: [2],
    covalentRadius: 1.41,
    vanDerWaalsRadius: 1.73,
    color: '#83c66a',
    textColor: '#12230e',
    group: 'Alcalinotérreo',
    description: 'Metal divalente esencial en sistemas biológicos, incluida la clorofila.',
  },
  {
    symbol: 'Si',
    name: 'Silicio',
    atomicNumber: 14,
    atomicMass: 28.085,
    valences: [4],
    covalentRadius: 1.11,
    vanDerWaalsRadius: 2.1,
    color: '#d49a6a',
    textColor: '#2a1a0e',
    group: 'Metaloide',
    description: 'Forma redes tetraédricas y es central en silicatos y organosilicios.',
  },
  {
    symbol: 'P',
    name: 'Fósforo',
    atomicNumber: 15,
    atomicMass: 30.974,
    valences: [3, 5],
    covalentRadius: 1.07,
    vanDerWaalsRadius: 1.8,
    color: '#ee8b3a',
    textColor: '#271509',
    group: 'No metal',
    description: 'Fundamental en ATP, ADN, ARN y grupos fosfato.',
  },
  {
    symbol: 'S',
    name: 'Azufre',
    atomicNumber: 16,
    atomicMass: 32.06,
    valences: [2, 4, 6],
    covalentRadius: 1.05,
    vanDerWaalsRadius: 1.8,
    color: '#e6c94b',
    textColor: '#2a2509',
    group: 'No metal',
    description: 'Forma sulfuros, sulfatos y puentes disulfuro en proteínas.',
  },
  {
    symbol: 'Cl',
    name: 'Cloro',
    atomicNumber: 17,
    atomicMass: 35.45,
    valences: [1],
    covalentRadius: 1.02,
    vanDerWaalsRadius: 1.75,
    color: '#52bd65',
    textColor: '#102313',
    group: 'Halógeno',
    description: 'Halógeno frecuente en sales y compuestos organoclorados.',
  },
  {
    symbol: 'K',
    name: 'Potasio',
    atomicNumber: 19,
    atomicMass: 39.098,
    valences: [1],
    covalentRadius: 2.03,
    vanDerWaalsRadius: 2.75,
    color: '#a667d8',
    textColor: '#ffffff',
    group: 'Metal alcalino',
    description: 'Catión biológico esencial que suele presentar carga +1.',
  },
  {
    symbol: 'Ca',
    name: 'Calcio',
    atomicNumber: 20,
    atomicMass: 40.078,
    valences: [2],
    covalentRadius: 1.76,
    vanDerWaalsRadius: 2.31,
    color: '#74bd75',
    textColor: '#102312',
    group: 'Alcalinotérreo',
    description: 'Metal divalente esencial en minerales y señalización celular.',
  },
  {
    symbol: 'Fe',
    name: 'Hierro',
    atomicNumber: 26,
    atomicMass: 55.845,
    valences: [2, 3],
    covalentRadius: 1.32,
    vanDerWaalsRadius: 2.0,
    color: '#c87c4e',
    textColor: '#ffffff',
    group: 'Metal de transición',
    description: 'Metal de transición con estados de oxidación habituales +2 y +3.',
  },
  {
    symbol: 'Cu',
    name: 'Cobre',
    atomicNumber: 29,
    atomicMass: 63.546,
    valences: [1, 2],
    covalentRadius: 1.32,
    vanDerWaalsRadius: 1.96,
    color: '#c97848',
    textColor: '#ffffff',
    group: 'Metal de transición',
    description: 'Metal conductor presente en complejos de coordinación y enzimas.',
  },
  {
    symbol: 'Zn',
    name: 'Zinc',
    atomicNumber: 30,
    atomicMass: 65.38,
    valences: [2],
    covalentRadius: 1.22,
    vanDerWaalsRadius: 2.01,
    color: '#8f9aab',
    textColor: '#ffffff',
    group: 'Metal de transición',
    description: 'Metal divalente habitual en centros activos de proteínas.',
  },
  {
    symbol: 'Br',
    name: 'Bromo',
    atomicNumber: 35,
    atomicMass: 79.904,
    valences: [1],
    covalentRadius: 1.2,
    vanDerWaalsRadius: 1.85,
    color: '#a94c37',
    textColor: '#ffffff',
    group: 'Halógeno',
    description: 'Halógeno pesado que forma normalmente un enlace covalente.',
  },
  {
    symbol: 'I',
    name: 'Yodo',
    atomicNumber: 53,
    atomicMass: 126.904,
    valences: [1],
    covalentRadius: 1.39,
    vanDerWaalsRadius: 1.98,
    color: '#7651a8',
    textColor: '#ffffff',
    group: 'Halógeno',
    description: 'Halógeno pesado esencial en hormonas tiroideas.',
  },
];

export const ELEMENT_BY_SYMBOL = new Map(ELEMENTS.map((element) => [element.symbol, element]));
export const QUICK_ELEMENTS: ElementSymbol[] = ['C', 'H', 'O', 'N', 'S', 'P', 'F', 'Cl', 'Br', 'I'];

function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + '-' + crypto.randomUUID();
  }
  return prefix + '-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createAtom(element: ElementSymbol, x: number, y: number): Atom {
  return { id: uid('atom'), element, x, y, charge: 0 };
}

export function createBond(atomA: string, atomB: string, order: 1 | 2 | 3 = 1): Bond {
  return { id: uid('bond'), atomA, atomB, order };
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

export function implicitHydrogensForAtom(document: MoleculeDocument, atom: Atom): number {
  if (atom.element === 'H' || atom.charge !== 0) return 0;
  const definition = ELEMENT_BY_SYMBOL.get(atom.element);
  if (!definition) return 0;
  const occupied = bondOrderForAtom(document, atom.id);
  const target =
    definition.valences.find((valence) => valence >= occupied) ?? definition.valences.at(-1) ?? 0;
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
    const definition = ELEMENT_BY_SYMBOL.get(atom.element);
    const usedValence = bondOrderForAtom(document, atom.id);
    const maxValence = definition?.valences.at(-1) ?? 0;
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
