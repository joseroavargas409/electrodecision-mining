/** Integrate the observed fraction of each 15-minute power block, in kWh. */
export function energyUntilMinute(profile: number[], minute: number): number {
  const end = Math.max(0, Math.min(profile.length * 15, minute));
  return profile.reduce((sum, kw, i) => sum + kw * Math.max(0, Math.min(15, end - i * 15)) / 60, 0);
}

export function simulationClock(minute: number): string {
  const value = Math.floor(Math.max(0, Math.min(1440, minute)));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
