/**
 * Quantum Decision History Tracker
 * 
 * Tracks decision history for analysis and debugging
 */

import log from 'electron-log/main';
import type { SignalFrame } from '../../../shared';
import { SwapDecision } from '../components/quantumAdapter';

export interface DecisionHistoryEntry {
  id: string;
  timestamp: number;
  timestampISO: string;
  decision: SwapDecision;
  signal: SignalFrame;
  fieldState: any;
  metadata?: Record<string, any>;
}

export interface DecisionStats {
  totalDecisions: number;
  executedCount: number;
  rejectedCount: number;
  averageConfidence: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  recentDecisions: number;
}

/**
 * Decision History Manager
 */
export class DecisionHistory {
  private history: DecisionHistoryEntry[] = [];
  private readonly maxHistory: number;
  private idCounter = 0;

  constructor(maxHistory: number = 1000) {
    this.maxHistory = maxHistory;
    log.info(`Decision history initialized with max size: ${maxHistory}`);
  }

  /**
   * Add a decision to history
   */
  add(
    decision: SwapDecision,
    signal: SignalFrame,
    fieldState: any,
    metadata?: Record<string, any>
  ): DecisionHistoryEntry {
    const entry: DecisionHistoryEntry = {
      id: `decision-${++this.idCounter}`,
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      decision,
      signal,
      fieldState,
      metadata,
    };

    this.history.push(entry);

    // Keep only last N entries
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return entry;
  }

  /**
   * Get all history
   */
  getAll(): DecisionHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get recent history (last N entries)
   */
  getRecent(count: number = 10): DecisionHistoryEntry[] {
    return this.history.slice(-count);
  }

  /**
   * Get history within time range
   */
  getInTimeRange(startTime: number, endTime: number): DecisionHistoryEntry[] {
    return this.history.filter(
      entry => entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Get decisions by execution status
   */
  getByExecutionStatus(execute: boolean): DecisionHistoryEntry[] {
    return this.history.filter(entry => entry.decision.execute === execute);
  }

  /**
   * Get statistics
   */
  getStats(): DecisionStats {
    if (this.history.length === 0) {
      return {
        totalDecisions: 0,
        executedCount: 0,
        rejectedCount: 0,
        averageConfidence: 0,
        highConfidenceCount: 0,
        mediumConfidenceCount: 0,
        lowConfidenceCount: 0,
        recentDecisions: 0,
      };
    }

    const executedCount = this.history.filter(e => e.decision.execute).length;
    const rejectedCount = this.history.length - executedCount;

    const totalConfidence = this.history.reduce(
      (sum, e) => sum + e.decision.confidence,
      0
    );
    const averageConfidence = totalConfidence / this.history.length;

    const highConfidenceCount = this.history.filter(
      e => e.decision.confidence > 0.7
    ).length;
    const mediumConfidenceCount = this.history.filter(
      e => e.decision.confidence >= 0.4 && e.decision.confidence <= 0.7
    ).length;
    const lowConfidenceCount = this.history.filter(
      e => e.decision.confidence < 0.4
    ).length;

    // Count decisions in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentDecisions = this.history.filter(
      e => e.timestamp > fiveMinutesAgo
    ).length;

    return {
      totalDecisions: this.history.length,
      executedCount,
      rejectedCount,
      averageConfidence,
      highConfidenceCount,
      mediumConfidenceCount,
      lowConfidenceCount,
      recentDecisions,
    };
  }

  /**
   * Export history as JSON
   */
  export(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Export recent history
   */
  exportRecent(count: number = 100): string {
    return JSON.stringify(this.getRecent(count), null, 2);
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.idCounter = 0;
    log.info('Decision history cleared');
  }

  /**
   * Get history size
   */
  size(): number {
    return this.history.length;
  }

  /**
   * Find decisions by signal characteristics
   */
  findBySignalCharacteristics(criteria: {
    minCoherence?: number;
    maxCoherence?: number;
    minEntropy?: number;
    maxEntropy?: number;
  }): DecisionHistoryEntry[] {
    return this.history.filter(entry => {
      const { coherence, entropy } = entry.signal;
      
      if (criteria.minCoherence !== undefined && coherence < criteria.minCoherence) {
        return false;
      }
      if (criteria.maxCoherence !== undefined && coherence > criteria.maxCoherence) {
        return false;
      }
      if (criteria.minEntropy !== undefined && entropy < criteria.minEntropy) {
        return false;
      }
      if (criteria.maxEntropy !== undefined && entropy > criteria.maxEntropy) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get confidence distribution
   */
  getConfidenceDistribution(): {
    bins: { min: number; max: number; count: number }[];
  } {
    const bins = [
      { min: 0, max: 0.2, count: 0 },
      { min: 0.2, max: 0.4, count: 0 },
      { min: 0.4, max: 0.6, count: 0 },
      { min: 0.6, max: 0.8, count: 0 },
      { min: 0.8, max: 1.0, count: 0 },
    ];

    for (const entry of this.history) {
      const confidence = entry.decision.confidence;
      const bin = bins.find(b => confidence >= b.min && confidence <= b.max);
      if (bin) {
        bin.count++;
      }
    }

    return { bins };
  }
}

// Global decision history instance
export const decisionHistory = new DecisionHistory(1000);
