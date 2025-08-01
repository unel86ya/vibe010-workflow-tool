import { Logger } from '@workflow-tool/shared';

export class ConsoleLogger implements Logger {
  constructor(private level: 'debug' | 'info' | 'warn' | 'error' = 'info') {}

  setLevel(level: 'debug' | 'info' | 'warn' | 'error') {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`🐛 ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`ℹ️  ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}
