import { registerAs } from '@nestjs/config';

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeRedisKey = (
  value: string | undefined,
  fallback: string,
): string => {
  const key = value?.trim();
  return key && key.length > 0 ? key : fallback;
};

export default registerAs('leaderboard', () => ({
  limit: parsePositiveInt(process.env.LEADERBOARD_LIMIT, 10),
  keys: {
    oxy: normalizeRedisKey(process.env.LEADERBOARD_OXY_KEY, 'leaderboard:oxy'),
  },
}));
