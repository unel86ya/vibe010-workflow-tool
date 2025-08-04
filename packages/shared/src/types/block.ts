import type { JSONSchema7 } from 'json-schema';
import type { BlockRuntime } from "./runtime";

export type PortDirection = 'in' | 'out' | 'error';
export type BlockKind = 'event' | 'effect' | 'compute';

export interface PortDescriptor<T = unknown> {
  name: string;
  direction: PortDirection;
  schema?: JSONSchema7;
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
  filePath: string;
}

export interface BlockConfig {
  [key: string]: unknown;
}

export interface BlockDescriptor {
  meta: BlockMeta;
  kind: BlockKind;
  ports: PortDescriptor[];
  configSchema?: JSONSchema7;
  sideEffects?: boolean;
  blockClass?: new (...args: any[]) => BlockRuntime;
}
