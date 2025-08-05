import {
  getErrorMessage,
  toError,
  FlowDefinition,
  FlowConfig,
  BlockDescriptor,
  Logger
} from '@workflow-tool/shared';
import { FlowCoordinator } from './coordinator';

export class FlowEngine {
  private registeredBlocks = new Map<string, BlockDescriptor>();
  private runningFlows = new Map<string, FlowCoordinator>();

  constructor(private logger: Logger) {}

  registerBlock(descriptor: BlockDescriptor): void {
    this.registeredBlocks.set(descriptor.meta.id, descriptor);
    this.logger.debug(`Registered block: ${descriptor.meta.id}`);
  }

  public async runFlow(flow: FlowDefinition, config: FlowConfig = {}): Promise<void> {
    const flowId = `${flow.name}-${Date.now()}`;
    this.logger.info(`🚀 Starting flow: ${flow.name} (${flowId})`);

    const coordinator = new FlowCoordinator(flowId, this.logger);
    this.runningFlows.set(flowId, coordinator);

    // 1) Регистрируем блокы
    for (const [blockId, blockConfig] of Object.entries(flow.blocks)) {
      const descriptor = this.registeredBlocks.get(blockConfig.type)!;
      coordinator.registerBlock(blockId, descriptor);
    }

    // 2) Создаём без init
    const blockConfigs = Object.fromEntries(
      Object.entries(flow.blocks).map(([id, blk]) => [id, blk.config || {}])
    );
    coordinator.createInstances(blockConfigs);

    // 3) Регистрируем соединения
    this.logger.debug(`Registering ${flow.connections.length} connections...`);
    for (const conn of flow.connections) {
      coordinator.addConnection(
        { blockId: conn.from.block, port: conn.from.port },
        { blockId: conn.to.block, port: conn.to.port }
      );
    }
    this.logger.debug(`All connections registered successfully`);

    // 4) Инициализируем ВСЕ блоки
    await coordinator.initializeInstances(blockConfigs);

    // 5) Ждём завершения
    await this.waitForCompletion(coordinator, config.timeout);
  }


  private async startEventBlocks(coordinator: FlowCoordinator, flow: FlowDefinition): Promise<void> {
    for (const [blockId, blockConfig] of Object.entries(flow.blocks)) {
      const descriptor = this.registeredBlocks.get(blockConfig.type);
      if (descriptor?.kind === 'event') {
        // Event блоки стартуют сами при инициализации
        this.logger.debug(`Event block ${blockId} will start automatically`);
      }
    }
  }

  private async waitForCompletion(coordinator: FlowCoordinator, timeout?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      if (timeout) {
        timeoutId = setTimeout(() => {
          reject(new Error(`Flow timeout after ${timeout}ms`));
        }, timeout);
      }

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };

      coordinator.on('flow:completed', () => {
        cleanup();
        resolve();
      });

      coordinator.on('flow:error', ({ error }) => {
        cleanup();
        reject(new Error(error));
      });

      // Обработка Ctrl+C
      process.on('SIGINT', () => {
        cleanup();
        this.logger.info('Received SIGINT, stopping flow...');
        resolve();
      });
    });
  }

  async stopFlow(flowId: string): Promise<void> {
    const coordinator = this.runningFlows.get(flowId);
    if (coordinator) {
      await coordinator.dispose();
      this.runningFlows.delete(flowId);
      this.logger.info(`Stopped flow: ${flowId}`);
    }
  }

  getRegisteredBlocks(): BlockDescriptor[] {
    return Array.from(this.registeredBlocks.values());
  }

  getRunningFlows(): string[] {
    return Array.from(this.runningFlows.keys());
  }
}
