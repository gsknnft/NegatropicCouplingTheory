// FixedPoint helpers for renderer (pure TypeScript)
export type FixedPoint = string;
export const FIXED_POINT_DECIMALS = 9;
export const ZERO_FIXED_POINT: FixedPoint = '0x0';

export function toFixedPoint(value: number, decimals: number = FIXED_POINT_DECIMALS): FixedPoint {
  if (!Number.isFinite(value)) return ZERO_FIXED_POINT;
  const scale = BigInt(10 ** decimals);
  const scaled = BigInt(Math.round(value * Number(scale)));
  return scaled.toString();
}

export function fromFixedPoint(value?: FixedPoint, decimals: number = FIXED_POINT_DECIMALS): number {
  if (!value) return 0;
  const bigValue = BigInt(value);
  const scale = 10 ** decimals;
  return Number(bigValue) / scale;
}

export function addFixedPoint(a: FixedPoint, b: FixedPoint): FixedPoint {
  return (BigInt(a) + BigInt(b)).toString();
}

export function subtractFixedPoint(a: FixedPoint, b: FixedPoint): FixedPoint {
  return (BigInt(a) - BigInt(b)).toString();
}

export function averageFixedPoint(values: FixedPoint[]): FixedPoint {
  if (values.length === 0) return ZERO_FIXED_POINT;
  const sum = values.reduce((acc, v) => acc + BigInt(v), 0n);
  return (sum / BigInt(values.length)).toString();
}

export function compareFixedPoint(a: FixedPoint, b: FixedPoint): number {
  const diff = BigInt(a) - BigInt(b);
  if (diff === 0n) return 0;
  return diff > 0n ? 1 : -1;
}