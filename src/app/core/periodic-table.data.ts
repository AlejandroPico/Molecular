export const ELEMENT_SYMBOLS = [
  'H',
  'He',
  'Li',
  'Be',
  'B',
  'C',
  'N',
  'O',
  'F',
  'Ne',
  'Na',
  'Mg',
  'Al',
  'Si',
  'P',
  'S',
  'Cl',
  'Ar',
  'K',
  'Ca',
  'Sc',
  'Ti',
  'V',
  'Cr',
  'Mn',
  'Fe',
  'Co',
  'Ni',
  'Cu',
  'Zn',
  'Ga',
  'Ge',
  'As',
  'Se',
  'Br',
  'Kr',
  'Rb',
  'Sr',
  'Y',
  'Zr',
  'Nb',
  'Mo',
  'Tc',
  'Ru',
  'Rh',
  'Pd',
  'Ag',
  'Cd',
  'In',
  'Sn',
  'Sb',
  'Te',
  'I',
  'Xe',
  'Cs',
  'Ba',
  'La',
  'Ce',
  'Pr',
  'Nd',
  'Pm',
  'Sm',
  'Eu',
  'Gd',
  'Tb',
  'Dy',
  'Ho',
  'Er',
  'Tm',
  'Yb',
  'Lu',
  'Hf',
  'Ta',
  'W',
  'Re',
  'Os',
  'Ir',
  'Pt',
  'Au',
  'Hg',
  'Tl',
  'Pb',
  'Bi',
  'Po',
  'At',
  'Rn',
  'Fr',
  'Ra',
  'Ac',
  'Th',
  'Pa',
  'U',
  'Np',
  'Pu',
  'Am',
  'Cm',
  'Bk',
  'Cf',
  'Es',
  'Fm',
  'Md',
  'No',
  'Lr',
  'Rf',
  'Db',
  'Sg',
  'Bh',
  'Hs',
  'Mt',
  'Ds',
  'Rg',
  'Cn',
  'Nh',
  'Fl',
  'Mc',
  'Lv',
  'Ts',
  'Og',
] as const;

export type ElementSymbol = (typeof ELEMENT_SYMBOLS)[number];

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
  category: string;
  period: number;
  groupNumber: number | null;
  tableColumn: number;
  tableRow: number;
  description: string;
  implicitHydrogens: boolean;
}

const ELEMENT_NAMES = [
  'Hidrógeno',
  'Helio',
  'Litio',
  'Berilio',
  'Boro',
  'Carbono',
  'Nitrógeno',
  'Oxígeno',
  'Flúor',
  'Neón',
  'Sodio',
  'Magnesio',
  'Aluminio',
  'Silicio',
  'Fósforo',
  'Azufre',
  'Cloro',
  'Argón',
  'Potasio',
  'Calcio',
  'Escandio',
  'Titanio',
  'Vanadio',
  'Cromo',
  'Manganeso',
  'Hierro',
  'Cobalto',
  'Níquel',
  'Cobre',
  'Zinc',
  'Galio',
  'Germanio',
  'Arsénico',
  'Selenio',
  'Bromo',
  'Kriptón',
  'Rubidio',
  'Estroncio',
  'Itrio',
  'Circonio',
  'Niobio',
  'Molibdeno',
  'Tecnecio',
  'Rutenio',
  'Rodio',
  'Paladio',
  'Plata',
  'Cadmio',
  'Indio',
  'Estaño',
  'Antimonio',
  'Telurio',
  'Yodo',
  'Xenón',
  'Cesio',
  'Bario',
  'Lantano',
  'Cerio',
  'Praseodimio',
  'Neodimio',
  'Prometio',
  'Samario',
  'Europio',
  'Gadolinio',
  'Terbio',
  'Disprosio',
  'Holmio',
  'Erbio',
  'Tulio',
  'Iterbio',
  'Lutecio',
  'Hafnio',
  'Tántalo',
  'Wolframio',
  'Renio',
  'Osmio',
  'Iridio',
  'Platino',
  'Oro',
  'Mercurio',
  'Talio',
  'Plomo',
  'Bismuto',
  'Polonio',
  'Astato',
  'Radón',
  'Francio',
  'Radio',
  'Actinio',
  'Torio',
  'Protactinio',
  'Uranio',
  'Neptunio',
  'Plutonio',
  'Americio',
  'Curio',
  'Berkelio',
  'Californio',
  'Einsteinio',
  'Fermio',
  'Mendelevio',
  'Nobelio',
  'Lawrencio',
  'Rutherfordio',
  'Dubnio',
  'Seaborgio',
  'Bohrio',
  'Hassio',
  'Meitnerio',
  'Darmstadtio',
  'Roentgenio',
  'Copernicio',
  'Nihonio',
  'Flerovio',
  'Moscovio',
  'Livermorio',
  'Teneso',
  'Oganesón',
] as const;

