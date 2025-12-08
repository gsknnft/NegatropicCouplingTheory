/**
 * Unit tests for Quantum IPC Handlers
 * 
 * Tests validation, error handling, and rate limiting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateInput,
  SignalFrameSchema,
  FieldStateSchema,
  DecisionParamsSchema,
  BaseConfidenceSchema,
  IPCRateLimiter,
  ValidationError,
} from '../main/services/validation';
import { errorTracker } from '../main/services/error-tracker';
import { performanceMetrics } from '../main/services/performance-metrics';

describe('Quantum IPC Validation', () => {
  describe('SignalFrameSchema', () => {
    it('should validate correct signal frame', () => {
      const validSignal = {
        coherence: 0.75,
        entropy: 0.35,
        phase: 1.5,
        dominantHz: 10.5,
        harmonics: [1, 2, 3],
        magnitude: [0.5, 0.3, 0.2],
      };

      expect(() => validateInput(SignalFrameSchema, validSignal, 'test')).not.toThrow();
    });

    it('should reject invalid coherence', () => {
      const invalidSignal = {
        coherence: 1.5, // Invalid: > 1
        entropy: 0.35,
        phase: 1.5,
        dominantHz: 10.5,
        harmonics: [1, 2, 3],
        magnitude: [0.5, 0.3, 0.2],
      };

      expect(() => validateInput(SignalFrameSchema, invalidSignal, 'test')).toThrow(ValidationError);
    });

    it('should reject negative entropy', () => {
      const invalidSignal = {
        coherence: 0.75,
        entropy: -0.1, // Invalid: < 0
        phase: 1.5,
        dominantHz: 10.5,
        harmonics: [1, 2, 3],
        magnitude: [0.5, 0.3, 0.2],
      };

      expect(() => validateInput(SignalFrameSchema, invalidSignal, 'test')).toThrow(ValidationError);
    });

    it('should reject missing required fields', () => {
      const invalidSignal = {
        coherence: 0.75,
        entropy: 0.35,
        // Missing phase, dominantHz, harmonics, magnitude
      };

      expect(() => validateInput(SignalFrameSchema, invalidSignal, 'test')).toThrow(ValidationError);
    });
  });

  describe('FieldStateSchema', () => {
    it('should validate correct field state', () => {
      const validField = {
        locked: true,
        strength: 0.8,
        regime: 'coherent' as const,
        phaseAlignment: 0.9,
      };

      expect(() => validateInput(FieldStateSchema, validField, 'test')).not.toThrow();
    });

    it('should accept all valid regime values', () => {
      const regimes = ['chaos', 'transitional', 'coherent'] as const;
      
      regimes.forEach(regime => {
        const validField = {
          locked: false,
          strength: 0.5,
          regime,
          phaseAlignment: 0.5,
        };
        
        expect(() => validateInput(FieldStateSchema, validField, 'test')).not.toThrow();
      });
    });

    it('should reject invalid regime', () => {
      const invalidField = {
        locked: true,
        strength: 0.8,
        regime: 'invalid',
        phaseAlignment: 0.9,
      };

      expect(() => validateInput(FieldStateSchema, invalidField, 'test')).toThrow(ValidationError);
    });
  });

  describe('DecisionParamsSchema', () => {
    it('should validate correct params', () => {
      const validParams = {
        minCoherence: 0.6,
        maxEntropy: 0.5,
        minPhaseLock: 0.5,
        requireFieldLock: false,
      };

      expect(() => validateInput(DecisionParamsSchema, validParams, 'test')).not.toThrow();
    });

    it('should allow partial params', () => {
      const partialParams = {
        minCoherence: 0.7,
      };

      expect(() => validateInput(DecisionParamsSchema, partialParams, 'test')).not.toThrow();
    });

    it('should reject invalid values', () => {
      const invalidParams = {
        minCoherence: 1.5, // Invalid: > 1
      };

      expect(() => validateInput(DecisionParamsSchema, invalidParams, 'test')).toThrow(ValidationError);
    });
  });

  describe('BaseConfidenceSchema', () => {
    it('should validate valid confidence', () => {
      expect(() => validateInput(BaseConfidenceSchema, 0.75, 'test')).not.toThrow();
      expect(() => validateInput(BaseConfidenceSchema, 0, 'test')).not.toThrow();
      expect(() => validateInput(BaseConfidenceSchema, 1, 'test')).not.toThrow();
    });

    it('should reject invalid confidence', () => {
      expect(() => validateInput(BaseConfidenceSchema, -0.1, 'test')).toThrow(ValidationError);
      expect(() => validateInput(BaseConfidenceSchema, 1.5, 'test')).toThrow(ValidationError);
    });
  });
});

describe('IPCRateLimiter', () => {
  let rateLimiter: IPCRateLimiter;

  beforeEach(() => {
    rateLimiter = new IPCRateLimiter(5); // 5 calls per second
  });

  it('should allow calls within rate limit', () => {
    expect(rateLimiter.check('test-channel')).toBe(true);
    expect(rateLimiter.check('test-channel')).toBe(true);
    expect(rateLimiter.check('test-channel')).toBe(true);
  });

  it('should block calls exceeding rate limit', () => {
    // Make 5 calls (max)
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.check('test-channel')).toBe(true);
    }
    
    // 6th call should be blocked
    expect(rateLimiter.check('test-channel')).toBe(false);
  });

  it('should track different channels independently', () => {
    // Make 5 calls to channel1
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.check('channel1')).toBe(true);
    }
    
    // Channel 2 should still be allowed
    expect(rateLimiter.check('channel2')).toBe(true);
  });

  it('should reset after time window', async () => {
    // Fill up the rate limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.check('test-channel');
    }
    
    expect(rateLimiter.check('test-channel')).toBe(false);
    
    // Wait for window to reset (1 second + buffer)
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should be allowed again
    expect(rateLimiter.check('test-channel')).toBe(true);
  });

  it('should allow manual reset', () => {
    // Fill up the rate limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.check('test-channel');
    }
    
    expect(rateLimiter.check('test-channel')).toBe(false);
    
    // Manual reset
    rateLimiter.reset('test-channel');
    
    // Should be allowed again
    expect(rateLimiter.check('test-channel')).toBe(true);
  });
});

describe('ErrorTracker', () => {
  beforeEach(() => {
    errorTracker.clear();
  });

  it('should track errors', () => {
    const error = new Error('Test error');
    errorTracker.track(error, { operation: 'test-op' });

    const errors = errorTracker.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].error.message).toBe('Test error');
    expect(errors[0].context.operation).toBe('test-op');
  });

  it('should track IPC errors', () => {
    const error = new Error('IPC error');
    errorTracker.trackIPCError(error, 'test-channel', ['arg1', 'arg2']);

    const errors = errorTracker.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].context.operation).toBe('IPC Handler');
    expect(errors[0].context.channel).toBe('test-channel');
  });

  it('should limit error history', () => {
    // Add more than max errors (100)
    for (let i = 0; i < 150; i++) {
      errorTracker.track(new Error(`Error ${i}`), { operation: 'test' });
    }

    const errors = errorTracker.getErrors();
    expect(errors.length).toBe(100);
  });

  it('should get errors by operation', () => {
    errorTracker.track(new Error('Error 1'), { operation: 'op1' });
    errorTracker.track(new Error('Error 2'), { operation: 'op2' });
    errorTracker.track(new Error('Error 3'), { operation: 'op1' });

    const op1Errors = errorTracker.getErrorsByOperation('op1');
    expect(op1Errors.length).toBe(2);
  });

  it('should get error statistics', () => {
    errorTracker.track(new Error('Error 1'), { operation: 'op1' });
    errorTracker.track(new Error('Error 2'), { operation: 'op2' });
    errorTracker.track(new Error('Error 3'), { operation: 'op1' });

    const stats = errorTracker.getStats();
    expect(stats.total).toBe(3);
    expect(stats.byOperation.op1).toBe(2);
    expect(stats.byOperation.op2).toBe(1);
  });
});

describe('PerformanceMetrics', () => {
  beforeEach(() => {
    performanceMetrics.clearAll();
  });

  it('should record metrics', () => {
    performanceMetrics.record('test-op', 100, true);
    performanceMetrics.record('test-op', 200, true);

    const stats = performanceMetrics.getStats('test-op');
    expect(stats.count).toBe(2);
    expect(stats.average).toBe(150);
  });

  it('should calculate statistics', () => {
    const durations = [100, 200, 300, 400, 500];
    durations.forEach(d => performanceMetrics.record('test-op', d, true));

    const stats = performanceMetrics.getStats('test-op');
    expect(stats.count).toBe(5);
    expect(stats.average).toBe(300);
    expect(stats.median).toBe(300);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(500);
  });

  it('should track success rate', () => {
    performanceMetrics.record('test-op', 100, true);
    performanceMetrics.record('test-op', 200, true);
    performanceMetrics.record('test-op', 300, false);

    const stats = performanceMetrics.getStats('test-op');
    expect(stats.successRate).toBeCloseTo(2 / 3);
  });

  it('should time async operations', async () => {
    const result = await performanceMetrics.time('test-op', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'done';
    });

    expect(result).toBe('done');
    
    const stats = performanceMetrics.getStats('test-op');
    expect(stats.count).toBe(1);
    expect(stats.average).toBeGreaterThan(90); // Should be around 100ms
  });

  it('should track errors in timed operations', async () => {
    try {
      await performanceMetrics.time('test-op', async () => {
        throw new Error('Test error');
      });
    } catch (error) {
      // Expected
    }

    const stats = performanceMetrics.getStats('test-op');
    expect(stats.count).toBe(1);
    expect(stats.successRate).toBe(0);
  });
});
