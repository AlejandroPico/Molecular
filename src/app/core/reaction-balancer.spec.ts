import {
  createAtom,
  createBond,
  createDocument,
  createMolecularComponent,
} from './chemistry.models';
import { balanceReaction, reactionBalanceStatus } from './reaction-balancer';

describe('reaction balancer', () => {
  it('balances 2 H2 + O2 -> 2 H2O with the smallest integer coefficients', () => {
    const document = createDocument('Formación de agua');
    const h1 = createAtom('H', 0, 0);
    const h2 = createAtom('H', 40, 0);
    const o1 = createAtom('O', 120, 0);
    const o2 = createAtom('O', 160, 0);
    const waterO = createAtom('O', 260, 0);
    const waterH1 = createAtom('H', 230, 40);
    const waterH2 = createAtom('H', 290, 40);
    document.atoms = [h1, h2, o1, o2, waterO, waterH1, waterH2];
    document.bonds = [
      createBond(h1.id, h2.id),
      createBond(o1.id, o2.id, 2),
      createBond(waterO.id, waterH1.id),
      createBond(waterO.id, waterH2.id),
    ];
    const hydrogen = {
      ...createMolecularComponent([h1.id, h2.id], 'Hidrógeno'),
      role: 'reactant' as const,
    };
    const oxygen = {
      ...createMolecularComponent([o1.id, o2.id], 'Oxígeno'),
      role: 'reactant' as const,
    };
    const water = {
      ...createMolecularComponent([waterO.id, waterH1.id, waterH2.id], 'Agua'),
      role: 'product' as const,
    };
    const components = [hydrogen, oxygen, water];

    const result = balanceReaction(document, components);
    expect(result.balanced).toBe(true);
    expect(result.coefficients.get(hydrogen.id)).toBe(2);
    expect(result.coefficients.get(oxygen.id)).toBe(1);
    expect(result.coefficients.get(water.id)).toBe(2);

    const applied = components.map((component) => ({
      ...component,
      coefficient: result.coefficients.get(component.id)!,
    }));
    expect(reactionBalanceStatus(document, applied).balanced).toBe(true);
  });

  it('returns a useful failure when component roles are missing', () => {
    const result = balanceReaction(createDocument(), []);
    expect(result.balanced).toBe(false);
    expect(result.message).toContain('reactivo');
  });
});
