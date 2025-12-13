import { z } from 'zod';
// NOTE: FixedPoint values are validated and stored as strings for serialization and transport.
//       For all calculations, convert to bigint internally and back to string for storage/IPC/validation.
export const FIXED_POINT_PATTERN = /^-?0x[0-9a-fA-F]+$/;

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

const FixedPointValueSchema = z
  .string()
  .regex(FIXED_POINT_PATTERN, 'Invalid fixed-point value');


export const SignalMetricsSchema = z.object({
  negentropy: z.number(),
  coherence: z.number(),
  velocity: z.number(),
  ts: z.number(),
  entropy: z.number(),
  phase: z.number().min(0),
  dominantHz: z.number(),
  harmonics: z.array(z.number()),
  magnitude: z.array(z.number()),
  throughput: z.number().optional(),
  loss: z.number().optional(),
  flowRate: z.number().optional(),
  fieldState: z.enum(['macro', 'balanced', 'defensive']).optional(),
});

export type SignalMetrics = z.infer<typeof SignalMetricsSchema>;

export const SimulationMetricsSchema = z.object({
  negentropy: FixedPointValueSchema,
  coherence: FixedPointValueSchema,
  velocity: FixedPointValueSchema,
  time: z.number(),
  entropy: FixedPointValueSchema,
  phase: FixedPointValueSchema.optional(),
  dominantHz: FixedPointValueSchema.optional(),
  harmonics: z.array(FixedPointValueSchema).optional(),
  magnitude: z.array(z.array(FixedPointValueSchema)).optional(),
  throughput: FixedPointValueSchema.optional(),
  loss: FixedPointValueSchema.optional(),
  flowRate: FixedPointValueSchema.optional(),
  fieldState: z.enum(['macro', 'balanced', 'defensive']).optional(),
});

export type SimulationMetrics = z.infer<typeof SimulationMetricsSchema>;

export const EdgeMetricsSchema = z.object({
  entropy: FixedPointValueSchema,
  negentropy: FixedPointValueSchema,
  coherence: FixedPointValueSchema,
  velocity: FixedPointValueSchema,
  policy: z.enum(['macro', 'balanced', 'defensive']),
  loss: FixedPointValueSchema.optional(),
  regime: z.enum(['chaos', 'transitional', 'coherent']).optional(),
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
