import { registerAs } from '@nestjs/config';

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePositiveFloat = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default registerAs('pvp', () => ({
  matchmakingMinRatio: parsePositiveFloat(
    process.env.PVP_MATCHMAKING_MIN_RATIO,
    0.8,
  ),
  matchmakingMaxRatio: parsePositiveFloat(
    process.env.PVP_MATCHMAKING_MAX_RATIO,
    1.2,
  ),
  fallbackLowMaxRatio: parsePositiveFloat(
    process.env.PVP_MATCHMAKING_LOWEST_MAX_RATIO,
    2,
  ),
  fallbackTopMinRatio: parsePositiveFloat(
    process.env.PVP_MATCHMAKING_TOP_MIN_RATIO,
    0.5,
  ),
  fallbackGlobalMinRatio: parsePositiveFloat(
    process.env.PVP_MATCHMAKING_GLOBAL_MIN_RATIO,
    0.5,
  ),
  fallbackGlobalMaxRatio: parsePositiveFloat(
    process.env.PVP_MATCHMAKING_GLOBAL_MAX_RATIO,
    2,
  ),
  regularTargetCount: parsePositiveInt(process.env.PVP_REGULAR_TARGET_COUNT, 4),
  defenderTargetCount: parsePositiveInt(
    process.env.PVP_DEFENDER_TARGET_COUNT,
    1,
  ),
  historyDefaultLimit: parsePositiveInt(
    process.env.PVP_HISTORY_DEFAULT_LIMIT,
    30,
  ),
  historyMaxLimit: parsePositiveInt(process.env.PVP_HISTORY_MAX_LIMIT, 100),
  otGrininiUnlockDefenseCount: parsePositiveInt(
    process.env.PVP_OT_GRININI_UNLOCK_DEFENSE_COUNT,
    20,
  ),
  passiveBlockMaxChance: parsePositiveFloat(
    process.env.PVP_PASSIVE_BLOCK_MAX_CHANCE,
    0.2,
  ),
  thoNhuongDefenseBonusChance: parsePositiveFloat(
    process.env.PVP_THO_NHUONG_DEFENSE_BONUS_CHANCE,
    0.05,
  ),
}));
