import { EventEmitter } from 'events';
import {
  BlockDescriptor,
  BlockRuntime,
  getErrorMessage,
  toError,
  RunContext,
  Logger,
  BlockState,
  CoordinatorEvents,
  mapToSafeEnv
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

  async createInstances(configs: Record<string, any>): Promise<void> {
    this.logger.info(`🔧 Creating ${this.blocks.size} blocks...`);

    for (const [blockId, descriptor] of this.blocks) {
      try {
        this.logger.debug(`🔧 Creating block: ${blockId} (${descriptor.kind})`);

        const BlockClass = descriptor.blockClass;
        const instance = new BlockClass!();
        this.instances.set(blockId, instance);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        this.logger.error(`❌ Failed to create block ${blockId}: ${errorMessage}`);
        throw toError(error);
      }
    }

    this.logger.info(`✅ All blocks created`);
  }

  // Вызывает init у всех экземпляров
  async initializeInstances(configs: Record<string, any>): Promise<void> {
    for (const [blockId, descriptor] of this.blocks) {
      const instance = this.instances.get(blockId)!;
      const config = configs[blockId] || {};
      const ctx = this.createRunContext(blockId);

      if (instance.init) {
        this.logger.debug(`🔧 Initializing block: ${blockId}`);
        await instance.init(config, ctx);
        this.logger.debug(`✅ Initialized block: ${blockId}`);
      }
    }
    this.logger.info(`✅ All blocks initialized`);
  }

  async invokeBlock(blockId: string, port: string, message: unknown): Promise<void> {
    this.logger.debug(`📨 Invoking ${blockId}:${port}`);
    this.logger.debug(`📨 Message:`, message);

    const instance = this.instances.get(blockId);
    const state = this.states.get(blockId);

    if (!instance || !state) {
      throw new Error(`Block not found: ${blockId}`);
    }

    try {
      state.status = 'running';
      state.lastRun = Date.now();
      this.emit('block:started', { blockId });
      this.logger.debug(`🏃 Block ${blockId} status: running`);

      const ctx = this.createRunContext(blockId);
      const result = await instance.onInvoke(port, message, ctx);

      this.logger.debug(`📤 Block ${blockId} result:`, result);

      if (result.error) {
        throw toError(result.error);
      }

      if (result.out) {
        this.logger.debug(`📡 Block ${blockId} emitting ${Object.keys(result.out).length} outputs`);
        // Отправляем результаты на подключенные блоки
        for (const [outPort, data] of Object.entries(result.out)) {
          this.logger.debug(`📡 Routing ${blockId}:${outPort} ->`, data);
          await this.routeMessage(blockId, outPort, data);
        }
      } else {
        this.logger.debug(`⚪ Block ${blockId} produced no output`);
      }

      state.status = 'completed';
      this.emit('block:completed', { blockId, result });
      this.logger.debug(`✅ Block ${blockId} completed successfully`);

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      state.status = 'error';
      state.errorMessage = errorMessage;
      this.logger.error(`❌ Block ${blockId} failed: ${errorMessage}`);
      this.emit('block:error', { blockId, error: errorMessage });
      throw toError(error);
    }
  }

  private async routeMessage(fromBlockId: string, fromPort: string, data: unknown): Promise<void> {
    const key = `${fromBlockId}:${fromPort}`;
    const targets = this.connections.get(key);

    if (!targets || targets.size === 0) {
      this.logger.debug(`📭 No targets for ${key}`);
      return;
    }

    this.logger.debug(`🔀 Routing ${key} to ${targets.size} targets`);

    for (const target of targets) {
      try {
        this.logger.debug(`🎯 Routing to ${target.blockId}:${target.port}`);
        await this.invokeBlock(target.blockId, target.port, data);
      } catch (error) {
        this.logger.error(`❌ Failed to route message to ${target.blockId}:${target.port}: ${getErrorMessage(error)}`);
      }
    }
  }

  private createRunContext(blockId: string): RunContext {
  return {
    logger: this.logger,
    env: mapToSafeEnv(process.env),
    emit: (port: string, data: unknown) => {
      this.logger.debug(`📤 Block ${blockId} emitting ${port}:`, data);
      this.routeMessage(blockId, port, data).catch(error => {
        this.logger.error(`❌ Failed to emit from ${blockId}:${port}: ${getErrorMessage(error)}`);
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
