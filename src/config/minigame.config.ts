import { registerAs } from '@nestjs/config';

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default registerAs('minigame', () => ({
  spinRegenIntervalMinutes: parsePositiveInt(
    process.env.SPIN_REGEN_INTERVAL_MINUTES,
    5,
  ),
}));
