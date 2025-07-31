<script lang="ts">
  import { getApiClientContext } from '$lib/context/api-client';
  import ConnectionIcon from '$lib/icons/ConnectionIcons.svelte';
  import type { ConnectionStore } from '$lib/stores/connection.svelte';

  let { connection }: { connection: ConnectionStore } = $props();

  const apiClient = getApiClientContext();

  const statusVariant = $derived(
    !connection?.isOnline      ? 'offline'
    : !connection?.isApiHealthy ? 'api-error'
    : 'online'
  );

  const statusText = $derived(
    statusVariant === 'online'   ? 'Все работает'
    : statusVariant === 'offline' ? 'Нет интернета'
    :                              'API недоступен'
  );

  function fmt(date: Date | null) {
    return date ? date.toLocaleTimeString('ru-RU') : '–';
  }

  // 🆕 Функция для форматирования "как давно"
  function timeAgo(date: Date | null) {
    if (!date) return 'никогда';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return `${diffSec}с назад`;
    if (diffMin < 60) return `${diffMin}м назад`;
    if (diffHour < 24) return `${diffHour}ч назад`;
    return date.toLocaleDateString('ru-RU');
  }

  const recheck = () => connection.checkApiHealth(apiClient);
</script>

<div class="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700 rounded-lg shadow">
  <ConnectionIcon variant={statusVariant} />
  <span class="text-sm">{statusText}</span>

  <!-- 🆕 Показываем время последней проверки И последнего успеха -->
  <div class="flex flex-col text-[10px] text-gray-500 dark:text-gray-400">
    <span>Проверено: {fmt(connection?.lastChecked)}</span>
    {#if !connection?.isApiHealthy && connection?.lastHealthyAt}
      <span class="text-orange-600 dark:text-orange-400">
        Работал: {timeAgo(connection?.lastHealthyAt)}
      </span>
    {/if}
  </div>

  <button
    class="ml-auto text-xs text-blue-600 hover:underline"
    on:click={recheck}
    title="Проверить соединение"
  >
    🔄
  </button>
</div>

<!-- Детальная информация -->
<details class="mt-2">
  <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
    Подробности
  </summary>
  <div class="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs">
    <div><strong>Интернет:</strong> {connection?.isOnline ? 'Есть' : 'Нет'}</div>
    <div><strong>API статус:</strong> {connection?.isApiHealthy ? 'Работает' : 'Недоступен'}</div>
    <div><strong>Последняя проверка:</strong> {fmt(connection?.lastChecked)}</div>
    <!-- 🆕 Показываем когда API был жив -->
    <div><strong>Последний раз работал:</strong> {connection?.lastHealthyAt ? fmt(connection.lastHealthyAt) : 'Неизвестно'}</div>
  </div>
</details>
