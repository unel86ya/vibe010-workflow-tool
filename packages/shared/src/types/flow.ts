export interface FlowConnection {
  from: {
    block: string;
    port: string;
  };
  to: {
    block: string;
    port: string;
  };
}

export interface FlowBlockConfig {
  type: string;
  config?: Record<string, unknown>;
}

export interface FlowDefinition {
  name: string;
  version?: string;
  description?: string;
  blocks: Record<string, FlowBlockConfig>;
  connections: FlowConnection[];
}

export interface FlowConfig {
  timeout?: number;
  maxRetries?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
