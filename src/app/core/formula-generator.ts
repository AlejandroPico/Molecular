import {
  Atom,
  AtomSymbol,
  BondKind,
  ELEMENT_BY_SYMBOL,
  MOLECULE_PRESETS,
  MoleculeDocument,
  bondOrderForAtom,
  calculateStats,
  createAtom,
  createBond,
  createDocument,
  documentFromPreset,
  maxValenceForAtom,
} from './chemistry.models';

export interface FormulaGenerationResult {
  document: MoleculeDocument;
  inputKind: 'formula' | 'smiles';
  notice: string;
}

interface PendingBond {
  order: 1 | 2 | 3;
  kind: BondKind;
}

const DEFAULT_BOND: PendingBond = { order: 1, kind: 'single' };

export function generateStructure(source: string): FormulaGenerationResult {
  const input = source.trim().replace(/\s+/g, '');
  if (!input) throw new Error('Escribe una fórmula molecular o una cadena SMILES.');
  const formula = parseMolecularFormula(input);
  return formula ? generateFromFormula(input, formula) : generateFromSmiles(input);
}

function parseMolecularFormula(input: string): Map<AtomSymbol, number> | null {
  const counts = new Map<AtomSymbol, number>();
  const pattern = /([A-Z][a-z]?|R)(\d*)/g;
  let cursor = 0;
  for (const match of input.matchAll(pattern)) {
    if (match.index !== cursor) return null;
    const symbol = match[1] as AtomSymbol;
    if (!ELEMENT_BY_SYMBOL.has(symbol)) return null;
    const count = match[2] ? Number(match[2]) : 1;
    if (!Number.isInteger(count) || count < 1 || count > 240) return null;
    counts.set(symbol, (counts.get(symbol) ?? 0) + count);
    cursor = match.index + match[0].length;
  }
  return cursor === input.length && counts.size ? counts : null;
}

function generateFromFormula(
  formula: string,
  counts: Map<AtomSymbol, number>,
): FormulaGenerationResult {
  for (const preset of MOLECULE_PRESETS) {
    const document = documentFromPreset(preset);
    if (calculateStats(document).formula === formula) {
      return {
        document,
        inputKind: 'formula',
        notice: `Se ha usado la estructura conocida de ${preset.name}.`,
      };
    }
  }

  const document = createDocument(`Borrador ${formula}`);
  const hydrogenCount = counts.get('H') ?? 0;
  const heavySymbols: AtomSymbol[] = [];
  const carbonCount = counts.get('C') ?? 0;
  for (let index = 0; index < carbonCount; index += 1) heavySymbols.push('C');
  for (const [symbol, count] of counts) {
    if (symbol === 'H' || symbol === 'C') continue;
    for (let index = 0; index < count; index += 1) heavySymbols.push(symbol);
  }

  if (!heavySymbols.length) {
    for (let index = 0; index < hydrogenCount; index += 1) {
      document.atoms.push(createAtom('H', 610 + index * 90, 400));
      if (index)
        document.bonds.push(createBond(document.atoms[index - 1].id, document.atoms[index].id));
    }
    return {
      document,
      inputKind: 'formula',
      notice: 'Se ha creado la representación elemental disponible para la fórmula indicada.',
    };
  }

  const carbons: Atom[] = [];
  for (let index = 0; index < carbonCount; index += 1) {
    const atom = createAtom('C', 480 + index * 108, 390 + (index % 2 ? 34 : -34));
    carbons.push(atom);
    document.atoms.push(atom);
    if (index) document.bonds.push(createBond(carbons[index - 1].id, atom.id));
  }

  const heteroAtoms = heavySymbols.slice(carbonCount);
  if (carbons.length) {
    heteroAtoms.forEach((symbol, index) => {
      const anchor = carbons[index % carbons.length];
      const row = Math.floor(index / Math.max(1, carbons.length));
      const side = index % 2 ? 1 : -1;
      const atom = createAtom(symbol, anchor.x + row * 34, anchor.y + side * (108 + row * 44));
      document.atoms.push(atom);
      document.bonds.push(createBond(anchor.id, atom.id));
    });
  } else {
    heteroAtoms.forEach((symbol, index) => {
      const atom = createAtom(symbol, 540 + index * 110, 390 + (index % 2 ? 32 : -32));
      document.atoms.push(atom);
      if (index) document.bonds.push(createBond(document.atoms[index - 1].id, atom.id));
    });
  }

  let remainingHydrogens = hydrogenCount;
  for (const atom of document.atoms) {
    if (atom.element === 'R') continue;
    const capacity = Math.max(
      0,
      Math.floor(maxValenceForAtom(atom) - bondOrderForAtom(document, atom.id)),
    );
    const assigned = Math.min(capacity, remainingHydrogens);
    atom.implicitHydrogenOverride = assigned;
    remainingHydrogens -= assigned;
  }
  if (remainingHydrogens) {
    throw new Error(
      `No se puede acomodar ${formula} con el modelo educativo de valencias: sobran ${remainingHydrogens} hidrógenos.`,
    );
  }

  return {
    document,
    inputKind: 'formula',
    notice:
      'Una fórmula molecular no determina un isómero único. Se ha creado un borrador coherente que puedes reorganizar; usa SMILES para fijar la conectividad.',
  };
}

