/**
 * Performance Metrics Tracking
 * 
 * Tracks operation durations and performance metrics
 * for monitoring and optimization
 */

import log from 'electron-log/main';

export interface MetricRecord {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Performance Metrics Tracker
 */
export class PerformanceMetrics {
  private metrics = new Map<string, MetricRecord[]>();
  private readonly maxRecordsPerOperation = 100;

  /**
   * Record a metric
   */
  record(
    operation: string,
    duration: number,
    success: boolean = true,
    metadata?: Record<string, any>
  ): void {
    const record: MetricRecord = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      metadata,
    };

    const records = this.metrics.get(operation) || [];
    records.push(record);
    
    // Keep only recent records
    if (records.length > this.maxRecordsPerOperation) {
      records.shift();
    }
    
    this.metrics.set(operation, records);

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      log.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
    }
  }

  /**
   * Time an async operation
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    let success = true;
    
    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      this.record(operation, duration, success, metadata);
    }
  }

  /**
   * Time a sync operation
   */
  timeSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const start = performance.now();
    let success = true;
    
    try {
      const result = fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      this.record(operation, duration, success, metadata);
    }
  }

  /**
   * Get average duration for an operation
   */
  getAverage(operation: string): number {
    const records = this.metrics.get(operation);
    if (!records || records.length === 0) return 0;
    
    const sum = records.reduce((acc, r) => acc + r.duration, 0);
    return sum / records.length;
  }

  /**
   * Get median duration for an operation
   */
  getMedian(operation: string): number {
    const records = this.metrics.get(operation);
    if (!records || records.length === 0) return 0;
    
    const sorted = [...records].sort((a, b) => a.duration - b.duration);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1].duration + sorted[mid].duration) / 2;
    }
    return sorted[mid].duration;
  }

  /**
   * Get 95th percentile duration
   */
  getP95(operation: string): number {
    const records = this.metrics.get(operation);
    if (!records || records.length === 0) return 0;
    
    const sorted = [...records].sort((a, b) => a.duration - b.duration);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index].duration;
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): {
    count: number;
    average: number;
    median: number;
    p95: number;
    min: number;
    max: number;
    successRate: number;
  } {
    const records = this.metrics.get(operation);
    if (!records || records.length === 0) {
      return {
        count: 0,
        average: 0,
        median: 0,
        p95: 0,
        min: 0,
        max: 0,
        successRate: 0,
      };
    }

    const durations = records.map(r => r.duration);
    const successCount = records.filter(r => r.success).length;

    return {
      count: records.length,
      average: this.getAverage(operation),
      median: this.getMedian(operation),
      p95: this.getP95(operation),
      min: Math.min(...durations),
      max: Math.max(...durations),
      successRate: successCount / records.length,
    };
  }

  /**
   * Get all operation names
   */
  getOperations(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get all stats
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};
    
    for (const operation of this.getOperations()) {
      result[operation] = this.getStats(operation);
    }
    
    return result;
  }

  /**
   * Clear metrics for an operation
   */
  clear(operation: string): void {
    this.metrics.delete(operation);
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.metrics.clear();
  }

  /**
   * Get recent metrics (last N records)
   */
  getRecent(operation: string, count: number = 10): MetricRecord[] {
    const records = this.metrics.get(operation);
    if (!records) return [];
    
    return records.slice(-count);
  }
}

// Global performance metrics instance
export const performanceMetrics = new PerformanceMetrics();
