import { describe, expect, it } from 'vitest';
import { documentFromPreset, MOLECULE_PRESETS } from './chemistry.models';
import {
  createClipboardPayload,
  parseClipboardPayload,
  serializeClipboardPayload,
} from './document-clipboard';

describe('document clipboard', () => {
  it('serializes a complete editable document', () => {
    const source = documentFromPreset(MOLECULE_PRESETS[0]);
    const payload = parseClipboardPayload(
      serializeClipboardPayload(createClipboardPayload(source)),
    );
    expect(payload.sourceName).toBe(source.name);
    expect(payload.document.atoms).toHaveLength(source.atoms.length);
    expect(payload.document.bonds).toHaveLength(source.bonds.length);
  });

  it('copies only bonds contained by the atom selection', () => {
    const source = documentFromPreset(MOLECULE_PRESETS[0]);
    const selected = new Set(source.atoms.slice(0, 2).map((atom) => atom.id));
    const payload = createClipboardPayload(source, selected);
    expect(payload.document.atoms).toHaveLength(2);
    expect(
      payload.document.bonds.every((bond) => selected.has(bond.atomA) && selected.has(bond.atomB)),
    ).toBe(true);
  });

  it('rejects unrelated clipboard text', () => {
    expect(() => parseClipboardPayload('H2O')).toThrow(/portapapeles/i);
  });
});