function generateFromSmiles(smiles: string): FormulaGenerationResult {
  const document = createDocument(`SMILES · ${smiles.slice(0, 28)}`);
  const branchStack: Array<{ atomId: string; depth: number }> = [];
  const ringClosures = new Map<string, { atomId: string; bond: PendingBond }>();
  const neighbourCounts = new Map<string, number>();
  const aromaticAtomIds = new Set<string>();
  let currentAtomId: string | null = null;
  let pendingBond: PendingBond = { ...DEFAULT_BOND };
  let depth = 0;
  let component = 0;

  const addAtom = (symbol: AtomSymbol, charge = 0, aromatic = false): Atom => {
    const parent = document.atoms.find((atom) => atom.id === currentAtomId);
    const neighbourIndex = parent ? (neighbourCounts.get(parent.id) ?? 0) : 0;
    const angles = [0, -Math.PI / 3, Math.PI / 3, -Math.PI * 0.72, Math.PI * 0.72, Math.PI];
    const angle = angles[Math.min(neighbourIndex, angles.length - 1)] + depth * 0.12;
    const atom = createAtom(
      symbol,
      parent ? parent.x + Math.cos(angle) * 112 : 470 + component * 220,
      parent ? parent.y + Math.sin(angle) * 112 : 390,
    );
    atom.charge = charge;
    document.atoms.push(atom);
    if (aromatic) aromaticAtomIds.add(atom.id);
    if (parent) {
      const kind = aromatic && pendingBond.kind === 'single' ? 'aromatic' : pendingBond.kind;
      document.bonds.push(createBond(parent.id, atom.id, pendingBond.order, kind));
      neighbourCounts.set(parent.id, neighbourIndex + 1);
      neighbourCounts.set(atom.id, 1);
    }
    currentAtomId = atom.id;
    pendingBond = { ...DEFAULT_BOND };
    return atom;
  };

  for (let index = 0; index < smiles.length;) {
    const character = smiles[index];
    if (character === '(') {
      if (!currentAtomId) throw new Error('La rama SMILES no tiene un átomo de origen.');
      branchStack.push({ atomId: currentAtomId, depth });
      depth += 1;
      index += 1;
      continue;
    }
    if (character === ')') {
      const branch = branchStack.pop();
      if (!branch) throw new Error('Hay un cierre de rama SMILES sin apertura.');
      currentAtomId = branch.atomId;
      depth = branch.depth;
      index += 1;
      continue;
    }
    if (character === '.') {
      currentAtomId = null;
      component += 1;
      index += 1;
      continue;
    }
    const bond = parseBondCharacter(character);
    if (bond) {
      pendingBond = bond;
      index += 1;
      continue;
    }
    if (/\d/.test(character)) {
      if (!currentAtomId) throw new Error('El cierre de anillo SMILES no tiene átomo.');
      const previous = ringClosures.get(character);
      if (previous) {
        let selected = pendingBond.kind === 'single' ? previous.bond : pendingBond;
        if (
          selected.kind === 'single' &&
          aromaticAtomIds.has(previous.atomId) &&
          aromaticAtomIds.has(currentAtomId)
        )
          selected = { order: 1, kind: 'aromatic' };
        document.bonds.push(
          createBond(previous.atomId, currentAtomId, selected.order, selected.kind),
        );
        ringClosures.delete(character);
      } else {
        ringClosures.set(character, { atomId: currentAtomId, bond: pendingBond });
      }
      pendingBond = { ...DEFAULT_BOND };
      index += 1;
      continue;
    }

    let token = '';
    if (character === '[') {
      const end = smiles.indexOf(']', index + 1);
      if (end < 0) throw new Error('Falta cerrar un átomo entre corchetes en SMILES.');
      token = smiles.slice(index + 1, end);
      index = end + 1;
    } else if (/[A-Z]/.test(character)) {
      token = character + (/[a-z]/.test(smiles[index + 1] ?? '') ? smiles[index + 1] : '');
      index += token.length;
    } else if (/[bcnosp]/.test(character)) {
      token = character;
      index += 1;
    } else {
      throw new Error(`Símbolo SMILES no reconocido cerca de «${smiles.slice(index, index + 6)}».`);
    }

    const parsed = parseSmilesAtom(token);
    addAtom(parsed.symbol, parsed.charge, parsed.aromatic);
  }

  if (branchStack.length || ringClosures.size)
    throw new Error('La cadena SMILES contiene ramas o anillos sin cerrar.');
  if (!document.atoms.length) throw new Error('La cadena SMILES no contiene átomos.');
  centerDocument(document);
  return {
    document,
    inputKind: 'smiles',
    notice: 'Conectividad generada desde SMILES. Puedes editar cada átomo, enlace y carga.',
  };
}

