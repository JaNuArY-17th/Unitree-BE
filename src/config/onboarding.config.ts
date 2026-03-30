import { registerAs } from '@nestjs/config';

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export default registerAs('onboarding', () => ({
  starterLeafAmount: parsePositiveInt(
    process.env.NEW_USER_STARTER_LEAF_AMOUNT,
    100,
  ),
  starterLeafResourceCode:
    process.env.NEW_USER_STARTER_LEAF_RESOURCE_CODE || 'GREEN_LEAF',
}));
