import {
  Atom,
  AtomSymbol,
  Bond,
  ELEMENT_BY_SYMBOL,
  MoleculeDocument,
  bondKindForOrder,
  calculateStats,
  implicitHydrogensForAtom,
  maxValenceForAtom,
  bondOrderForAtom,
} from './chemistry.models';

export type ValidationProfile = 'strict' | 'guided' | 'free';

export interface ValidationSettings {
  profile: ValidationProfile;
  checkValence: boolean;
  checkCharge: boolean;
  checkIsolatedAtoms: boolean;
  checkAromaticity: boolean;
  checkStereochemistry: boolean;
  maximumAbsoluteCharge: number;
}

export const DEFAULT_VALIDATION_SETTINGS: ValidationSettings = {
  profile: 'strict',
  checkValence: true,
  checkCharge: true,
  checkIsolatedAtoms: false,
  checkAromaticity: true,
  checkStereochemistry: true,
  maximumAbsoluteCharge: 4,
};

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  detail: string;
  atomIds: string[];
  bondIds: string[];
}

export interface FunctionalGroupMatch {
  id: string;
  type:
    | 'alcohol'
    | 'phenol'
    | 'ether'
    | 'aldehyde'
    | 'ketone'
    | 'carboxylic-acid'
    | 'ester'
    | 'amide'
    | 'amine'
    | 'nitrile'
    | 'alkene'
    | 'alkyne'
    | 'halide'
    | 'thiol'
    | 'aromatic-ring';
  name: string;
  formula: string;
  description: string;
  atomIds: string[];
  bondIds: string[];
}

export interface RingAnalysis {
  id: string;
  atomIds: string[];
  bondIds: string[];
  aromatic: boolean;
  electronCount: number;
  resonanceForms: number;
  reason: string;
}

export interface ElementComposition {
  symbol: AtomSymbol;
  atoms: number;
  mass: number;
  percentage: number;
}

export interface MolecularProperties {
  formula: string;
  molecularMass: number;
  netCharge: number;
  tpsa: number;
  logP: number;
  hydrogenBondDonors: number;
  hydrogenBondAcceptors: number;
  rotatableBonds: number;
  ringCount: number;
  aromaticRingCount: number;
  heavyAtomCount: number;
  composition: ElementComposition[];
  notes: string[];
}

interface GraphContext {
  atoms: Map<string, Atom>;
  neighbours: Map<string, Array<{ atom: Atom; bond: Bond }>>;
}

const HALOGENS = new Set<AtomSymbol>(['F', 'Cl', 'Br', 'I']);

