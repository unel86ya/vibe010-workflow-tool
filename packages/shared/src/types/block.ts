export type PortDirection = 'in' | 'out' | 'error';
export type BlockKind = 'event' | 'effect' | 'compute';

export interface PortDescriptor<T = unknown> {
  name: string;
  direction: PortDirection;
  schema?: object; // JSON Schema
  description?: string;
  required?: boolean;
}

export interface BlockMeta {
  id: string;
  title: string;
  version: string;
  description?: string;
  keywords?: string[];
  author?: string;
  icon?: string;
}

export interface BlockConfig {
  [key: string]: unknown;
}

export interface BlockDescriptor {
  meta: BlockMeta;
  kind: BlockKind;
  ports: PortDescriptor[];
  configSchema?: object;
  sideEffects?: boolean;
}
