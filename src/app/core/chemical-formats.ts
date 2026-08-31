import {
  Atom,
  AtomSymbol,
  Bond,
  ELEMENT_BY_SYMBOL,
  MoleculeDocument,
  bondKindForOrder,
  calculateStats,
  cloneDocument,
  createAtom,
  createBond,
  createDocument,
  synchronizeComponents,
} from './chemistry.models';
import { generateStructures } from './formula-generator';

export type ChemicalFormat = 'molecular' | 'mol' | 'sdf' | 'smiles' | 'inchi' | 'cml';

export interface ChemicalImportResult {
  format: ChemicalFormat;
  documents: MoleculeDocument[];
  notice: string;
}

function extension(name: string): string {
  return name.toLowerCase().split('.').pop() ?? '';
}

function detectFormat(text: string, fileName: string): ChemicalFormat {
  const ext = extension(fileName);
  if (ext === 'mol') return 'mol';
  if (ext === 'sdf') return 'sdf';
  if (ext === 'smi' || ext === 'smiles') return 'smiles';
  if (ext === 'inchi') return 'inchi';
  if (ext === 'cml' || /^\s*<\?xml|^\s*<cml/i.test(text)) return 'cml';
  if (/^\s*InChI=/i.test(text)) return 'inchi';
  if (/\$\$\$\$/m.test(text)) return 'sdf';
  if (/V2000|V3000/.test(text)) return 'mol';
  if (/^\s*\{/.test(text)) return 'molecular';
  return 'smiles';
}

export function importChemicalText(text: string, fileName: string): ChemicalImportResult {
  const format = detectFormat(text, fileName);
  if (format === 'molecular') {
    const document = JSON.parse(text) as MoleculeDocument;
    if (!Array.isArray(document.atoms) || !Array.isArray(document.bonds)) {
      throw new Error('El documento Molecular no contiene un grafo válido.');
    }
    return {
      format,
      documents: [cloneDocument(document)],
      notice: 'Documento Molecular restaurado.',
    };
  }
  if (format === 'mol') {
    return { format, documents: [parseMol(text)], notice: 'Molfile V2000 importado.' };
  }
  if (format === 'sdf') {
    const records = text
      .split(/\$\$\$\$\s*/)
      .map((record) => record.trim())
      .filter(Boolean)
      .map(parseMol);
    if (!records.length) throw new Error('El archivo SDF no contiene registros legibles.');
    return { format, documents: records, notice: `${records.length} registro(s) SDF importados.` };
  }
  if (format === 'smiles') {
    const entries = text
      .split(/[\r\n]+/)
      .map((line) => line.trim().split(/\s+/)[0])
      .filter(Boolean);
    const documents = entries.flatMap((entry) =>
      generateStructures(entry).map((item) => item.document),
    );
    if (!documents.length) throw new Error('No se encontró ninguna cadena SMILES.');
    return { format, documents, notice: `${documents.length} cadena(s) SMILES importadas.` };
  }
  if (format === 'inchi') {
    const entries = text
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const documents = entries.map((entry) => {
      const match = entry.match(/^InChI=1S?\/([^/]+)/i);
      if (!match) throw new Error('La cabecera InChI no es reconocible.');
      return generateStructures(match[1])[0].document;
    });
    return {
      format,
      documents,
      notice: 'Se importó la capa de fórmula de InChI; la conectividad fina debe revisarse.',
    };
  }
  return {
    format,
    documents: [parseCml(text)],
    notice: 'Documento CML importado con átomos, enlaces y coordenadas 2D.',
  };
}

function parseMol(text: string): MoleculeDocument {
  const lines = text.replace(/\r/g, '').split('\n');
  if (lines.some((line) => line.includes('V3000'))) {
    throw new Error('V3000 todavía no está admitido; guarda el archivo como MOL V2000.');
  }
  const countsIndex = lines.findIndex((line) => line.includes('V2000'));
  if (countsIndex < 0) throw new Error('No se encuentra la línea de conteo V2000.');
  const counts = lines[countsIndex].trim().split(/\s+/);
  const atomCount = Number(lines[countsIndex].slice(0, 3)) || Number(counts[0]);
  const bondCount = Number(lines[countsIndex].slice(3, 6)) || Number(counts[1]);
  if (!Number.isFinite(atomCount) || !Number.isFinite(bondCount))
    throw new Error('Conteo MOL inválido.');
  const document = createDocument(lines[0]?.trim() || 'Molfile importado');
  const atoms: Atom[] = [];
  for (let index = 0; index < atomCount; index += 1) {
    const line = lines[countsIndex + 1 + index] ?? '';
    const parts = line.trim().split(/\s+/);
    const x = Number(line.slice(0, 10)) || Number(parts[0]) || 0;
    const y = Number(line.slice(10, 20)) || Number(parts[1]) || 0;
    const symbol = (line.slice(31, 34).trim() || parts[3] || 'C') as AtomSymbol;
    if (!ELEMENT_BY_SYMBOL.has(symbol)) throw new Error(`Elemento MOL no reconocido: ${symbol}.`);
    const atom = createAtom(symbol, 700 + x * 58, 400 - y * 58);
    atoms.push(atom);
  }
  document.atoms = atoms;
  for (let index = 0; index < bondCount; index += 1) {
    const line = lines[countsIndex + 1 + atomCount + index] ?? '';
    const parts = line.trim().split(/\s+/).map(Number);
    const aIndex = (Number(line.slice(0, 3)) || parts[0]) - 1;
    const bIndex = (Number(line.slice(3, 6)) || parts[1]) - 1;
    const orderValue = Number(line.slice(6, 9)) || parts[2] || 1;
    const stereo = Number(line.slice(9, 12)) || parts[3] || 0;
    const atomA = atoms[aIndex];
    const atomB = atoms[bIndex];
    if (!atomA || !atomB) continue;
    const order = Math.max(1, Math.min(3, orderValue)) as 1 | 2 | 3;
    const kind = stereo === 1 ? 'up' : stereo === 6 ? 'down' : bondKindForOrder(order);
    document.bonds.push(createBond(atomA.id, atomB.id, order, kind));
  }
  for (const line of lines) {
    if (!/^M  CHG/.test(line)) continue;
    const parts = line.trim().split(/\s+/);
    const pairs = Number(parts[2]) || 0;
    for (let index = 0; index < pairs; index += 1) {
      const atom = atoms[Number(parts[3 + index * 2]) - 1];
      if (atom) atom.charge = Number(parts[4 + index * 2]) || 0;
    }
  }
  synchronizeComponents(document);
  return document;
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  source.replace(/([\w:-]+)\s*=\s*["']([^"']*)["']/g, (_, key: string, value: string) => {
    attributes[key] = value;
    return '';
  });
  return attributes;
}

function parseCml(text: string): MoleculeDocument {
  const title = text.match(/<molecule[^>]*(?:title|id)=["']([^"']+)/i)?.[1] ?? 'CML importado';
  const document = createDocument(title);
  const atomMap = new Map<string, Atom>();
  for (const match of text.matchAll(/<atom\b([^>]*?)(?:\/?>)/gi)) {
    const attributes = parseAttributes(match[1]);
    if (!attributes['id'] || !attributes['elementType']) continue;
    const x = Number(attributes['x2'] ?? attributes['x3'] ?? 0);
    const y = Number(attributes['y2'] ?? attributes['y3'] ?? 0);
    const symbol = attributes['elementType'] as AtomSymbol;
    if (!ELEMENT_BY_SYMBOL.has(symbol)) throw new Error(`Elemento CML no reconocido: ${symbol}.`);
    const atom = createAtom(symbol, 700 + x * 58, 400 - y * 58);
    atom.charge = Number(attributes['formalCharge'] ?? 0);
    atom.isotope = attributes['isotopeNumber'] ? Number(attributes['isotopeNumber']) : undefined;
    atomMap.set(attributes['id'], atom);
    document.atoms.push(atom);
  }
  for (const match of text.matchAll(/<bond\b([^>]*?)(?:\/?>)/gi)) {
    const attributes = parseAttributes(match[1]);
    const refs = (attributes['atomRefs2'] ?? '').split(/\s+/);
    const atomA = atomMap.get(refs[0]);
    const atomB = atomMap.get(refs[1]);
    if (!atomA || !atomB) continue;
    const rawOrder = attributes['order'] ?? '1';
    const order = (rawOrder === '3' ? 3 : rawOrder === '2' ? 2 : 1) as 1 | 2 | 3;
    const kind = rawOrder === 'A' ? 'aromatic' : bondKindForOrder(order);
    const bond = createBond(atomA.id, atomB.id, order, kind);
    const stereo = attributes['stereo'];
    if (stereo === 'E' || stereo === 'Z') bond.stereochemistry = stereo;
    document.bonds.push(bond);
  }
  if (!document.atoms.length) throw new Error('El CML no contiene átomos reconocibles.');
  synchronizeComponents(document);
  return document;
}

function pad(value: string | number, length: number): string {
  return String(value).padStart(length, ' ');
}

function molBlock(document: MoleculeDocument): string {
  const lines = [
    document.name.slice(0, 80),
    '  Molecular 0.6.0',
    '',
    `${pad(document.atoms.length, 3)}${pad(document.bonds.length, 3)}  0  0  0  0            999 V2000`,
  ];
  for (const atom of document.atoms) {
    const x = ((atom.x - 700) / 58).toFixed(4).padStart(10, ' ');
    const y = ((400 - atom.y) / 58).toFixed(4).padStart(10, ' ');
    lines.push(
      `${x}${y}${'0.0000'.padStart(10, ' ')} ${String(atom.element).padEnd(3, ' ')} 0  0  0  0  0  0  0  0  0  0  0  0`,
    );
  }
  const atomIndex = new Map(document.atoms.map((atom, index) => [atom.id, index + 1]));
  for (const bond of document.bonds) {
    const stereo = bond.kind === 'up' ? 1 : bond.kind === 'down' ? 6 : 0;
    lines.push(
      `${pad(atomIndex.get(bond.atomA) ?? 0, 3)}${pad(atomIndex.get(bond.atomB) ?? 0, 3)}${pad(bond.order, 3)}${pad(stereo, 3)}  0  0  0`,
    );
  }
  const charges = document.atoms
    .map((atom, index) => ({ atom, index: index + 1 }))
    .filter(({ atom }) => atom.charge !== 0);
  for (let offset = 0; offset < charges.length; offset += 8) {
    const group = charges.slice(offset, offset + 8);
    lines.push(
      `M  CHG${pad(group.length, 3)}${group.map(({ atom, index }) => `${pad(index, 4)}${pad(atom.charge, 4)}`).join('')}`,
    );
  }
  lines.push('M  END');
  return lines.join('\n');
}

function atomToken(atom: Atom, aromatic = false): string {
  const plain =
    atom.isotope == null && atom.charge === 0 && !atom.chirality && !atom.stereochemistry;
  const organic = ['B', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I'].includes(atom.element);
  if (plain && organic) {
    return aromatic && ['B', 'C', 'N', 'O', 'P', 'S'].includes(atom.element)
      ? atom.element.toLowerCase()
      : atom.element;
  }
  const stereo = atom.chirality ?? '';
  const charge =
    atom.charge === 0
      ? ''
      : atom.charge > 0
        ? `+${atom.charge === 1 ? '' : atom.charge}`
        : `-${atom.charge === -1 ? '' : Math.abs(atom.charge)}`;
  return `[${atom.isotope ?? ''}${atom.element}${stereo}${charge}]`;
}

function smilesBond(bond: Bond): string {
  if (bond.kind === 'aromatic') return ':';
  if (bond.kind === 'dative') return '->';
  return bond.order === 3 ? '#' : bond.order === 2 ? '=' : '';
}

export function exportSmiles(document: MoleculeDocument): string {
  const adjacency = new Map(document.atoms.map((atom) => [atom.id, [] as Bond[]]));
  document.bonds.forEach((bond) => {
    adjacency.get(bond.atomA)?.push(bond);
    adjacency.get(bond.atomB)?.push(bond);
  });
  const atomById = new Map(document.atoms.map((atom) => [atom.id, atom]));
  const visited = new Set<string>();
  const usedEdges = new Set<string>();
  const children = new Map<string, Array<{ atomId: string; bond: Bond }>>();
  const ringEdges: Bond[] = [];
  const roots: string[] = [];
  const buildTree = (atomId: string) => {
    visited.add(atomId);
    for (const bond of adjacency.get(atomId) ?? []) {
      if (usedEdges.has(bond.id)) continue;
      usedEdges.add(bond.id);
      const otherId = bond.atomA === atomId ? bond.atomB : bond.atomA;
      if (visited.has(otherId)) {
        ringEdges.push(bond);
        continue;
      }
      const list = children.get(atomId) ?? [];
      list.push({ atomId: otherId, bond });
      children.set(atomId, list);
      buildTree(otherId);
    }
  };
  for (const atom of document.atoms) {
    if (visited.has(atom.id)) continue;
    roots.push(atom.id);
    buildTree(atom.id);
  }
  const ringTokens = new Map<string, string[]>();
  ringEdges.forEach((bond, index) => {
    const number = index + 1;
    const token = number > 9 ? `%${number}` : String(number);
    ringTokens.set(bond.atomA, [
      ...(ringTokens.get(bond.atomA) ?? []),
      `${smilesBond(bond)}${token}`,
    ]);
    ringTokens.set(bond.atomB, [...(ringTokens.get(bond.atomB) ?? []), token]);
  });
  const render = (atomId: string): string => {
    const aromatic = (adjacency.get(atomId) ?? []).some((bond) => bond.kind === 'aromatic');
    let output =
      atomToken(atomById.get(atomId)!, aromatic) + (ringTokens.get(atomId) ?? []).join('');
    (children.get(atomId) ?? []).forEach((child, index) => {
      const token = `${smilesBond(child.bond)}${render(child.atomId)}`;
      output += index === 0 ? token : `(${token})`;
    });
    return output;
  };
  return roots.map(render).join('.');
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export function exportChemicalText(document: MoleculeDocument, format: ChemicalFormat): string {
  if (format === 'molecular') return JSON.stringify(document, null, 2);
  if (format === 'mol') return molBlock(document);
  if (format === 'sdf') {
    const records =
      (document.components?.length ?? 0) > 1
        ? document.components!.map((component) => {
            const record = documentForComponent(document, new Set(component.atomIds));
            record.name = component.name;
            return record;
          })
        : [document];
    return records
      .map(
        (record) =>
          `${molBlock(record)}\n>  <MOLECULAR_FORMULA>\n${calculateStats(record).formula}\n\n$$$$\n`,
      )
      .join('');
  }
  if (format === 'smiles') return `${exportSmiles(document)}\t${document.name}\n`;
  if (format === 'inchi') return `InChI=1S/${calculateStats(document).formula}\n`;
  const atomIndex = new Map(document.atoms.map((atom, index) => [atom.id, `a${index + 1}`]));
  const atoms = document.atoms.map((atom, index) => {
    const attrs = [
      `id="a${index + 1}"`,
      `elementType="${atom.element}"`,
      `x2="${((atom.x - 700) / 58).toFixed(4)}"`,
      `y2="${((400 - atom.y) / 58).toFixed(4)}"`,
    ];
    if (atom.charge) attrs.push(`formalCharge="${atom.charge}"`);
    if (atom.isotope) attrs.push(`isotopeNumber="${atom.isotope}"`);
    return `      <atom ${attrs.join(' ')} />`;
  });
  const bonds = document.bonds.map((bond, index) => {
    const order = bond.kind === 'aromatic' ? 'A' : bond.order;
    const stereo = bond.stereochemistry ? ` stereo="${bond.stereochemistry}"` : '';
    return `      <bond id="b${index + 1}" atomRefs2="${atomIndex.get(bond.atomA)} ${atomIndex.get(bond.atomB)}" order="${order}"${stereo} />`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<cml xmlns="http://www.xml-cml.org/schema">\n  <molecule id="m1" title="${escapeXml(document.name)}">\n    <atomArray>\n${atoms.join('\n')}\n    </atomArray>\n    <bondArray>\n${bonds.join('\n')}\n    </bondArray>\n  </molecule>\n</cml>\n`;
}

export function documentForComponent(
  document: MoleculeDocument,
  atomIds: ReadonlySet<string>,
): MoleculeDocument {
  const copy = cloneDocument(document);
  copy.atoms = copy.atoms.filter((atom) => atomIds.has(atom.id));
  copy.bonds = copy.bonds.filter((bond) => atomIds.has(bond.atomA) && atomIds.has(bond.atomB));
  copy.components = copy.components?.filter((component) =>
    component.atomIds.some((id) => atomIds.has(id)),
  );
  synchronizeComponents(copy);
  return copy;
}
