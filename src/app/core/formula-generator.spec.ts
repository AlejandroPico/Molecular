import { calculateStats } from './chemistry.models';
import { generateStructure } from './formula-generator';

describe('formula generator', () => {
  it('creates an editable draft with the requested molecular formula', () => {
    const result = generateStructure('C6H12O6');
    expect(result.inputKind).toBe('formula');
    expect(calculateStats(result.document).formula).toBe('C6H12O6');
    expect(result.notice).toContain('no determina un isómero único');
  });

  it('normalizes lowercase formulas and typographic subscripts', () => {
    const water = generateStructure('h2o');
    expect(water.inputKind).toBe('formula');
    expect(calculateStats(water.document).formula).toBe('H2O');
    expect(water.notice).toContain('h2o');

    const typographicWater = generateStructure('H₂O');
    expect(typographicWater.inputKind).toBe('formula');
    expect(calculateStats(typographicWater.document).formula).toBe('H2O');
  });

  it('recognizes lowercase sulfuric acid without confusing it with SMILES', () => {
    const result = generateStructure('h2so4');
    expect(result.inputKind).toBe('formula');
    expect(result.document.name).toBe('Ácido sulfúrico');
    expect(result.document.atoms.filter((atom) => atom.element === 'S').length).toBe(1);
    expect(result.document.bonds.filter((bond) => bond.order === 2).length).toBe(2);
    expect(calculateStats(result.document).formula).toBe('H2O4S');
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

  it('keeps adjacent aliphatic C and aromatic c as separate atoms', () => {
    const result = generateStructure('CCc1ccccc1');
    expect(result.inputKind).toBe('smiles');
    expect(result.document.atoms.filter((atom) => atom.element === 'C').length).toBe(8);
    expect(result.document.bonds.filter((bond) => bond.kind === 'aromatic').length).toBe(6);
  });

  it('supports bracket hydrogens, formal charge, isotope and chirality', () => {
    const ammonium = generateStructure('[NH4+]');
    expect(calculateStats(ammonium.document).formula).toBe('H4N');
    expect(ammonium.document.atoms[0].charge).toBe(1);

    const chiral = generateStructure('N[13C@@H](C)C(=O)O');
    const center = chiral.document.atoms.find((atom) => atom.isotope === 13);
    expect(center?.chirality).toBe('@@');
    expect(center?.implicitHydrogenOverride).toBe(1);
  });

  it('supports extended ring numbers and forced SMILES prefixes', () => {
    const result = generateStructure('SMILES: C%10CCCCC%10');
    expect(result.inputKind).toBe('smiles');
    expect(result.document.bonds.length).toBe(6);
  });

  it('parses a long mixed-case aromatic and chiral SMILES chain', () => {
    const result = generateStructure('C[C@H](N)C(=O)N[C@@H](Cc1ccccc1)C(=O)O');
    expect(result.inputKind).toBe('smiles');
    expect(result.document.atoms.length).toBeGreaterThan(15);
    expect(result.document.atoms.filter((atom) => atom.chirality).length).toBe(2);
    expect(result.document.bonds.filter((bond) => bond.kind === 'aromatic').length).toBe(6);
  });
});
