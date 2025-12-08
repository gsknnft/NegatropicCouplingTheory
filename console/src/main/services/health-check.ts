/**
 * Health Check System
 * 
 * Monitors system health and quantum adapter status
 */

import log from 'electron-log/main';
import http from 'node:http';
import { performanceMetrics } from './performance-metrics';
import { errorTracker } from './error-tracker';

export interface HealthStatus {
  healthy: boolean;
  checks: {
    quantumAdapter: boolean;
    apiServer: boolean;
    memory: boolean;
    cpu: boolean;
    errorRate: boolean;
  };
  metrics: {
    memoryUsage: number;
    memoryLimit: number;
    errorCount: number;
    avgResponseTime: number;
  };
  timestamp: string;
}

/**
 * Check if API server is responding
 */
async function checkApiHealth(port: string | number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Check memory usage
 */
function checkMemoryHealth(): { healthy: boolean; usage: number; limit: number } {
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const limitMB = 500; // 500MB limit
  
  return {
    healthy: heapUsedMB < limitMB,
    usage: heapUsedMB,
    limit: limitMB,
  };
}

/**
 * Check error rate
 */
function checkErrorRate(): { healthy: boolean; count: number } {
  const stats = errorTracker.getStats();
  const threshold = 10; // Max 10 errors in recent period
  
  return {
    healthy: stats.recentCount < threshold,
    count: stats.recentCount,
  };
}

/**
 * Calculate average response time
 */
function getAverageResponseTime(): number {
  const operations = performanceMetrics.getOperations();
  
  if (operations.length === 0) return 0;
  
  let totalAvg = 0;
  let count = 0;
  
  for (const op of operations) {
    const avg = performanceMetrics.getAverage(op);
    if (avg > 0) {
      totalAvg += avg;
      count++;
    }
  }
  
  return count > 0 ? totalAvg / count : 0;
}

/**
 * Perform comprehensive health check
 */
export async function checkSystemHealth(
  quantumAdapter: any,
  apiPort: string | number
): Promise<HealthStatus> {
  const memoryCheck = checkMemoryHealth();
  const errorCheck = checkErrorRate();
  const avgResponseTime = getAverageResponseTime();
  
  const checks = {
    quantumAdapter: quantumAdapter !== null,
    apiServer: await checkApiHealth(apiPort),
    memory: memoryCheck.healthy,
    cpu: true, // Basic check - always true for now
    errorRate: errorCheck.healthy,
  };
  
  const healthy = Object.values(checks).every(Boolean);
  
  const status: HealthStatus = {
    healthy,
    checks,
    metrics: {
      memoryUsage: memoryCheck.usage,
      memoryLimit: memoryCheck.limit,
      errorCount: errorCheck.count,
      avgResponseTime,
    },
    timestamp: new Date().toISOString(),
  };
  
  if (!healthy) {
    log.warn('Health check failed:', status);
  }
  
  return status;
}

/**
 * Start periodic health checks
 */
export function startHealthMonitoring(
  quantumAdapter: any,
  apiPort: string | number,
  intervalMs: number = 60000 // Check every minute
): NodeJS.Timeout {
  log.info('Starting health monitoring...');
  
  const interval = setInterval(async () => {
    const status = await checkSystemHealth(quantumAdapter, apiPort);
    
    if (!status.healthy) {
      log.error('System unhealthy:', {
        checks: status.checks,
        metrics: status.metrics,
      });
    }
  }, intervalMs);
  
  return interval;
}
