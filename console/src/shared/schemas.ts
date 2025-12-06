import { z } from 'zod';

export const EdgeSchema = z.object({
  source: z.number().int().nonnegative(),
  target: z.number().int().nonnegative(),
});

export type Edge = z.infer<typeof EdgeSchema>;

export const ScenarioMetadataSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  version: z.string().optional(),
  date: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  sourcePath: z.string().optional(),
  format: z.string().optional(),
  checksum: z.string().optional(),
  sizeBytes: z.number().nonnegative().optional(),
  uploadedAt: z.string().optional(),
  sourceName: z.string().optional(),
});

export type ScenarioMetadata = z.infer<typeof ScenarioMetadataSchema>;

export const SimulationMetricsSchema = z.object({
  negentropy: z.number(),
  coherence: z.number(),
  velocity: z.number(),
  time: z.number(),
  entropy: z.number().optional(),
  throughput: z.number().optional(),
  flowRate: z.number().optional(),
  fieldState: z.enum(['macro', 'balanced', 'defensive']).optional(),
});

export type SimulationMetrics = z.infer<typeof SimulationMetricsSchema>;

export const EdgeMetricsSchema = z.object({
  entropy: z.number(),
  negentropy: z.number(),
  coherence: z.number(),
  velocity: z.number(),
  policy: z.enum(['macro', 'balanced', 'defensive']),
});

export type EdgeMetrics = z.infer<typeof EdgeMetricsSchema>;

export const AnomalySchema = z.object({
  timestamp: z.number(),
  type: z.enum(['classical', 'negentropic']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string(),
});

export type AnomalyDetection = z.infer<typeof AnomalySchema>;

const edgeMetricPayload = z.union([
  z.map(z.string(), EdgeMetricsSchema),
  z.record(EdgeMetricsSchema),
  z.array(z.tuple([z.string(), EdgeMetricsSchema])),
]);

export const SimulationStateSchema = z.object({
  nodes: z.number().int().nonnegative(),
  edges: z.array(EdgeSchema),
  time: z.number(),
  meshMetrics: SimulationMetricsSchema,
  edgeMetrics: edgeMetricPayload,
  history: z.array(SimulationMetricsSchema),
  scenarioMetadata: ScenarioMetadataSchema.optional(),
  anomalies: z.array(AnomalySchema).optional(),
});

export type SimulationStatePayload = z.infer<typeof SimulationStateSchema>;
