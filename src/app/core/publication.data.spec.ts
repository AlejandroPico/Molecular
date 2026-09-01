import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPORT_SETTINGS,
  PUBLICATION_TEMPLATES,
  applyPublicationTemplate,
} from './publication.data';

describe('publication templates', () => {
  it('contains the five promised publication profiles', () => {
    expect(PUBLICATION_TEMPLATES).toHaveLength(5);
  });

  it('applies a profile without losing the selected export scope', () => {
    const current = { ...DEFAULT_EXPORT_SETTINGS, scope: 'selection' as const };
    const next = applyPublicationTemplate(current, PUBLICATION_TEMPLATES[1]);
    expect(next.scope).toBe('selection');
    expect(next.showMetadata).toBe(true);
    expect(next.aspectRatio).toBe('4:3');
  });
});
