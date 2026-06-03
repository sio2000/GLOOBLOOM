/** Shared visual scale for mobile flying + trunk insects. */
export function mobileInsectScale(stage: number, growth: number, mul = 1): number {
  const flowerRef = 0.75 + stage * 0.02 + growth * 0.0015;
  return flowerRef * 4.5 * mul;
}
