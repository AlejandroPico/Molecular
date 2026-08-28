import {
  calculateStats,
  createAtom,
  createBond,
  createDocument,
  documentFromPreset,
  MOLECULE_PRESETS,
} from './chemistry.models';

describe('chemistry model', () => {
  it('calculates the formula and molar mass with implicit hydrogens', () => {
    const ethanol = documentFromPreset(MOLECULE_PRESETS.find((preset) => preset.id === 'ethanol')!);
    const stats = calculateStats(ethanol);
    expect(stats.formula).toBe('C2H6O');
    expect(stats.implicitHydrogens).toBe(6);
    expect(stats.molecularMass).toBeCloseTo(46.069, 2);
    expect(stats.warnings).toEqual([]);
  });

  it('detects an atom whose bond order exceeds its maximum valence', () => {
    const molecule = createDocument('Valencia imposible');
    const oxygen = createAtom('O', 0, 0);
    const carbonA = createAtom('C', -100, 0);
    const carbonB = createAtom('C', 100, 0);
    molecule.atoms = [oxygen, carbonA, carbonB];
    molecule.bonds = [createBond(oxygen.id, carbonA.id, 2), createBond(oxygen.id, carbonB.id, 2)];
    const stats = calculateStats(molecule);
    expect(stats.invalidAtomIds.has(oxygen.id)).toBe(true);
    expect(stats.warnings.length).toBe(1);
  });
});
