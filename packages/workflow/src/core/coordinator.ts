import { EventEmitter } from 'events';
import {
  BlockDescriptor,
  BlockRuntime,
  getErrorMessage,
  RunContext,
  Logger,
  BlockState,
  CoordinatorEvents
} from '@workflow-tool/shared';

export class FlowCoordinator extends EventEmitter {
  private blocks = new Map<string, BlockDescriptor>();
  private instances = new Map<string, BlockRuntime>();
  private states = new Map<string, BlockState>();
  private connections = new Map<string, Set<{ blockId: string; port: string }>>();
  private abortController = new AbortController();

  constructor(
    private flowId: string,
    private logger: Logger
  ) {
    super();
  }

  registerBlock(blockId: string, descriptor: BlockDescriptor): void {
    this.blocks.set(blockId, descriptor);
    this.states.set(blockId, {
      id: blockId,
      status: 'idle'
    });
  }

  addConnection(from: { blockId: string; port: string }, to: { blockId: string; port: string }): void {
    const key = `${from.blockId}:${from.port}`;
    if (!this.connections.has(key)) {
      this.connections.set(key, new Set());
    }
    this.connections.get(key)!.add(to);
  }

  async initializeBlocks(configs: Record<string, any>): Promise<void> {
    for (const [blockId, descriptor] of this.blocks) {
      try {
        const BlockClass = descriptor.blockClass;
        const instance = new BlockClass();

        const config = configs[blockId] || {};
        const ctx = this.createRunContext(blockId);

        if (instance.init) {
          await instance.init(config, ctx);
        }

        this.instances.set(blockId, instance);
        this.logger.debug(`Initialized block: ${blockId}`);
      } catch (error) {
        this.logger.error(`Failed to initialize block ${blockId}: ${getErrorMessage(error)}`);
        throw error;
      }
    }
  }

  async invokeBlock(blockId: string, port: string, message: unknown): Promise<void> {
    const instance = this.instances.get(blockId);
    const state = this.states.get(blockId);

    if (!instance || !state) {
      throw new Error(`Block not found: ${blockId}`);
    }

    try {
      state.status = 'running';
      state.lastRun = Date.now();
      this.emit('block:started', { blockId });

      const ctx = this.createRunContext(blockId);
      const result = await instance.onInvoke(port, message, ctx);

      if (result.error) {
        throw new Error(result.error.toString());
      }

      if (result.out) {
        // Отправляем результаты на подключенные блоки
        for (const [outPort, data] of Object.entries(result.out)) {
          await this.routeMessage(blockId, outPort, data);
        }
      }

      state.status = 'completed';
      this.emit('block:completed', { blockId, result });

    } catch (error) {
      state.status = 'error';
      state.errorMessage = getErrorMessage(error);
      this.emit('block:error', { blockId, error: getErrorMessage(error) });
      throw error;
    }
  }

  private async routeMessage(fromBlockId: string, fromPort: string, data: unknown): Promise<void> {
    const key = `${fromBlockId}:${fromPort}`;
    const targets = this.connections.get(key);

    if (!targets) {
      return;
    }

    for (const target of targets) {
      try {
        await this.invokeBlock(target.blockId, target.port, data);
      } catch (error) {
        this.logger.error(`Failed to route message to ${target.blockId}:${target.port}: ${getErrorMessage(error)}`);
      }
    }
  }

  private createRunContext(blockId: string): RunContext {
    return {
      logger: this.logger,
      env: process.env,
      emit: (port: string, data: unknown) => {
        this.routeMessage(blockId, port, data).catch(error => {
          this.logger.error(`Failed to emit from ${blockId}:${port}: ${getErrorMessage(error)}`);
        });
      },
      cancelToken: this.abortController.signal,
      flowId: this.flowId,
      blockId
    };
  }

  async dispose(): Promise<void> {
    this.abortController.abort();

    for (const [blockId, instance] of this.instances) {
      try {
        if (instance.dispose) {
          await instance.dispose();
        }
      } catch (error) {
        this.logger.error(`Failed to dispose block ${blockId}: ${getErrorMessage(error)}`);
      }
    }

    this.instances.clear();
    this.blocks.clear();
    this.states.clear();
    this.connections.clear();
  }

  getBlockStates(): BlockState[] {
    return Array.from(this.states.values());
  }
}
