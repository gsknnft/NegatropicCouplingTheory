// FixedPoint helpers for renderer (pure TypeScript)
import { bigintToHex, hexToBigint } from './utils';

export type FixedPoint = string;
export const FIXED_POINT_DECIMALS = 9;
export const ZERO_FIXED_POINT: FixedPoint = '0x0';


export function toFixedPoint(value: number, decimals: number = FIXED_POINT_DECIMALS): FixedPoint {
  if (!Number.isFinite(value)) return ZERO_FIXED_POINT;
  const scale = BigInt(10 ** decimals);
  const scaled = BigInt(Math.round(value * Number(scale)));
  return scaled.toString();
}

export function fromFixedPoint(value?: string, decimals: number = FIXED_POINT_DECIMALS): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (trimmed.length === 0) return 0;
  const isNegative = trimmed.startsWith('-');
  const body = isNegative ? trimmed.slice(1) : trimmed;
  const bigValue = isNegative ? -BigInt(body) : BigInt(body);
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

export const FIXED_POINT_PATTERN = /^-?0x[0-9a-f]+$/i;

const normalizeHex = (value: string): string =>
  value.startsWith("0x") || value.startsWith("0X") ? value : `0x${value}`;

export const toHexString = (value: bigint): string => {
  if (value === 0n) {
    return ZERO_FIXED_POINT;
  }
  const isNegative = value < 0n;
  const absValue = isNegative ? -value : value;
  const hexValue = bigintToHex(absValue);
  return `${isNegative ? "-" : ""}0x${hexValue}`;
};

export const toBigIntValue = (value?: string): bigint => {
  if (!value) {
    return 0n;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return 0n;
  }
  const isNegative = trimmed.startsWith("-");
  const body = isNegative ? trimmed.slice(1) : trimmed;
  const normalized = normalizeHex(body);
  const bigValue = hexToBigint(normalized);
  return isNegative ? -bigValue : bigValue;
};


export function fixedPointToBigInt(value?: string): bigint {
  return toBigIntValue(value);
}

export type BindingsLoader = (
  opts: { bindings: string; module_root: string } | string
) => unknown;
