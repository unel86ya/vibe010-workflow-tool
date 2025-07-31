import { browser } from '$app/environment';

export function createNavigatorStore() {
  let isOnline = $state<boolean>(true);

  function updateOnlineStatus(): void {
    if (browser) {
      isOnline = navigator.onLine;
    }
  }

  function start(): (() => void) | undefined {
    if (!browser) {
      console.warn('Navigator store: not in browser, skipping start');
      return;
    }

    // Начальная проверка
    updateOnlineStatus();

    // Подписка на события браузера
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Cleanup функция
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }

  return {
    get isOnline() { return isOnline; },
    start,

    // Debug info
    get status() {
      return {
        online: isOnline,
        browser: browser
      };
    }
  };
}

export type NavigatorStore = ReturnType<typeof createNavigatorStore>;
