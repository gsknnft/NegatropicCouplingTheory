/**
 * Error Tracking and Telemetry
 * 
 * Tracks errors, exceptions, and performance issues
 * for debugging and monitoring
 */

import log from 'electron-log/main';

export interface ErrorContext {
  operation: string;
  channel?: string;
  metadata?: Record<string, any>;
  userId?: string;
  timestamp: string;
}

export interface ErrorRecord {
  error: Error;
  context: ErrorContext;
  stackTrace?: string;
}

/**
 * Error Tracker for monitoring application health
 */
export class ErrorTracker {
  private errors: ErrorRecord[] = [];
  private readonly maxErrors = 100;

  /**
   * Track an error with context
   */
  track(error: Error, context: Omit<ErrorContext, 'timestamp'>): void {
    const record: ErrorRecord = {
      error,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      stackTrace: error.stack,
    };

    // Add to history
    this.errors.push(record);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log the error
    log.error('Error tracked:', {
      message: error.message,
      operation: context.operation,
      channel: context.channel,
      metadata: context.metadata,
      stack: error.stack,
    });

    // In production, you could send to external service like Sentry
    // this.sendToExternalService(record);
  }

  /**
   * Track an IPC error
   */
  trackIPCError(error: Error, channel: string, args?: any[]): void {
    this.track(error, {
      operation: 'IPC Handler',
      channel,
      metadata: { args },
    });
  }

  /**
   * Track a quantum operation error
   */
  trackQuantumError(error: Error, operation: string, params?: any): void {
    this.track(error, {
      operation: `Quantum: ${operation}`,
      metadata: { params },
    });
  }

  /**
   * Get error history
   */
  getErrors(): ErrorRecord[] {
    return [...this.errors];
  }

  /**
   * Get errors by operation
   */
  getErrorsByOperation(operation: string): ErrorRecord[] {
    return this.errors.filter(e => e.context.operation === operation);
  }

  /**
   * Get recent errors (last N)
   */
  getRecentErrors(count: number = 10): ErrorRecord[] {
    return this.errors.slice(-count);
  }

  /**
   * Clear error history
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byOperation: Record<string, number>;
    recentCount: number;
  } {
    const byOperation: Record<string, number> = {};
    
    for (const record of this.errors) {
      const op = record.context.operation;
      byOperation[op] = (byOperation[op] || 0) + 1;
    }

    // Count errors in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentCount = this.errors.filter(e => {
      const timestamp = new Date(e.context.timestamp).getTime();
      return timestamp > fiveMinutesAgo;
    }).length;

    return {
      total: this.errors.length,
      byOperation,
      recentCount,
    };
  }

  /**
   * Send error to external service (placeholder)
   */
  private sendToExternalService(record: ErrorRecord): void {
    // In production, integrate with Sentry, Rollbar, or similar
    // Example:
    // Sentry.captureException(record.error, {
    //   extra: record.context,
    // });
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();