function parseBondCharacter(character: string): PendingBond | null {
  if (character === '-') return { order: 1, kind: 'single' };
  if (character === '=') return { order: 2, kind: 'double' };
  if (character === '#') return { order: 3, kind: 'triple' };
  if (character === ':') return { order: 1, kind: 'delocalized' };
  if (character === '/') return { order: 1, kind: 'up' };
  if (character === '\\') return { order: 1, kind: 'down' };
  return null;
}

function parseSmilesAtom(token: string): {
  symbol: AtomSymbol;
  charge: number;
  aromatic: boolean;
} {
  const match = token.match(/^([A-Z][a-z]?|[bcnosp]|R)/);
  if (!match) throw new Error(`Átomo SMILES «${token}» no reconocido.`);
  const aromatic = /^[bcnosp]$/.test(match[1]);
  const symbol = (aromatic ? match[1][0].toUpperCase() : match[1]) as AtomSymbol;
  if (!ELEMENT_BY_SYMBOL.has(symbol)) throw new Error(`El elemento ${symbol} no está disponible.`);
  const chargeToken = token.slice(match[0].length).match(/([+-])(\d*)/);
  const magnitude = chargeToken?.[2] ? Number(chargeToken[2]) : chargeToken ? 1 : 0;
  return { symbol, charge: chargeToken?.[1] === '-' ? -magnitude : magnitude, aromatic };
}

function centerDocument(document: MoleculeDocument): void {
  const minX = Math.min(...document.atoms.map((atom) => atom.x));
  const maxX = Math.max(...document.atoms.map((atom) => atom.x));
  const minY = Math.min(...document.atoms.map((atom) => atom.y));
  const maxY = Math.max(...document.atoms.map((atom) => atom.y));
  const dx = 700 - (minX + maxX) / 2;
  const dy = 400 - (minY + maxY) / 2;
  document.atoms.forEach((atom) => {
    atom.x += dx;
    atom.y += dy;
  });
}
