export interface BlockState {
  id: string;
  status: 'idle' | 'running' | 'error' | 'completed';
  lastRun?: number;
  errorMessage?: string;
}

export interface CoordinatorEvents {
  'block:started': { blockId: string };
  'block:completed': { blockId: string; result: unknown };
  'block:error': { blockId: string; error: string };
  'flow:started': { flowId: string };
  'flow:completed': { flowId: string };
  'flow:error': { flowId: string; error: string };
}
