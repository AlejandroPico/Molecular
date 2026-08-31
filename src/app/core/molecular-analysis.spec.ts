import {
  DEFAULT_VALIDATION_SETTINGS,
  analyzeFunctionalGroups,
  analyzeRings,
  calculateMolecularProperties,
  validateMolecularDocument,
} from './molecular-analysis';
import {
  MOLECULE_PRESETS,
  createAtom,
  createBond,
  createDocument,
  documentFromPreset,
} from './chemistry.models';

describe('molecular analysis', () => {
  it('recognizes the hydroxyl group and calculates ethanol descriptors', () => {
    const ethanol = documentFromPreset(MOLECULE_PRESETS.find((preset) => preset.id === 'ethanol')!);
    const groups = analyzeFunctionalGroups(ethanol);
    const properties = calculateMolecularProperties(ethanol);

    expect(groups.some((group) => group.type === 'alcohol')).toBe(true);
    expect(properties.formula).toBe('C2H6O');
    expect(properties.hydrogenBondDonors).toBe(1);
    expect(properties.hydrogenBondAcceptors).toBe(1);
    expect(properties.molecularMass).toBeCloseTo(46.069, 2);
    expect(properties.composition.reduce((sum, item) => sum + item.percentage, 0)).toBeCloseTo(
      100,
      5,
    );
  });

  it('detects a six-electron aromatic ring and exposes a resonance family', () => {
    const benzene = documentFromPreset(MOLECULE_PRESETS.find((preset) => preset.id === 'benzene')!);
    const rings = analyzeRings(benzene);
    expect(rings).toHaveLength(1);
    expect(rings[0].aromatic).toBe(true);
    expect(rings[0].electronCount).toBe(6);
    expect(rings[0].resonanceForms).toBeGreaterThanOrEqual(2);
    expect(analyzeFunctionalGroups(benzene).some((group) => group.type === 'aromatic-ring')).toBe(
      true,
    );
  });

  it('reports over-valent atoms in strict mode and permits a free profile', () => {
    const document = createDocument('Carbono pentacoordinado');
    const carbon = createAtom('C', 0, 0);
    const hydrogens = Array.from({ length: 5 }, (_, index) => createAtom('H', index * 30, 80));
    document.atoms = [carbon, ...hydrogens];
    document.bonds = hydrogens.map((hydrogen) => createBond(carbon.id, hydrogen.id));

    const strict = validateMolecularDocument(document, DEFAULT_VALIDATION_SETTINGS);
    const free = validateMolecularDocument(document, {
      ...DEFAULT_VALIDATION_SETTINGS,
      profile: 'free',
    });
    expect(strict.some((issue) => issue.id === `valence-${carbon.id}`)).toBe(true);
    expect(free).toEqual([]);
  });
});
