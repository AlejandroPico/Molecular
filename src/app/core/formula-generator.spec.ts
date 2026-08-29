import { calculateStats } from './chemistry.models';
import { generateStructure } from './formula-generator';

describe('formula generator', () => {
  it('creates an editable draft with the requested molecular formula', () => {
    const result = generateStructure('C6H12O6');
    expect(result.inputKind).toBe('formula');
    expect(calculateStats(result.document).formula).toBe('C6H12O6');
    expect(result.notice).toContain('no determina un isómero único');
  });

  it('parses branches and double bonds from SMILES', () => {
    const result = generateStructure('CC(=O)O');
    expect(result.inputKind).toBe('smiles');
    expect(calculateStats(result.document).formula).toBe('C2H4O2');
    expect(result.document.bonds.some((bond) => bond.order === 2)).toBe(true);
  });

  it('parses aromatic ring closures from SMILES', () => {
    const result = generateStructure('c1ccccc1');
    expect(calculateStats(result.document).formula).toBe('C6H6');
    expect(result.document.bonds.filter((bond) => bond.kind === 'aromatic').length).toBe(6);
  });
});
