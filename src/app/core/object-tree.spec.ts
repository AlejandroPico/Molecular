import { describe, expect, it } from 'vitest';
import { MOLECULE_PRESETS, documentFromPreset } from './chemistry.models';
import { buildObjectTree } from './object-tree';

describe('object tree', () => {
  it('exposes components with their atoms and bonds', () => {
    const document = documentFromPreset(MOLECULE_PRESETS[0]);
    const tree = buildObjectTree(document);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(document.atoms.length + document.bonds.length);
  });

  it('keeps a parent when one of its children matches the search', () => {
    const document = documentFromPreset(MOLECULE_PRESETS[0]);
    expect(buildObjectTree(document, 'oxígeno')).toHaveLength(0);
    expect(buildObjectTree(document, 'carga')).toHaveLength(1);
  });
});
