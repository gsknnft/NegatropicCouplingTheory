/**
 * Telemetry event types and schemas
 * Designed for SigilNet/QVera integration hooks
 */


/**
 * Base event structure with lineage tracking
 */
export interface BaseEvent {
  /** Event type identifier */
  type: string
  /** ISO timestamp */
  timestamp: string
  /** Correlation ID for tracing */
  correlationId: string
  /** Agent ID */
  agentId: string
  /** Optional task ID */
  taskId?: string
  /** Provenance metadata */
  provenance: Record<string, string>
}


/**
 * Payment failed event
 */
export interface FailedEvent extends BaseEvent {
  type: 'payload.failed'
  payload: {
    vendor: string
    payload: string
    data: any
    endpoint: string
    error: Error | string
    retryCount: number
  }
}

/**
 * Action started event
 */
export interface ActionStartedEvent extends BaseEvent {
  type: 'action.started'
  payload: {
    actionType: string
    input: unknown
    estimatedCost?: number
  }
}

/**
 * Action completed event
 */
export interface ActionCompletedEvent extends BaseEvent {
  type: 'action.completed'
  payload: {
    actionType: string
    output: unknown
    actualCost: number
    duration: number
    success: boolean
  }
}

/**
 * SLA outcome event
 */
export interface SLAOutcomeEvent extends BaseEvent {
  type: 'sla.outcome'
  payload: {
    vendor: string
    endpoint: string
    expectedLatency?: number
    actualLatency: number
    success: boolean
  }
}

/**
 * Budget delta event
 */
export interface BudgetDeltaEvent extends BaseEvent {
  type: 'payload.delta'
  payload: {
    previousPayload: number
    newPayloadRemaining: number
    delta: number
    spent: number
    remaining: number
  }
}

/**
 * Agent halted event
 */
export interface AgentHaltedEvent extends BaseEvent {
  type: 'agent.halted'
  payload: {
    reason: 'payload_exhausted' | 'policy_violation' | 'consecutive_failures' | 'manual'
    details: string
  }
}

export type SigilRole = 'agent' | 'vendor' | 'hub' | 'goal' | 'observer' | 'other'

export interface SigilEndpoint {
  id: string
  label?: string
  role?: SigilRole
}

export interface SigilTransferEvent extends BaseEvent {
  type: 'sigil.transfer'
  payload: {
    tokenId: string
    sequence: number
    from: SigilEndpoint | null
    to: SigilEndpoint
    intent: string
    narrative?: string
    meta?: Record<string, unknown>
  }
}

/**
 * Union of all event types
 */
export type TelemetryEvent =
  | FailedEvent
  | ActionStartedEvent
  | ActionCompletedEvent
  | SLAOutcomeEvent
  | BudgetDeltaEvent
  | AgentHaltedEvent
  | SigilTransferEvent

/**
 * Telemetry sink interface - pluggable event destinations
 */
export interface TelemetrySink {
  /**
   * Emit an event to this sink
   */
  emit(event: TelemetryEvent): Promise<void>
  
  /**
   * Flush any buffered events
   */
  flush(): Promise<void>
  
  /**
   * Close the sink
   */
  close(): Promise<void>
}

/**
 * SigilNet sink configuration (stub for future integration)
 */
export interface SigilNetSinkConfig {
  /** SigilNet gateway endpoint */
  endpoint: string
  /** Authentication token */
  authToken?: string
  /** Field closure parameters */
  fieldParams?: {
    /** Negentropy tracking enabled */
    negentropyEnabled: boolean
    /** Trust diffusion enabled */
    trustDiffusionEnabled: boolean
  }
  /** Whether to enable categorical bridge */
  categoricalBridge?: boolean
}
