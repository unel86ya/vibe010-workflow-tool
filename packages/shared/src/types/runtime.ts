import { BlockConfig } from "./block";

export interface InvokeResult {
  out?: Record<string, unknown>;
  error?: string | Error;
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface RunContext {
  logger: Logger;
  env: Record<string, string>;
  emit(port: string, data: unknown): void;
  cancelToken: AbortSignal;
  flowId: string;
  blockId: string;
}

export interface BlockRuntime {
  init?(config: BlockConfig, ctx: RunContext): Promise<void> | void;

  onInvoke(
    port: string,
    message: unknown,
    ctx: RunContext
  ): Promise<InvokeResult> | InvokeResult;

  dispose?(): Promise<void> | void;
}
