import { generateStructure } from './formula-generator';
import { exportChemicalText, exportSmiles, importChemicalText } from './chemical-formats';
import { calculateStats } from './chemistry.models';

describe('chemical formats', () => {
  it('round-trips MOL V2000 coordinates, charges and bond orders', () => {
    const source = generateStructure('CC(=O)O').document;
    source.atoms[0].charge = 1;
    const mol = exportChemicalText(source, 'mol');
    const imported = importChemicalText(mol, 'acetato.mol').documents[0];
    expect(imported.atoms).toHaveLength(source.atoms.length);
    expect(imported.bonds).toHaveLength(source.bonds.length);
    expect(imported.bonds.some((bond) => bond.order === 2)).toBe(true);
    expect(imported.atoms[0].charge).toBe(1);
  });

  it('exports and imports multi-record SDF', () => {
    const water = generateStructure('H2O').document;
    const acid = generateStructure('CC(=O)O').document;
    const sdf = `${exportChemicalText(water, 'sdf')}${exportChemicalText(acid, 'sdf')}`;
    const imported = importChemicalText(sdf, 'mixture.sdf');
    expect(imported.documents).toHaveLength(2);
  });

  it('writes a parseable aromatic-ring SMILES with two ring markers', () => {
    const benzene = generateStructure('c1ccccc1').document;
    const smiles = exportSmiles(benzene);
    expect((smiles.match(/1/g) ?? []).length).toBe(2);
    const restored = generateStructure(`SMILES: ${smiles}`).document;
    expect(calculateStats(restored).formula).toBe('C6H6');
  });

  it('imports InChI formula layers without pretending to recover full connectivity', () => {
    const imported = importChemicalText('InChI=1S/H2O/h1H2', 'water.inchi');
    expect(calculateStats(imported.documents[0]).formula).toBe('H2O');
    expect(imported.notice).toContain('capa de fórmula');
  });

  it('round-trips basic CML', () => {
    const source = generateStructure('CCO').document;
    const cml = exportChemicalText(source, 'cml');
    const restored = importChemicalText(cml, 'ethanol.cml').documents[0];
    expect(restored.atoms).toHaveLength(3);
    expect(restored.bonds).toHaveLength(2);
  });
});
