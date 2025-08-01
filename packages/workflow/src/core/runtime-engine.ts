import {
  getErrorMessage,
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

  async runFlow(flow: FlowDefinition, config: FlowConfig = {}): Promise<void> {
    const flowId = `${flow.name}-${Date.now()}`;

    this.logger.info(`Starting flow: ${flow.name} (${flowId})`);

    try {
      const coordinator = new FlowCoordinator(flowId, this.logger);
      this.runningFlows.set(flowId, coordinator);

      // Регистрируем блоки в координаторе
      for (const [blockId, blockConfig] of Object.entries(flow.blocks)) {
        const descriptor = this.registeredBlocks.get(blockConfig.type);
        if (!descriptor) {
          throw new Error(`Unknown block type: ${blockConfig.type}`);
        }
        coordinator.registerBlock(blockId, descriptor);
      }

      // Добавляем соединения
      for (const connection of flow.connections) {
        coordinator.addConnection(
          { blockId: connection.from.block, port: connection.from.port },
          { blockId: connection.to.block, port: connection.to.port }
        );
      }

      // Инициализируем блоки
      const blockConfigs = Object.fromEntries(
        Object.entries(flow.blocks).map(([id, block]) => [id, block.config || {}])
      );

      await coordinator.initializeBlocks(blockConfigs);

      // Ищем event блоки и запускаем их
      await this.startEventBlocks(coordinator, flow);

      // Ждем завершения или прерывания
      await this.waitForCompletion(coordinator, config.timeout);

    } catch (error) {
      this.logger.error(`Flow ${flowId} failed: ${getErrorMessage(error)}`);
      throw error;
    } finally {
      await this.stopFlow(flowId);
    }
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
