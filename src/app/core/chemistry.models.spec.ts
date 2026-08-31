import {
  calculateStats,
  cloneDocument,
  ELEMENT_BY_SYMBOL,
  ELEMENTS,
  createAtom,
  createBond,
  createDocument,
  documentFromPreset,
  MOLECULE_PRESETS,
  implicitHydrogensForAtom,
  validateBondChange,
  validateChargeChange,
  createElectronArrow,
  createMolecularComponent,
  synchronizeComponents,
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
    carbon.charge = 2;
    expect(implicitHydrogensForAtom(molecule, carbon)).toBe(0);
  });

  it('rejects a charge that conflicts with existing carbon bonds', () => {
    const molecule = createDocument('Carbono saturado');
    const carbon = createAtom('C', 0, 0);
    const hydrogens = Array.from({ length: 4 }, (_, index) => createAtom('H', index * 40, 80));
    molecule.atoms = [carbon, ...hydrogens];
    molecule.bonds = hydrogens.map((hydrogen) => createBond(carbon.id, hydrogen.id));
    expect(validateChargeChange(molecule, carbon, 1).valid).toBe(false);
  });

  it('treats a hydrogen bond as an annotation rather than covalent valence', () => {
    const molecule = createDocument('Puente de hidrógeno');
    const oxygenA = createAtom('O', 0, 0);
    const oxygenB = createAtom('O', 100, 0);
    molecule.atoms = [oxygenA, oxygenB];
    molecule.bonds = [createBond(oxygenA.id, oxygenB.id, 1, 'hydrogen')];
    expect(implicitHydrogensForAtom(molecule, oxygenA)).toBe(2);
    expect(calculateStats(molecule).warnings).toEqual([]);
  });

  it('supports the R pseudoatom without altering the 118-element catalogue', () => {
    expect(ELEMENT_BY_SYMBOL.get('R')?.name).toBe('Grupo R');
    expect(ELEMENTS.length).toBe(118);
  });

  it('migrates documents saved before arrows and Lewis annotations existed', () => {
    const legacy = createDocument('Documento anterior') as any;
    legacy.arrows = undefined;
    legacy.atoms = [
      { ...createAtom('N', 0, 0), lonePairs: undefined, radicalElectrons: undefined },
    ];
    const migrated = cloneDocument(legacy);
    expect(migrated.arrows).toEqual([]);
    expect(migrated.atoms[0].lonePairs).toBe(0);
    expect(migrated.atoms[0].radicalElectrons).toBe(0);
    expect(migrated.electronArrows).toEqual([]);
    expect(migrated.components).toHaveLength(1);
  });

  it('preserves explicit component groups and adds unassigned graphs', () => {
    const document = createDocument('Componentes');
    const a = createAtom('C', 0, 0);
    const b = createAtom('O', 100, 0);
    const c = createAtom('N', 300, 0);
    document.atoms = [a, b, c];
    document.bonds = [createBond(a.id, b.id)];
    document.components = [createMolecularComponent([a.id, b.id], 'Reactivo')];
    synchronizeComponents(document);
    expect(document.components).toHaveLength(2);
    expect(document.components?.[0].name).toBe('Reactivo');
  });

  it('creates curved arrows for electron pairs and fishhooks', () => {
    const arrow = createElectronArrow('pair', 0, 0, 100, 0);
    expect(arrow.controlY).toBeGreaterThan(0);
    expect(arrow.kind).toBe('pair');
  });
});
