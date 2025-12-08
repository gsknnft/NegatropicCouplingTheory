/**
 * IPC Input Validation using Zod
 * 
 * Validates all IPC inputs to prevent security vulnerabilities
 * and ensure type safety at runtime
 */

import { z } from 'zod';

// Signal Frame validation schema
export const SignalFrameSchema = z.object({
  coherence: z.number().min(0).max(1),
  entropy: z.number().min(0).max(1),
  phase: z.number(),
  dominantHz: z.number().nonnegative(),
  harmonics: z.array(z.number()),
  magnitude: z.array(z.number()),
});

// Field State validation schema
export const FieldStateSchema = z.object({
  locked: z.boolean(),
  strength: z.number().min(0).max(1),
  regime: z.enum(['chaos', 'transitional', 'coherent']),
  phaseAlignment: z.number().min(0).max(1),
});

// Decision Params validation schema
export const DecisionParamsSchema = z.object({
  minCoherence: z.number().min(0).max(1).optional(),
  maxEntropy: z.number().min(0).max(1).optional(),
  minPhaseLock: z.number().min(0).max(1).optional(),
  requireFieldLock: z.boolean().optional(),
});

// Base confidence validation for quantum measurement
export const BaseConfidenceSchema = z.number().min(0).max(1);

// Validation error class
export class ValidationError extends Error {
  constructor(message: string, public issues: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate IPC input with a Zod schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  operationName: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const issues = result.error.issues;
    const message = `Invalid input for ${operationName}: ${issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
    throw new ValidationError(message, issues);
  }
  
  return result.data;
}

/**
 * Rate limiter for IPC calls
 */
export class IPCRateLimiter {
  private callCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxCalls: number;

  constructor(maxCallsPerSecond: number, windowMs: number = 1000) {
    this.maxCalls = maxCallsPerSecond;
    this.windowMs = windowMs;
  }

  /**
   * Check if the channel is rate limited
   * Returns true if allowed, false if rate limited
   */
  check(channel: string): boolean {
    const now = Date.now();
    const record = this.callCounts.get(channel);

    if (!record || now >= record.resetTime) {
      // Start new window
      this.callCounts.set(channel, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxCalls) {
      // Rate limited
      return false;
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Reset rate limit for a channel
   */
  reset(channel: string): void {
    this.callCounts.delete(channel);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.callCounts.clear();
  }
}
