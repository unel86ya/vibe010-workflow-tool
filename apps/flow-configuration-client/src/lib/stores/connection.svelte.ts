import { browser } from '$app/environment';
import type { ApiClient } from '../api';
import { createNavigatorStore, type NavigatorStore } from './navigator.svelte';
import { createApiHealthStore, type ApiHealthStore } from './api-health.svelte';

interface ConnectionStatus {
  online: boolean;
  apiHealthy: boolean;
  lastChecked: Date | null;
  lastHealthyAt: Date | null;
  overallStatus: 'online' | 'offline' | 'api-error';
}

export function createConnectionStore() {
  const navigator: NavigatorStore = createNavigatorStore();
  const apiHealth: ApiHealthStore = createApiHealthStore();

  const isOnline = $derived(navigator.isOnline);
  const isApiHealthy = $derived(apiHealth.isHealthy);
  const lastChecked = $derived(apiHealth.lastChecked);
  const lastHealthyAt = $derived(apiHealth.lastHealthyAt); // 🆕 Новый геттер

  const overallStatus = $derived(
    !navigator.isOnline
      ? 'offline'
      : !apiHealth.isHealthy
        ? 'api-error'
        : 'online'
  );

  function start(apiClient: ApiClient, intervalMs: number = 15000): (() => void) | undefined {
    if (!browser) {
      console.warn('Connection store: not in browser, skipping start');
      return;
    }

    console.log('🔄 Starting connection monitoring');

    // Стартуем оба стора
    const cleanupNavigator = navigator.start();
    const cleanupApiHealth = apiHealth.start(apiClient, intervalMs);

    // Общая cleanup функция
    return () => {
      console.log('🛑 Stopping connection monitoring');
      cleanupNavigator?.();
      cleanupApiHealth?.();
    };
  }

  return {
    // Композитные геттеры
    get isOnline() { return isOnline; },
    get isApiHealthy() { return isApiHealthy; },
    get lastChecked() { return lastChecked; },
    get lastHealthyAt() { return lastHealthyAt; },
    get overallStatus() { return overallStatus; },

    // Отдельные сторы для продвинутого использования
    navigator,
    apiHealth,

    // Методы
    start,
    checkApiHealth: (apiClient: ApiClient) => apiHealth.checkHealth(apiClient),

    // Debug info
    get status(): ConnectionStatus {
      return {
        online: navigator.isOnline,
        apiHealthy: apiHealth.isHealthy,
        lastChecked: lastChecked ?? null,
        lastHealthyAt: lastHealthyAt ?? null,
        overallStatus: overallStatus,
      };
    }
  };
}

export type ConnectionStore = ReturnType<typeof createConnectionStore>;
