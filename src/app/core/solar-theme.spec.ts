import { describe, expect, it } from 'vitest';
import { resolveSolarTheme, solarWindow } from './solar-theme';

describe('solar themes', () => {
  it('uses simple local periods when location is unavailable', () => {
    expect(resolveSolarTheme(new Date(2026, 7, 30, 8))).toBe('morning');
    expect(resolveSolarTheme(new Date(2026, 7, 30, 17))).toBe('afternoon');
    expect(resolveSolarTheme(new Date(2026, 7, 30, 23))).toBe('night');
  });

  it('adapts daylight to the season at the same latitude', () => {
    const summer = solarWindow(new Date(2026, 5, 21, 12), 41.39, 2.17);
    const winter = solarWindow(new Date(2026, 11, 21, 12), 41.39, 2.17);
    expect(summer.sunrise).toBeLessThan(winter.sunrise);
    expect(summer.sunset).toBeGreaterThan(winter.sunset);
  });
});
