import { browser } from '$app/environment';
import type { ApiClient } from '../api';
import { getErrorMessage } from '@workflow-tool/shared';

export function createApiHealthStore() {
  let isHealthy = $state<boolean>(false);
  let lastChecked = $state<Date | null>(null);
  let lastHealthyAt = $state<Date | null>(null);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isRunning = false;

  async function checkHealth(apiClient: ApiClient): Promise<void> {
    if (!browser) {
      isHealthy = false;
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await apiClient.health();
      clearTimeout(timeoutId);

      isHealthy = response.ok;
      lastChecked = new Date();

      if (response.ok) {
        lastHealthyAt = new Date(); // 🆕 Обновляем время последнего успеха
        console.debug('✅ API health check passed');
      } else {
        console.warn(`⚠️ API health check failed: ${response.status}`);
      }

    } catch (error: unknown) {
      isHealthy = false;
      lastChecked = new Date();

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('⏱️ API health check timeout');
        } else {
          console.warn('❌ API health check error:', getErrorMessage(error));
        }
      }
    }
  }

  // Рекурсивная функция с setTimeout (без изменений)
  async function scheduleNext(apiClient: ApiClient, intervalMs: number): Promise<void> {
    if (!isRunning || !browser) return;

    try {
      await checkHealth(apiClient);
    } finally {
      if (isRunning) {
        timeoutId = setTimeout(() => {
          scheduleNext(apiClient, intervalMs);
        }, intervalMs);
      }
    }
  }

  function start(apiClient: ApiClient, intervalMs: number = 15000): (() => void) | undefined {
    if (!browser) {
      console.warn('API Health store: not in browser, skipping start');
      return;
    }

    if (isRunning) {
      console.warn('API Health store: already running, skipping start');
      return;
    }

    console.log(`🔄 Starting API health monitoring (every ${intervalMs}ms, recursive)`);
    isRunning = true;

    scheduleNext(apiClient, intervalMs);

    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        scheduleNext(apiClient, intervalMs);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('🛑 Stopping API health monitoring');
      isRunning = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  return {
    get isHealthy() { return isHealthy; },
    get lastChecked() { return lastChecked; },
    get lastHealthyAt() { return lastHealthyAt; }, // 🆕 Экспортируем новое поле
    start,
    checkHealth: (apiClient: ApiClient) => checkHealth(apiClient),

    get status() {
      return {
        healthy: isHealthy,
        lastChecked: lastChecked?.toISOString() ?? null,
        lastHealthyAt: lastHealthyAt?.toISOString() ?? null, // 🆕 В debug info
        isRunning,
        timeoutActive: !!timeoutId
      };
    }
  };
}

export type ApiHealthStore = ReturnType<typeof createApiHealthStore>;
