import {
  MoleculeDocument,
  cloneDocument,
  createDocument,
  synchronizeComponents,
} from './chemistry.models';

export const MOLECULAR_CLIPBOARD_FORMAT = 'molecular/clipboard+json';

export interface MolecularClipboardPayload {
  format: typeof MOLECULAR_CLIPBOARD_FORMAT;
  version: 1;
  copiedAt: string;
  sourceName: string;
  document: MoleculeDocument;
}

export function createClipboardPayload(
  source: MoleculeDocument,
  selectedAtomIds: ReadonlySet<string> = new Set(),
): MolecularClipboardPayload {
  const sourceCopy = cloneDocument(source);
  const atomIds = selectedAtomIds.size
    ? new Set([...selectedAtomIds].filter((id) => sourceCopy.atoms.some((atom) => atom.id === id)))
    : new Set(sourceCopy.atoms.map((atom) => atom.id));
  const document = createDocument(`${sourceCopy.name} · copia`);
  document.atoms = sourceCopy.atoms
    .filter((atom) => atomIds.has(atom.id))
    .map((atom) => ({ ...atom }));
  document.bonds = sourceCopy.bonds
    .filter((bond) => atomIds.has(bond.atomA) && atomIds.has(bond.atomB))
    .map((bond) => ({ ...bond }));
  document.components = (sourceCopy.components ?? [])
    .map((component) => ({
      ...component,
      atomIds: component.atomIds.filter((id) => atomIds.has(id)),
    }))
    .filter((component) => component.atomIds.length > 0);

  if (!selectedAtomIds.size) {
    document.arrows = sourceCopy.arrows.map((arrow) => ({ ...arrow }));
    document.electronArrows = (sourceCopy.electronArrows ?? []).map((arrow) => ({ ...arrow }));
    document.reactions = (sourceCopy.reactions ?? []).map((reaction) => ({
      ...reaction,
      reactantComponentIds: [...reaction.reactantComponentIds],
      productComponentIds: [...reaction.productComponentIds],
      reagentComponentIds: [...reaction.reagentComponentIds],
    }));
  }

  synchronizeComponents(document);
  return {
    format: MOLECULAR_CLIPBOARD_FORMAT,
    version: 1,
    copiedAt: new Date().toISOString(),
    sourceName: source.name,
    document,
  };
}

export function serializeClipboardPayload(payload: MolecularClipboardPayload): string {
  return JSON.stringify(payload);
}

export function parseClipboardPayload(value: string): MolecularClipboardPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('El portapapeles no contiene una estructura Molecular válida.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('El portapapeles no contiene una estructura Molecular válida.');
  }
  const payload = parsed as Partial<MolecularClipboardPayload>;
  if (
    payload.format !== MOLECULAR_CLIPBOARD_FORMAT ||
    payload.version !== 1 ||
    !payload.document ||
    !Array.isArray(payload.document.atoms) ||
    !Array.isArray(payload.document.bonds)
  ) {
    throw new Error('El contenido copiado no utiliza el formato de intercambio Molecular.');
  }
  return { ...payload, document: cloneDocument(payload.document) } as MolecularClipboardPayload;
}
