import {
  Atom,
  Bond,
  MoleculeDocument,
  calculateStats,
  createDocument,
  documentFromPreset,
  implicitHydrogensForAtom,
  MOLECULE_PRESETS,
} from './chemistry.models';
import { generateStructure } from './formula-generator';
import { analyzeFunctionalGroups, analyzeRings } from './molecular-analysis';
import { IDENTIFICATION_REFERENCES, StructureLibraryEntry } from './structure-library.data';

export interface IdentificationMatch {
  entry: StructureLibraryEntry;
  similarity: number;
  exact: boolean;
  explanation: string;
}

export interface StructureIdentification {
  atomIds: string[];
  formula: string;
  atomCount: number;
  matches: IdentificationMatch[];
}

interface PreparedTemplate {
  entry: StructureLibraryEntry;
  document: MoleculeDocument;
  fingerprint: Set<string>;
}

let preparedTemplates: PreparedTemplate[] | null = null;

export function identifyStructure(
  source: MoleculeDocument,
  selectedAtomIds: ReadonlySet<string> = new Set(),
  limit = 6,
): StructureIdentification {
  const target = extractIdentificationTarget(source, selectedAtomIds);
  if (!target.atoms.length) return { atomIds: [], formula: '—', atomCount: 0, matches: [] };
  const targetFingerprint = createFingerprint(target);
  const targetFormula = calculateStats(target).formula;
  const matches = templates()
    .map(({ entry, document, fingerprint }) => {
      const exact = areGraphsEquivalent(target, document);
      const similarity = exact ? 1 : jaccardSimilarity(targetFingerprint, fingerprint);
      return {
        entry,
        exact,
        similarity,
        explanation: exact
          ? 'Misma conectividad, elementos, cargas e hidrógenos implícitos.'
          : similarityExplanation(target, document, similarity),
      } satisfies IdentificationMatch;
    })
    .filter((match) => match.exact || match.similarity >= 0.16)
    .sort(
      (left, right) =>
        Number(right.exact) - Number(left.exact) ||
        right.similarity - left.similarity ||
        left.entry.name.localeCompare(right.entry.name, 'es'),
    )
    .slice(0, Math.max(1, limit));
  return {
    atomIds: target.atoms.map((atom) => atom.id),
    formula: targetFormula,
    atomCount: target.atoms.length,
    matches,
  };
}

export function libraryTemplateDocument(entry: StructureLibraryEntry): MoleculeDocument {
  if (entry.category === 'essentials') {
    const preset = MOLECULE_PRESETS.find((candidate) => candidate.id === entry.id);
    if (preset) return documentFromPreset(preset);
  }
  const generated = generateStructure(`smiles:${entry.smiles}`).document;
  generated.name = entry.name;
  return generated;
}

export function extractIdentificationTarget(
  source: MoleculeDocument,
  selectedAtomIds: ReadonlySet<string>,
): MoleculeDocument {
  const availableIds = new Set(source.atoms.map((atom) => atom.id));
  const selected = new Set([...selectedAtomIds].filter((id) => availableIds.has(id)));
  let atomIds: Set<string>;
  if (selected.size > 1) atomIds = selected;
  else {
    const components = connectedComponents(source);
    if (selected.size === 1) {
      const selectedId = [...selected][0];
      atomIds = components.find((component) => component.has(selectedId)) ?? selected;
    } else {
      atomIds = components.sort((left, right) => right.size - left.size)[0] ?? new Set();
    }
  }
  const target = createDocument(source.name);
  target.atoms = source.atoms.filter((atom) => atomIds.has(atom.id)).map((atom) => ({ ...atom }));
  target.bonds = source.bonds
    .filter((bond) => atomIds.has(bond.atomA) && atomIds.has(bond.atomB))
    .map((bond) => ({ ...bond }));
  target.components = [];
  return target;
}

