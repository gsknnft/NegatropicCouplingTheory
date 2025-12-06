import { Complex } from './types/types';


export function toComplexArray(arr: number[]): Complex[] {
  return arr.map((val) => [val, 0] as Complex);
}

export function add(a: Complex, b: Complex): Complex {
  return [a[0] + b[0], a[1] + b[1]];
}

export function subtract(a: Complex, b: Complex): Complex {
  return [a[0] - b[0], a[1] - b[1]];
}

export function multiply(a: Complex, b: Complex): Complex {
  return [
    a[0] * b[0] - a[1] * b[1],
    a[0] * b[1] + a[1] * b[0]
  ];
}

export function magnitude(c: Complex): number {
  return Math.sqrt(c[0] ** 2 + c[1] ** 2);
}
