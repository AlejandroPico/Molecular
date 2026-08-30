export type SolarTheme = 'morning' | 'afternoon' | 'night';

export interface SolarWindow {
  sunrise: number;
  solarNoon: number;
  sunset: number;
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86_400_000);
}

export function solarWindow(date: Date, latitude: number, longitude: number): SolarWindow {
  const day = dayOfYear(date);
  const gamma = (2 * Math.PI * (day - 1)) / 365;
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const latitudeRadians = (Math.max(-89.8, Math.min(89.8, latitude)) * Math.PI) / 180;
  const zenith = (90.833 * Math.PI) / 180;
  const cosineHourAngle =
    (Math.cos(zenith) - Math.sin(latitudeRadians) * Math.sin(declination)) /
    (Math.cos(latitudeRadians) * Math.cos(declination));
  const utcOffsetHours = -date.getTimezoneOffset() / 60;
  const solarNoon = 12 + utcOffsetHours - longitude / 15 - equationOfTime / 60;

  if (cosineHourAngle >= 1) return { sunrise: 8, solarNoon: 12, sunset: 16 };
  if (cosineHourAngle <= -1) return { sunrise: 3, solarNoon: 12, sunset: 23 };
  const halfDaylight = (Math.acos(cosineHourAngle) * 12) / Math.PI;
  return {
    sunrise: solarNoon - halfDaylight,
    solarNoon,
    sunset: solarNoon + halfDaylight,
  };
}

export function resolveSolarTheme(
  date: Date,
  coordinates?: { latitude: number; longitude: number } | null,
): SolarTheme {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (!coordinates) {
    if (hour >= 6 && hour < 13) return 'morning';
    if (hour >= 13 && hour < 20) return 'afternoon';
    return 'night';
  }
  const window = solarWindow(date, coordinates.latitude, coordinates.longitude);
  if (hour < window.sunrise || hour >= window.sunset) return 'night';
  return hour < window.solarNoon ? 'morning' : 'afternoon';
}
