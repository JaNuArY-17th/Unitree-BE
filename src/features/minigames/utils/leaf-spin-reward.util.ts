export function computeLeafSpinReward(rawLeafAmount: number): number {
  if (!Number.isFinite(rawLeafAmount) || rawLeafAmount <= 0) {
    return 0;
  }

  // Placeholder formula for future balancing.
  return Math.floor(rawLeafAmount);
}