function templates(): PreparedTemplate[] {
  if (preparedTemplates) return preparedTemplates;
  preparedTemplates = IDENTIFICATION_REFERENCES.map((entry) => {
    const document = libraryTemplateDocument(entry);
    return { entry, document, fingerprint: createFingerprint(document) };
  });
  return preparedTemplates;
}

function connectedComponents(document: MoleculeDocument): Set<string>[] {
  const adjacency = new Map(document.atoms.map((atom) => [atom.id, new Set<string>()]));
  document.bonds.forEach((bond) => {
    adjacency.get(bond.atomA)?.add(bond.atomB);
    adjacency.get(bond.atomB)?.add(bond.atomA);
  });
  const remaining = new Set(adjacency.keys());
  const components: Set<string>[] = [];
  while (remaining.size) {
    const first = remaining.values().next().value as string;
    const component = new Set<string>();
    const queue = [first];
    remaining.delete(first);
    while (queue.length) {
      const current = queue.shift()!;
      component.add(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!remaining.delete(neighbor)) continue;
        queue.push(neighbor);
      }
    }
    components.push(component);
  }
  return components;
}

function areGraphsEquivalent(first: MoleculeDocument, second: MoleculeDocument): boolean {
  if (first.atoms.length !== second.atoms.length || first.bonds.length !== second.bonds.length)
    return false;
  if (calculateStats(first).formula !== calculateStats(second).formula) return false;
  const firstCharge = first.atoms.reduce((sum, atom) => sum + atom.charge, 0);
  const secondCharge = second.atoms.reduce((sum, atom) => sum + atom.charge, 0);
  if (firstCharge !== secondCharge) return false;

  const firstAdjacency = adjacencyMap(first);
  const secondAdjacency = adjacencyMap(second);
  const candidates = new Map<string, Atom[]>();
  for (const atom of first.atoms) {
    const signature = atomSignature(first, atom, firstAdjacency);
    const compatible = second.atoms.filter(
      (candidate) => atomSignature(second, candidate, secondAdjacency) === signature,
    );
    if (!compatible.length) return false;
    candidates.set(atom.id, compatible);
  }
  const ordered = [...first.atoms].sort(
    (left, right) =>
      (candidates.get(left.id)?.length ?? 0) - (candidates.get(right.id)?.length ?? 0) ||
      (firstAdjacency.get(right.id)?.size ?? 0) - (firstAdjacency.get(left.id)?.size ?? 0),
  );
  const mapping = new Map<string, string>();
  const used = new Set<string>();
  const visit = (index: number): boolean => {
    if (index === ordered.length) return true;
    const atom = ordered[index];
    for (const candidate of candidates.get(atom.id) ?? []) {
      if (used.has(candidate.id)) continue;
      if (!mappedEdgesAgree(atom.id, candidate.id, mapping, firstAdjacency, secondAdjacency))
        continue;
      mapping.set(atom.id, candidate.id);
      used.add(candidate.id);
      if (visit(index + 1)) return true;
      mapping.delete(atom.id);
      used.delete(candidate.id);
    }
    return false;
  };
  return visit(0);
}

type Adjacency = Map<string, Map<string, string>>;

function adjacencyMap(document: MoleculeDocument): Adjacency {
  const adjacency: Adjacency = new Map(
    document.atoms.map((atom) => [atom.id, new Map<string, string>()]),
  );
  const aromaticBondIds = new Set(
    analyzeRings(document)
      .filter((ring) => ring.aromatic)
      .flatMap((ring) => ring.bondIds),
  );
  document.bonds.forEach((bond) => {
    const token = normalizedBondToken(bond, aromaticBondIds.has(bond.id));
    adjacency.get(bond.atomA)?.set(bond.atomB, token);
    adjacency.get(bond.atomB)?.set(bond.atomA, token);
  });
  return adjacency;
}

function atomSignature(document: MoleculeDocument, atom: Atom, adjacency: Adjacency): string {
  const edges = [...(adjacency.get(atom.id)?.values() ?? [])].sort().join(',');
  return [
    atom.element,
    atom.charge,
    atom.isotope ?? 0,
    adjacency.get(atom.id)?.size ?? 0,
    implicitHydrogensForAtom(document, atom),
    edges,
  ].join('|');
}