// Pesos atómicos convencionales o masa del isótopo más estable para los elementos sin peso estándar.
const ATOMIC_MASSES = [
  1.008, 4.0026, 7, 9.012183, 10.81, 12.011, 14.007, 15.999, 18.99840316, 20.18, 22.9897693, 24.305,
  26.981538, 28.085, 30.973762, 32.07, 35.45, 39.9, 39.0983, 40.08, 44.95591, 47.867, 50.9415,
  51.996, 54.93804, 55.84, 58.93319, 58.693, 63.55, 65.4, 69.723, 72.63, 74.92159, 78.97, 79.9,
  83.8, 85.468, 87.62, 88.90584, 91.22, 92.90637, 95.95, 96.90636, 101.1, 102.9055, 106.42, 107.868,
  112.41, 114.818, 118.71, 121.76, 127.6, 126.9045, 131.29, 132.905452, 137.33, 138.9055, 140.116,
  140.90766, 144.24, 144.91276, 150.4, 151.964, 157.25, 158.92535, 162.5, 164.93033, 167.26,
  168.93422, 173.05, 174.9667, 178.49, 180.9479, 183.84, 186.207, 190.2, 192.22, 195.08, 196.96657,
  200.59, 204.383, 207, 208.9804, 208.98243, 209.98715, 222.01758, 223.01973, 226.02541, 227.02775,
  232.038, 231.03588, 238.0289, 237.048172, 244.0642, 243.06138, 247.07035, 247.07031, 251.07959,
  252.083, 257.09511, 258.09843, 259.101, 266.12, 267.122, 268.126, 269.128, 270.133, 269.1336,
  277.154, 282.166, 282.169, 286.179, 286.182, 290.192, 290.196, 293.205, 294.211, 295.216,
] as const;

