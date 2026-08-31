import { describe, expect, it } from 'vitest';
import { calculateStats, createDocument } from './chemistry.models';
import { STRUCTURE_LIBRARY } from './structure-library.data';
import { identifyStructure, libraryTemplateDocument } from './structure-identifier';

describe('structure library and identifier', () => {
  it('parses every curated structure as an editable molecular graph', () => {
    expect(STRUCTURE_LIBRARY).toHaveLength(36);
    for (const entry of STRUCTURE_LIBRARY) {
      const document = libraryTemplateDocument(entry);
      expect(document.atoms.length, entry.name).toBeGreaterThan(0);
      expect(document.bonds.length, entry.name).toBeGreaterThan(0);
      if (entry.category !== 'protecting-groups')
        expect(calculateStats(document).formula, entry.name).toBe(asciiFormula(entry.formula));
    }
  });

  it('identifies an inserted aspirin graph exactly', () => {
    const aspirin = STRUCTURE_LIBRARY.find((entry) => entry.id === 'aspirin')!;
    const document = libraryTemplateDocument(aspirin);
    const result = identifyStructure(document);
    expect(result.matches[0].entry.id).toBe('aspirin');
    expect(result.matches[0].exact).toBe(true);
    expect(result.matches[0].similarity).toBe(1);
  });

  it('uses the connected component around a single selected atom', () => {
    const aspirin = libraryTemplateDocument(
      STRUCTURE_LIBRARY.find((entry) => entry.id === 'aspirin')!,
    );
    const glycine = libraryTemplateDocument(
      STRUCTURE_LIBRARY.find((entry) => entry.id === 'glycine')!,
    );
    const combined = createDocument('Composición');
    combined.atoms = [...aspirin.atoms, ...glycine.atoms];
    combined.bonds = [...aspirin.bonds, ...glycine.bonds];
    const result = identifyStructure(combined, new Set([glycine.atoms[0].id]));
    expect(result.matches[0].entry.id).toBe('glycine');
    expect(result.atomCount).toBe(glycine.atoms.length);
  });
});

function asciiFormula(formula: string): string {
  const subscripts: Record<string, string> = {
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
  };
  return formula.replace(/[₀-₉]/g, (digit) => subscripts[digit]);
}
