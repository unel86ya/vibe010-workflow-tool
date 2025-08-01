import {
  BlockRuntime,
  BlockDescriptor,
  RunContext,
  InvokeResult
} from '@workflow-tool/shared';

interface TimerConfig {
  schedule: string; // "*/5 * * * * *" - каждые 5 секунд
  maxRuns?: number; // максимум запусков
  immediate?: boolean; // запустить сразу
}

export class TimerEvent implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'timer-event',
      title: 'Timer Event',
      version: '1.0.0',
      description: 'Циклический таймер в стиле cron (миллисекунды, секунды, минуты)'
    },
    kind: 'event',
    ports: [
      {
        name: 'tick',
        direction: 'out',
        description: 'Событие тика таймера',
        schema: {
          type: 'object',
          properties: {
            timestamp: { type: 'number' },
            runCount: { type: 'number' }
          }
        }
      },
      { name: 'error', direction: 'error', description: 'Ошибки таймера' }
    ],
    configSchema: {
      type: 'object',
      properties: {
        schedule: {
          type: 'string',
          description: 'Расписание: "*/500ms", "*/5s", "*/1m" или cron "*/5 * * * * *"'
        },
        maxRuns: {
          type: 'number',
          description: 'Максимум запусков (опционально)',
          minimum: 1
        },
        immediate: {
          type: 'boolean',
          description: 'Запустить сразу при старте',
          default: false
        }
      },
      required: ['schedule']
    }
  };

  private interval?: NodeJS.Timeout;
  private runCount = 0;
  private config!: TimerConfig;
  private ctx!: RunContext;

  async init(config: TimerConfig, ctx: RunContext): Promise<void> {
    this.config = config;
    this.ctx = ctx;

    ctx.logger.info(`Timer initialized with schedule: ${config.schedule}`);

    if (config.immediate) {
      this.tick();
    }

    this.startTimer();
  }

  async onInvoke(port: string, data: unknown, ctx: RunContext): Promise<InvokeResult> {
    // Timer events не принимают входные сообщения
    return { error: 'Timer events do not accept input messages' };
  }

  private startTimer(): void {
    const intervalMs = this.parseSchedule(this.config.schedule);

    this.interval = setInterval(() => {
      if (this.config.maxRuns && this.runCount >= this.config.maxRuns) {
        this.dispose();
        return;
      }

      this.tick();
    }, intervalMs);
  }

  private tick(): void {
    this.runCount++;

    const tickData = {
      timestamp: Date.now(),
      runCount: this.runCount
    };

    this.ctx.logger.debug(`Timer tick #${this.runCount}`);
    this.ctx.emit('tick', tickData);
  }

  private parseSchedule(schedule: string): number {
    // Простой парсер для */Nms, */Ns, */Nm
    if (schedule.startsWith('*/')) {
      const value = schedule.slice(2);

      if (value.endsWith('ms')) {
        return parseInt(value, 10);
      } else if (value.endsWith('s')) {
        return parseInt(value, 10) * 1000;
      } else if (value.endsWith('m')) {
        return parseInt(value, 10) * 60 * 1000;
      }
    }

    // Fallback - возвращаем 1 секунду
    this.ctx.logger.warn(`Invalid schedule format: ${schedule}, using 1s`);
    return 1000;
  }

  async dispose(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.ctx?.logger.info(`Timer disposed after ${this.runCount} runs`);
  }
}
