import { createAtom, createBond, createDocument } from './chemistry.models';
import { cleanMolecularLayout } from './layout-engine';

describe('2D layout engine', () => {
  it('separates overlapping atoms and normalizes bond lengths', () => {
    const document = createDocument('Solapada');
    const atoms = Array.from({ length: 4 }, () => createAtom('C', 300, 300));
    document.atoms = atoms;
    document.bonds = [
      createBond(atoms[0].id, atoms[1].id),
      createBond(atoms[1].id, atoms[2].id),
      createBond(atoms[2].id, atoms[3].id),
    ];
    const cleaned = cleanMolecularLayout(document);
    const unique = new Set(
      cleaned.atoms.map((atom) => `${atom.x.toFixed(0)}:${atom.y.toFixed(0)}`),
    );
    expect(unique.size).toBe(4);
    cleaned.bonds.forEach((bond) => {
      const a = cleaned.atoms.find((atom) => atom.id === bond.atomA)!;
      const b = cleaned.atoms.find((atom) => atom.id === bond.atomB)!;
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(70);
    });
  });

  it('keeps locked atoms fixed', () => {
    const document = createDocument('Bloqueada');
    const a = createAtom('C', 40, 50);
    const b = createAtom('O', 55, 50);
    document.atoms = [a, b];
    document.bonds = [createBond(a.id, b.id)];
    const cleaned = cleanMolecularLayout(document, new Set([a.id, b.id]));
    expect(cleaned.atoms.map((atom) => [atom.x, atom.y])).toEqual([
      [40, 50],
      [55, 50],
    ]);
  });
});