export function analyzeFunctionalGroups(document: MoleculeDocument): FunctionalGroupMatch[] {
  const graph = buildGraph(document);
  const groups: FunctionalGroupMatch[] = [];
  const seen = new Set<string>();
  const rings = analyzeRings(document);

  const add = (group: Omit<FunctionalGroupMatch, 'id'>): void => {
    const signature = `${group.type}:${[...group.atomIds].sort().join(',')}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    groups.push({ ...group, id: signature });
  };

  for (const ring of rings.filter((candidate) => candidate.aromatic)) {
    add({
      type: 'aromatic-ring',
      name: 'Anillo aromático',
      formula: 'Ar',
      description: `Sistema cíclico conjugado con ${ring.electronCount} electrones π.`,
      atomIds: ring.atomIds,
      bondIds: ring.bondIds,
    });
  }

  for (const atom of document.atoms) {
    const adjacent = graph.neighbours.get(atom.id) ?? [];
    if (atom.element === 'C') {
      const doubleO = adjacent.find(
        ({ atom: other, bond }) => other.element === 'O' && bond.order === 2,
      );
      if (doubleO) {
        const singleO = adjacent.find(
          ({ atom: other, bond }) => other.element === 'O' && bond.order === 1,
        );
        const nitrogen = adjacent.find(
          ({ atom: other, bond }) => other.element === 'N' && bond.order === 1,
        );
        if (singleO) {
          const oxygenHasCarbon = (graph.neighbours.get(singleO.atom.id) ?? []).some(
            ({ atom: other }) => other.element === 'C' && other.id !== atom.id,
          );
          add({
            type: oxygenHasCarbon ? 'ester' : 'carboxylic-acid',
            name: oxygenHasCarbon ? 'Éster' : 'Ácido carboxílico',
            formula: oxygenHasCarbon ? 'R–C(=O)–O–R′' : 'R–C(=O)–OH',
            description: oxygenHasCarbon
              ? 'Carbonilo unido a un oxígeno que continúa hacia otro carbono.'
              : 'Grupo carboxilo formado por carbonilo e hidroxilo sobre el mismo carbono.',
            atomIds: [atom.id, doubleO.atom.id, singleO.atom.id],
            bondIds: [doubleO.bond.id, singleO.bond.id],
          });
        } else if (nitrogen) {
          add({
            type: 'amide',
            name: 'Amida',
            formula: 'R–C(=O)–NR₂',
            description: 'Carbonilo enlazado directamente a nitrógeno.',
            atomIds: [atom.id, doubleO.atom.id, nitrogen.atom.id],
            bondIds: [doubleO.bond.id, nitrogen.bond.id],
          });
        } else {
          const carbonNeighbours = adjacent.filter(({ atom: other }) => other.element === 'C');
          const hasHydrogen =
            implicitHydrogensForAtom(document, atom) > 0 ||
            adjacent.some(({ atom: other }) => other.element === 'H');
          const aldehyde = hasHydrogen && carbonNeighbours.length <= 1;
          add({
            type: aldehyde ? 'aldehyde' : 'ketone',
            name: aldehyde ? 'Aldehído' : 'Cetona',
            formula: aldehyde ? 'R–CHO' : 'R–CO–R′',
            description: aldehyde
              ? 'Carbonilo terminal cuyo carbono conserva al menos un hidrógeno.'
              : 'Carbonilo situado entre dos sustituyentes carbonados.',
            atomIds: [atom.id, doubleO.atom.id],
            bondIds: [doubleO.bond.id],
          });
        }
      }

      const nitrile = adjacent.find(
        ({ atom: other, bond }) => other.element === 'N' && bond.order === 3,
      );
      if (nitrile) {
        add({
          type: 'nitrile',
          name: 'Nitrilo',
          formula: 'R–C≡N',
          description: 'Carbono y nitrógeno unidos mediante un enlace triple.',
          atomIds: [atom.id, nitrile.atom.id],
          bondIds: [nitrile.bond.id],
        });
      }
    }

    if (atom.element === 'O' && !adjacent.some(({ bond }) => bond.order === 2)) {
      const carbons = adjacent.filter(
        ({ atom: other, bond }) => other.element === 'C' && bond.order === 1,
      );
      const hasHydrogen =
        implicitHydrogensForAtom(document, atom) > 0 ||
        adjacent.some(({ atom: other }) => other.element === 'H');
      if (carbons.length >= 2) {
        add({
          type: 'ether',
          name: 'Éter',
          formula: 'R–O–R′',
          description: 'Oxígeno enlazado por enlaces simples a dos sustituyentes carbonados.',
          atomIds: [atom.id, ...carbons.slice(0, 2).map(({ atom: other }) => other.id)],
          bondIds: carbons.slice(0, 2).map(({ bond }) => bond.id),
        });
      } else if (carbons.length === 1 && hasHydrogen) {
        const aromatic = rings.some(
          (ring) => ring.aromatic && ring.atomIds.includes(carbons[0].atom.id),
        );
        add({
          type: aromatic ? 'phenol' : 'alcohol',
          name: aromatic ? 'Fenol' : 'Alcohol',
          formula: aromatic ? 'Ar–OH' : 'R–OH',
          description: aromatic
            ? 'Hidroxilo unido directamente a un sistema aromático.'
            : 'Grupo hidroxilo unido a un átomo de carbono no aromático.',
          atomIds: [atom.id, carbons[0].atom.id],
          bondIds: [carbons[0].bond.id],
        });
      }
    }

    if (atom.element === 'N') {
      const carbonylCarbon = adjacent.find(({ atom: other }) =>
        (graph.neighbours.get(other.id) ?? []).some(
          ({ atom: candidate, bond }) =>
            other.element === 'C' && candidate.element === 'O' && bond.order === 2,
        ),
      );
      const nitrileBond = adjacent.some(({ bond }) => bond.order === 3);
      if (
        !carbonylCarbon &&
        !nitrileBond &&
        adjacent.some(({ atom: other }) => other.element === 'C')
      ) {
        add({
          type: 'amine',
          name: 'Amina',
          formula: 'R₃N',
          description:
            'Nitrógeno unido a uno o más sustituyentes carbonados sin carbonilo adyacente.',
          atomIds: [
            atom.id,
            ...adjacent
              .filter(({ atom: other }) => other.element === 'C')
              .map(({ atom: other }) => other.id),
          ],
          bondIds: adjacent
            .filter(({ atom: other }) => other.element === 'C')
            .map(({ bond }) => bond.id),
        });
      }
    }

    if (atom.element === 'S') {
      const carbon = adjacent.find(({ atom: other }) => other.element === 'C');
      const hasHydrogen =
        adjacent.some(({ atom: other }) => other.element === 'H') ||
        (adjacent.length === 1 && bondOrderForAtom(document, atom.id) <= 1 && atom.charge === 0);
      if (carbon && hasHydrogen) {
        add({
          type: 'thiol',
          name: 'Tiol',
          formula: 'R–SH',
          description: 'Grupo sulfurado análogo a un alcohol, con enlace S–H.',
          atomIds: [atom.id, carbon.atom.id],
          bondIds: [carbon.bond.id],
        });
      }
    }
  }

  for (const bond of document.bonds) {
    const a = graph.atoms.get(bond.atomA);
    const b = graph.atoms.get(bond.atomB);
    if (!a || !b) continue;
    if (
      a.element === 'C' &&
      b.element === 'C' &&
      bond.order === 2 &&
      !isBondInAromaticRing(bond.id, rings)
    ) {
      add({
        type: 'alkene',
        name: 'Alqueno',
        formula: 'C=C',
        description: 'Dos carbonos unidos mediante un enlace doble.',
        atomIds: [a.id, b.id],
        bondIds: [bond.id],
      });
    }
    if (a.element === 'C' && b.element === 'C' && bond.order === 3) {
      add({
        type: 'alkyne',
        name: 'Alquino',
        formula: 'C≡C',
        description: 'Dos carbonos unidos mediante un enlace triple.',
        atomIds: [a.id, b.id],
        bondIds: [bond.id],
      });
    }
    const halogen = HALOGENS.has(a.element) ? a : HALOGENS.has(b.element) ? b : null;
    const carbon = a.element === 'C' ? a : b.element === 'C' ? b : null;
    if (halogen && carbon) {
      add({
        type: 'halide',
        name: 'Halogenuro de alquilo',
        formula: 'R–X',
        description: `Carbono enlazado a ${ELEMENT_BY_SYMBOL.get(halogen.element)?.name.toLowerCase() ?? 'un halógeno'}.`,
        atomIds: [carbon.id, halogen.id],
        bondIds: [bond.id],
      });
    }
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function analyzeRings(document: MoleculeDocument): RingAnalysis[] {
  const graph = buildGraph(document);
  const cycles = findSmallCycles(document, graph, 8);
  return cycles.map((atomIds, index) => {
    const bondIds: string[] = [];
    const bonds: Bond[] = [];
    for (let atomIndex = 0; atomIndex < atomIds.length; atomIndex += 1) {
      const a = atomIds[atomIndex];
      const b = atomIds[(atomIndex + 1) % atomIds.length];
      const bond = document.bonds.find(
        (candidate) =>
          (candidate.atomA === a && candidate.atomB === b) ||
          (candidate.atomA === b && candidate.atomB === a),
      );
      if (bond) {
        bonds.push(bond);
        bondIds.push(bond.id);
      }
    }
    const declaredAromatic =
      bonds.length === atomIds.length &&
      bonds.every((bond) =>
        ['aromatic', 'delocalized'].includes(bond.kind ?? bondKindForOrder(bond.order)),
      );
    const doubleBonds = bonds.filter((bond) => bond.order === 2).length;
    const conjugated =
      bonds.length === atomIds.length &&
      atomIds.length >= 5 &&
      atomIds.length <= 7 &&
      (doubleBonds * 2 >= atomIds.length - 1 || declaredAromatic);
    const heteroLonePairContributor = atomIds.some((id) => {
      const element = graph.atoms.get(id)?.element;
      return element === 'N' || element === 'O' || element === 'S';
    });
    const electronCount = declaredAromatic
      ? atomIds.length === 5 && heteroLonePairContributor
        ? 6
        : atomIds.length
      : doubleBonds * 2;
    const huckel = electronCount >= 2 && (electronCount - 2) % 4 === 0;
    const aromatic = conjugated && huckel;
    return {
      id: `ring-${index}-${[...atomIds].sort().join('-')}`,
      atomIds,
      bondIds,
      aromatic,
      electronCount,
      resonanceForms: aromatic
        ? Math.max(2, Math.floor(atomIds.length / 2))
        : Math.max(1, doubleBonds),
      reason: aromatic
        ? `Ciclo conjugado compatible con la regla 4n+2 (${electronCount} electrones π).`
        : `Ciclo de ${atomIds.length} miembros sin conjugación aromática completa.`,
    };
  });
}

export function calculateMolecularProperties(document: MoleculeDocument): MolecularProperties {
  const stats = calculateStats(document);
  const graph = buildGraph(document);
  const groups = analyzeFunctionalGroups(document);
  const rings = analyzeRings(document);
  const netCharge = document.atoms.reduce((sum, atom) => sum + atom.charge, 0);
  let hydrogenBondDonors = 0;
  let hydrogenBondAcceptors = 0;
  let tpsa = 0;

  for (const atom of document.atoms) {
    const neighbours = graph.neighbours.get(atom.id) ?? [];
    const hydrogens =
      implicitHydrogensForAtom(document, atom) +
      neighbours.filter(({ atom: other }) => other.element === 'H').length;
    const amideNitrogen =
      atom.element === 'N' &&
      groups.some((group) => group.type === 'amide' && group.atomIds.includes(atom.id));
    if (['N', 'O', 'S'].includes(atom.element) && hydrogens > 0 && atom.charge <= 1) {
      hydrogenBondDonors += 1;
    }
    if (atom.element === 'O') {
      if (atom.charge <= 0) hydrogenBondAcceptors += 1;
      const doubleBonded = neighbours.some(({ bond }) => bond.order === 2);
      tpsa += atom.charge < 0 ? 23.06 : hydrogens > 0 ? 20.23 : doubleBonded ? 17.07 : 9.23;
    } else if (atom.element === 'N') {
      if (atom.charge <= 0 && !amideNitrogen) hydrogenBondAcceptors += 1;
      tpsa += atom.charge > 0 ? 27.64 : amideNitrogen ? 12.03 : 26.02;
    } else if (atom.element === 'S') {
      if (atom.charge <= 0) hydrogenBondAcceptors += 1;
      tpsa += neighbours.filter(({ bond }) => bond.order === 2).length >= 2 ? 38.8 : 28.2;
    } else if (atom.element === 'P') {
      tpsa += 38.8;
    }
  }

  const carbonCount = document.atoms.filter((atom) => atom.element === 'C').length;
  const heteroCount = document.atoms.filter(
    (atom) => !['C', 'H', 'R'].includes(atom.element),
  ).length;
  const halogenCount = document.atoms.filter((atom) => HALOGENS.has(atom.element)).length;
  const aromaticAtoms = new Set(
    rings.filter((ring) => ring.aromatic).flatMap((ring) => ring.atomIds),
  );
  const logP =
    0.54 * carbonCount +
    0.28 * halogenCount +
    0.12 * aromaticAtoms.size -
    0.72 * heteroCount -
    0.45 * Math.abs(netCharge) +
    0.35;

  const ringBonds = new Set(rings.flatMap((ring) => ring.bondIds));
  const rotatableBonds = document.bonds.filter((bond) => {
    if (bond.order !== 1 || ringBonds.has(bond.id)) return false;
    const a = graph.atoms.get(bond.atomA);
    const b = graph.atoms.get(bond.atomB);
    if (!a || !b || a.element === 'H' || b.element === 'H') return false;
    return (
      (graph.neighbours.get(a.id)?.length ?? 0) > 1 && (graph.neighbours.get(b.id)?.length ?? 0) > 1
    );
  }).length;

  const counts = new Map<AtomSymbol, number>();
  for (const atom of document.atoms) counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
  const implicitHydrogens = document.atoms.reduce(
    (sum, atom) => sum + implicitHydrogensForAtom(document, atom),
    0,
  );
  if (implicitHydrogens) counts.set('H', (counts.get('H') ?? 0) + implicitHydrogens);
  const composition = [...counts.entries()]
    .map(([symbol, atoms]) => {
      const mass = atoms * (ELEMENT_BY_SYMBOL.get(symbol)?.atomicMass ?? 0);
      return {
        symbol,
        atoms,
        mass,
        percentage: stats.molecularMass > 0 ? (mass / stats.molecularMass) * 100 : 0,
      };
    })
    .sort((a, b) => b.mass - a.mass);

  return {
    formula: stats.formula,
    molecularMass: stats.molecularMass,
    netCharge,
    tpsa: round(tpsa, 2),
    logP: round(logP, 2),
    hydrogenBondDonors,
    hydrogenBondAcceptors,
    rotatableBonds,
    ringCount: rings.length,
    aromaticRingCount: rings.filter((ring) => ring.aromatic).length,
    heavyAtomCount: document.atoms.filter((atom) => atom.element !== 'H').length,
    composition,
    notes: [
      'Masa, fórmula, carga y composición se calculan directamente desde la estructura.',
      'TPSA y logP son estimaciones locales orientativas; no sustituyen un cálculo químico de referencia.',
    ],
  };
}

export function validateMolecularDocument(
  document: MoleculeDocument,
  settings: ValidationSettings = DEFAULT_VALIDATION_SETTINGS,
): ValidationIssue[] {
  if (settings.profile === 'free') return [];
  const issues: ValidationIssue[] = [];
  const graph = buildGraph(document);

  for (const atom of document.atoms) {
    const occupied = bondOrderForAtom(document, atom.id);
    const maximum = maxValenceForAtom(atom);
    if (settings.checkValence && occupied > maximum) {
      issues.push({
        id: `valence-${atom.id}`,
        severity: 'error',
        title: 'Valencia excedida',
        detail: `${atom.element} utiliza ${occupied} unidades de enlace y admite ${maximum} con su carga actual.`,
        atomIds: [atom.id],
        bondIds: (graph.neighbours.get(atom.id) ?? []).map(({ bond }) => bond.id),
      });
    }
    if (settings.checkCharge && Math.abs(atom.charge) > settings.maximumAbsoluteCharge) {
      issues.push({
        id: `charge-${atom.id}`,
        severity: 'error',
        title: 'Carga fuera del límite',
        detail: `${atom.element} tiene carga ${atom.charge > 0 ? '+' : ''}${atom.charge}; el perfil admite ±${settings.maximumAbsoluteCharge}.`,
        atomIds: [atom.id],
        bondIds: [],
      });
    }
    if (
      settings.checkIsolatedAtoms &&
      document.atoms.length > 1 &&
      !graph.neighbours.get(atom.id)?.length
    ) {
      issues.push({
        id: `isolated-${atom.id}`,
        severity: 'warning',
        title: 'Átomo aislado',
        detail: `${atom.element} no pertenece a ningún enlace. Puede ser intencionado si representa un ion o especie separada.`,
        atomIds: [atom.id],
        bondIds: [],
      });
    }
    if (
      settings.checkStereochemistry &&
      atom.stereochemistry &&
      (graph.neighbours.get(atom.id)?.length ?? 0) < 3
    ) {
      issues.push({
        id: `stereo-${atom.id}`,
        severity: 'warning',
        title: 'Centro estereoquímico incompleto',
        detail: `La etiqueta ${atom.stereochemistry} necesita un entorno tetraédrico definido para poder verificarse.`,
        atomIds: [atom.id],
        bondIds: [],
      });
    }
  }

  if (settings.checkAromaticity) {
    for (const ring of analyzeRings(document)) {
      const declared = ring.bondIds.some((id) => {
        const bond = document.bonds.find((candidate) => candidate.id === id);
        return bond && ['aromatic', 'delocalized'].includes(bond.kind ?? '');
      });
      if (declared && !ring.aromatic) {
        issues.push({
          id: `aromatic-${ring.id}`,
          severity: 'warning',
          title: 'Aromaticidad inconsistente',
          detail:
            'El ciclo está marcado como aromático, pero el recuento electrónico no satisface la comprobación local 4n+2.',
          atomIds: ring.atomIds,
          bondIds: ring.bondIds,
        });
      }
    }
  }

  if (!issues.length && document.atoms.length) {
    issues.push({
      id: 'coherent',
      severity: 'info',
      title: 'Estructura coherente',
      detail: 'No se han encontrado incidencias con las comprobaciones activas.',
      atomIds: [],
      bondIds: [],
    });
  }
  return issues;
}

export function elementCountsForAtoms(
  document: MoleculeDocument,
  atomIds: Iterable<string>,
): Map<AtomSymbol, number> {
  const selected = new Set(atomIds);
  const counts = new Map<AtomSymbol, number>();
  for (const atom of document.atoms) {
    if (!selected.has(atom.id)) continue;
    counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
    const hydrogens = implicitHydrogensForAtom(document, atom);
    if (hydrogens) counts.set('H', (counts.get('H') ?? 0) + hydrogens);
  }
  return counts;
}

function buildGraph(document: MoleculeDocument): GraphContext {
  const atoms = new Map(document.atoms.map((atom) => [atom.id, atom]));
  const neighbours = new Map<string, Array<{ atom: Atom; bond: Bond }>>(
    document.atoms.map((atom) => [atom.id, []]),
  );
  for (const bond of document.bonds) {
    const a = atoms.get(bond.atomA);
    const b = atoms.get(bond.atomB);
    if (!a || !b) continue;
    neighbours.get(a.id)?.push({ atom: b, bond });
    neighbours.get(b.id)?.push({ atom: a, bond });
  }
  return { atoms, neighbours };
}

function findSmallCycles(
  document: MoleculeDocument,
  graph: GraphContext,
  maximumSize: number,
): string[][] {
  const cycles = new Map<string, string[]>();
  const orderedIds = document.atoms.map((atom) => atom.id);
  for (const start of orderedIds) {
    const visit = (current: string, path: string[], visited: Set<string>): void => {
      if (path.length > maximumSize) return;
      for (const { atom: neighbour } of graph.neighbours.get(current) ?? []) {
        if (neighbour.id === start && path.length >= 3) {
          const cycle = canonicalCycle(path);
          cycles.set(cycle.join('|'), cycle);
          continue;
        }
        if (visited.has(neighbour.id) || neighbour.id < start) continue;
        visit(neighbour.id, [...path, neighbour.id], new Set([...visited, neighbour.id]));
      }
    };
    visit(start, [start], new Set([start]));
  }

  const unique = [...cycles.values()].sort((a, b) => a.length - b.length);
  return unique.filter(
    (cycle, index) =>
      !unique
        .slice(0, index)
        .some(
          (smaller) => smaller.length < cycle.length && smaller.every((id) => cycle.includes(id)),
        ),
  );
}

function canonicalCycle(cycle: string[]): string[] {
  const variants: string[][] = [];
  const reversed = [...cycle].reverse();
  for (const source of [cycle, reversed]) {
    for (let index = 0; index < source.length; index += 1) {
      variants.push([...source.slice(index), ...source.slice(0, index)]);
    }
  }
  return variants.sort((a, b) => a.join('|').localeCompare(b.join('|')))[0];
}

function isBondInAromaticRing(bondId: string, rings: RingAnalysis[]): boolean {
  return rings.some((ring) => ring.aromatic && ring.bondIds.includes(bondId));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
