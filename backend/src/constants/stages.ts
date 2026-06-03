export const MAX_ECOSYSTEM_STAGE = 400;

export function calcEcosystemStage(growth: number): number {
  return Math.min(Math.max(Math.floor(growth / 6) + 1, 1), MAX_ECOSYSTEM_STAGE);
}
