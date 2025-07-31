<script lang="ts">
  import { createApiClient } from '$lib/api';
  import { setApiClientContext } from '$lib/context/api-client';
  import { createConnectionStore } from '$lib/stores/connection.svelte';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  import { onMount } from 'svelte';
  import '../app.css';


  const apiBaseUrl = typeof window !== "undefined" ? window.API_BASE_URL || "http://localhost:8787" : "http://localhost:8787";

  // Создаём API client
  const apiClient = createApiClient(apiBaseUrl);

  // Устанавливаем в контекст для всех потомков
  setApiClientContext(apiClient);

  // Создаём connection store
  const connection = createConnectionStore();

  // Стартуем мониторинг
  onMount(() => {
    const cleanup = connection.start(apiClient, 15_000);
    return cleanup;
  });

  export const ssr = false;
  export const prerender = false;
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center">
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            Flow Configuration Client
          </h1>
        </div>

        <!-- Передаём connection store в компонент -->
        <div class="flex items-center">
          <ConnectionStatus {connection} />
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <slot />
  </main>
</div>