function mappedEdgesAgree(
  firstAtomId: string,
  secondAtomId: string,
  mapping: Map<string, string>,
  firstAdjacency: Adjacency,
  secondAdjacency: Adjacency,
): boolean {
  for (const [mappedFirst, mappedSecond] of mapping) {
    const firstEdge = firstAdjacency.get(firstAtomId)?.get(mappedFirst);
    const secondEdge = secondAdjacency.get(secondAtomId)?.get(mappedSecond);
    if (firstEdge !== secondEdge) return false;
  }
  return true;
}

function createFingerprint(document: MoleculeDocument): Set<string> {
  const features = new Set<string>();
  const elementCounts = new Map<string, number>();
  document.atoms.forEach((atom) =>
    elementCounts.set(atom.element, (elementCounts.get(atom.element) ?? 0) + 1),
  );
  elementCounts.forEach((count, element) => addCountFeatures(features, `atom:${element}`, count));

  const atoms = new Map(document.atoms.map((atom) => [atom.id, atom]));
  const aromaticBondIds = new Set(
    analyzeRings(document)
      .filter((ring) => ring.aromatic)
      .flatMap((ring) => ring.bondIds),
  );
  const bondCounts = new Map<string, number>();
  document.bonds.forEach((bond) => {
    const pair = [atoms.get(bond.atomA)?.element, atoms.get(bond.atomB)?.element].sort().join('-');
    const feature = `bond:${pair}:${normalizedBondToken(bond, aromaticBondIds.has(bond.id))}`;
    bondCounts.set(feature, (bondCounts.get(feature) ?? 0) + 1);
  });
  bondCounts.forEach((count, feature) => addCountFeatures(features, feature, count));

  analyzeFunctionalGroups(document).forEach((group) => features.add(`group:${group.name}`));
  analyzeRings(document).forEach((ring) => {
    features.add(`ring:${ring.atomIds.length}`);
    if (ring.aromatic) features.add(`ring:aromatic:${ring.atomIds.length}`);
  });
  const charge = document.atoms.reduce((sum, atom) => sum + atom.charge, 0);
  features.add(`charge:${charge}`);
  return features;
}

function addCountFeatures(features: Set<string>, prefix: string, count: number): void {
  for (let index = 1; index <= Math.min(24, count); index += 1) features.add(`${prefix}:${index}`);
}

function normalizedBondToken(bond: Bond, aromaticRingBond = false): string {
  if (aromaticRingBond || bond.kind === 'aromatic' || bond.kind === 'delocalized') return '1.5';
  if (bond.kind === 'hydrogen') return 'H';
  if (bond.kind === 'dative') return 'D';
  if (bond.kind === 'any') return '?';
  return String(bond.order);
}

function jaccardSimilarity(first: Set<string>, second: Set<string>): number {
  let intersection = 0;
  first.forEach((feature) => {
    if (second.has(feature)) intersection += 1;
  });
  const union = first.size + second.size - intersection;
  return union ? intersection / union : 0;
}

function similarityExplanation(
  target: MoleculeDocument,
  candidate: MoleculeDocument,
  similarity: number,
): string {
  const targetFormula = calculateStats(target).formula;
  const candidateFormula = calculateStats(candidate).formula;
  if (targetFormula === candidateFormula)
    return 'Comparte fórmula molecular, pero la conectividad o la protonación no son idénticas.';
  const targetGroups = new Set(analyzeFunctionalGroups(target).map((group) => group.name));
  const sharedGroups = analyzeFunctionalGroups(candidate)
    .map((group) => group.name)
    .filter((name) => targetGroups.has(name));
  if (sharedGroups.length)
    return `Coincidencia parcial por ${sharedGroups.slice(0, 2).join(' y ')} (${Math.round(similarity * 100)}%).`;
  return `Coincidencia topológica parcial del ${Math.round(similarity * 100)}%.`;
}
