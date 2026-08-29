import {
  calculateStats,
  ELEMENTS,
  createAtom,
  createBond,
  createDocument,
  documentFromPreset,
  MOLECULE_PRESETS,
  implicitHydrogensForAtom,
  validateBondChange,
  validateChargeChange,
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

  it('contains the complete periodic table', () => {
    expect(ELEMENTS.length).toBe(118);
    expect(ELEMENTS[0].name).toBe('Hidrógeno');
    expect(ELEMENTS.at(-1)?.name).toBe('Oganesón');
  });

  it('blocks a bond that would exceed oxygen valence before it is created', () => {
    const molecule = createDocument('Oxígeno saturado');
    const oxygen = createAtom('O', 0, 0);
    const carbonA = createAtom('C', -100, 0);
    const carbonB = createAtom('C', 100, 0);
    molecule.atoms = [oxygen, carbonA, carbonB];
    molecule.bonds = [createBond(oxygen.id, carbonA.id, 2)];
    const validation = validateBondChange(molecule, oxygen.id, carbonB.id, 1);
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('Oxígeno');
  });

  it('allows expanded sulfur valence up to six bond-order units', () => {
    const molecule = createDocument('Azufre expandido');
    const sulfur = createAtom('S', 0, 0);
    const carbon = createAtom('C', -100, 0);
    const nitrogen = createAtom('N', 100, 0);
    molecule.atoms = [sulfur, carbon, nitrogen];
    molecule.bonds = [createBond(sulfur.id, carbon.id, 3)];
    expect(validateBondChange(molecule, sulfur.id, nitrogen.id, 3).valid).toBe(true);
  });

  it('recalculates charged-carbon hydrogens instead of hiding all of them', () => {
    const molecule = createDocument('Carbono cargado');
    const carbon = createAtom('C', 0, 0);
    molecule.atoms = [carbon];
    expect(implicitHydrogensForAtom(molecule, carbon)).toBe(4);
    carbon.charge = 1;
    expect(implicitHydrogensForAtom(molecule, carbon)).toBe(3);
    carbon.charge = -1;
    expect(implicitHydrogensForAtom(molecule, carbon)).toBe(3);
  });

  it('rejects a charge that conflicts with existing carbon bonds', () => {
    const molecule = createDocument('Carbono saturado');
    const carbon = createAtom('C', 0, 0);
    const hydrogens = Array.from({ length: 4 }, (_, index) => createAtom('H', index * 40, 80));
    molecule.atoms = [carbon, ...hydrogens];
    molecule.bonds = hydrogens.map((hydrogen) => createBond(carbon.id, hydrogen.id));
    expect(validateChargeChange(molecule, carbon, 1).valid).toBe(false);
  });
});