const MAIN_ROWS: ReadonlyArray<ReadonlyArray<string>> = [
  ['H', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'He'],
  ['Li', 'Be', '', '', '', '', '', '', '', '', '', '', 'B', 'C', 'N', 'O', 'F', 'Ne'],
  ['Na', 'Mg', '', '', '', '', '', '', '', '', '', '', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
  [
    'K',
    'Ca',
    'Sc',
    'Ti',
    'V',
    'Cr',
    'Mn',
    'Fe',
    'Co',
    'Ni',
    'Cu',
    'Zn',
    'Ga',
    'Ge',
    'As',
    'Se',
    'Br',
    'Kr',
  ],
  [
    'Rb',
    'Sr',
    'Y',
    'Zr',
    'Nb',
    'Mo',
    'Tc',
    'Ru',
    'Rh',
    'Pd',
    'Ag',
    'Cd',
    'In',
    'Sn',
    'Sb',
    'Te',
    'I',
    'Xe',
  ],
  [
    'Cs',
    'Ba',
    '',
    'Hf',
    'Ta',
    'W',
    'Re',
    'Os',
    'Ir',
    'Pt',
    'Au',
    'Hg',
    'Tl',
    'Pb',
    'Bi',
    'Po',
    'At',
    'Rn',
  ],
  [
    'Fr',
    'Ra',
    '',
    'Rf',
    'Db',
    'Sg',
    'Bh',
    'Hs',
    'Mt',
    'Ds',
    'Rg',
    'Cn',
    'Nh',
    'Fl',
    'Mc',
    'Lv',
    'Ts',
    'Og',
  ],
];

const LANTHANIDES = [
  'La',
  'Ce',
  'Pr',
  'Nd',
  'Pm',
  'Sm',
  'Eu',
  'Gd',
  'Tb',
  'Dy',
  'Ho',
  'Er',
  'Tm',
  'Yb',
  'Lu',
];
const ACTINIDES = [
  'Ac',
  'Th',
  'Pa',
  'U',
  'Np',
  'Pu',
  'Am',
  'Cm',
  'Bk',
  'Cf',
  'Es',
  'Fm',
  'Md',
  'No',
  'Lr',
];

const SETS = {
  alkali: new Set(['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr']),
  alkaline: new Set(['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra']),
  noble: new Set(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og']),
  halogen: new Set(['F', 'Cl', 'Br', 'I', 'At', 'Ts']),
  nonmetal: new Set(['H', 'C', 'N', 'O', 'P', 'S', 'Se']),
  metalloid: new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te', 'Po']),
  postTransition: new Set(['Al', 'Ga', 'In', 'Sn', 'Tl', 'Pb', 'Bi', 'Nh', 'Fl', 'Mc', 'Lv']),
  lanthanide: new Set(LANTHANIDES),
  actinide: new Set(ACTINIDES),
};

const COMMON_COLORS: Partial<Record<ElementSymbol, string>> = {
  H: '#f8fafc',
  B: '#f29b7f',
  C: '#384152',
  N: '#3f6fe5',
  O: '#e34d59',
  F: '#59c98d',
  Si: '#d49a6a',
  P: '#ee8b3a',
  S: '#e6c94b',
  Cl: '#52bd65',
  Fe: '#c87c4e',
  Cu: '#c97848',
  Zn: '#8f9aab',
  Br: '#a94c37',
  I: '#7651a8',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Metal alcalino': '#9b72d9',
  'Metal alcalinotérreo': '#83c66a',
  'Metal de transición': '#7693a7',
  'Metal postransición': '#8095a0',
  Metaloide: '#d49a6a',
  'No metal': '#5b8cda',
  Halógeno: '#52bd65',
  'Gas noble': '#62abc3',
  Lantánido: '#57b9aa',
  Actínido: '#8f80cc',
};

const VALENCE_OVERRIDES: Partial<Record<ElementSymbol, number[]>> = {
  H: [1],
  He: [0],
  B: [3],
  C: [4],
  N: [3],
  O: [2],
  F: [1],
  Ne: [0],
  Si: [4],
  P: [3, 5],
  S: [2, 4, 6],
  Cl: [1, 3, 5, 7],
  Ar: [0],
  Fe: [2, 3, 4, 6],
  Co: [2, 3, 4, 6],
  Ni: [2, 3, 4, 6],
  Cu: [1, 2, 4],
  Zn: [2],
  As: [3, 5],
  Se: [2, 4, 6],
  Br: [1, 3, 5, 7],
  Kr: [0, 2],
  Ag: [1, 2],
  Cd: [2],
  Sn: [2, 4],
  Sb: [3, 5],
  Te: [2, 4, 6],
  I: [1, 3, 5, 7],
  Xe: [0, 2, 4, 6],
  Au: [1, 3],
  Hg: [1, 2],
  Pb: [2, 4],
  Bi: [3, 5],
  At: [1, 3, 5, 7],
  Rn: [0, 2],
  Og: [0],
};

const IMPLICIT_HYDROGEN_ELEMENTS = new Set([
  'B',
  'C',
  'N',
  'O',
  'F',
  'Si',
  'P',
  'S',
  'Cl',
  'Ge',
  'As',
  'Se',
  'Br',
  'Sb',
  'Te',
  'I',
]);

function categoryFor(symbol: string): string {
  if (SETS.alkali.has(symbol)) return 'Metal alcalino';
  if (SETS.alkaline.has(symbol)) return 'Metal alcalinotérreo';
  if (SETS.noble.has(symbol)) return 'Gas noble';
  if (SETS.halogen.has(symbol)) return 'Halógeno';
  if (SETS.nonmetal.has(symbol)) return 'No metal';
  if (SETS.metalloid.has(symbol)) return 'Metaloide';
  if (SETS.postTransition.has(symbol)) return 'Metal postransición';
  if (SETS.lanthanide.has(symbol)) return 'Lantánido';
  if (SETS.actinide.has(symbol)) return 'Actínido';
  return 'Metal de transición';
}

function positionFor(symbol: string): {
  period: number;
  group: number | null;
  column: number;
  row: number;
} {
  for (let row = 0; row < MAIN_ROWS.length; row += 1) {
    const column = MAIN_ROWS[row].indexOf(symbol);
    if (column >= 0)
      return { period: row + 1, group: column + 1, column: column + 1, row: row + 1 };
  }
  const lanthanide = LANTHANIDES.indexOf(symbol);
  if (lanthanide >= 0) return { period: 6, group: null, column: lanthanide + 3, row: 8 };
  const actinide = ACTINIDES.indexOf(symbol);
  return { period: 7, group: null, column: actinide + 3, row: 9 };
}

function valencesFor(symbol: ElementSymbol, category: string): number[] {
  const explicit = VALENCE_OVERRIDES[symbol];
  if (explicit) return [...explicit];
  if (category === 'Metal alcalino') return [1];
  if (category === 'Metal alcalinotérreo') return [2];
  if (category === 'Gas noble') return [0];
  if (category === 'Halógeno') return [1, 3, 5, 7];
  if (category === 'Lantánido') return [3];
  if (category === 'Actínido') return [3, 4, 5, 6];
  if (category === 'Metal de transición') return [2, 3, 4, 6];
  if (category === 'Metal postransición') return [2, 3, 4];
  if (category === 'Metaloide') return [3, 4, 5];
  return [2, 3, 4];
}

function textColorFor(hex: string): string {
  const value = hex.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 158 ? '#172033' : '#ffffff';
}

export const ELEMENTS: ReadonlyArray<ElementDefinition> = ELEMENT_SYMBOLS.map((symbol, index) => {
  const category = categoryFor(symbol);
  const position = positionFor(symbol);
  const color = COMMON_COLORS[symbol] ?? CATEGORY_COLORS[category];
  const valences = valencesFor(symbol, category);
  return {
    symbol,
    name: ELEMENT_NAMES[index],
    atomicNumber: index + 1,
    atomicMass: ATOMIC_MASSES[index],
    valences,
    covalentRadius: symbol === 'H' ? 0.31 : category.includes('Metal') ? 1.35 : 0.92,
    vanDerWaalsRadius: symbol === 'H' ? 1.2 : category.includes('Metal') ? 2.15 : 1.8,
    color,
    textColor: textColorFor(color),
    group: category,
    category,
    period: position.period,
    groupNumber: position.group,
    tableColumn: position.column,
    tableRow: position.row,
    description: `${ELEMENT_NAMES[index]} pertenece a la familia ${category.toLowerCase()}. En este editor admite ${valences.join(', ')} unidades de enlace.`,
    implicitHydrogens: IMPLICIT_HYDROGEN_ELEMENTS.has(symbol),
  };
});

export const ELEMENT_BY_SYMBOL = new Map(ELEMENTS.map((element) => [element.symbol, element]));
export const QUICK_ELEMENTS: ElementSymbol[] = ['C', 'H', 'O', 'N', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
