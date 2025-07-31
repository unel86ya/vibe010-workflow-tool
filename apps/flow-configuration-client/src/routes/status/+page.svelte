<script>
  import { createApiClient } from '$lib/api';
  import { joinUrl } from '$lib/url-utils';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';

  const apiBaseUrl = typeof window !== "undefined" ? window.API_BASE_URL || "http://localhost:8787" : "http://localhost:8787";
  const api = createApiClient(apiBaseUrl);
</script>

<svelte:head>
  <title>Статус системы | Flow Configuration</title>
  <meta name="description" content="Мониторинг соединения и статус API" />
</svelte:head>

<div class="space-y-6">
  <!-- Заголовок страницы -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        📊 Статус системы
      </h1>
      <p class="text-gray-600 dark:text-gray-300 mt-1">
        Мониторинг соединения и доступности API сервера
      </p>
    </div>

    <a
      href="/"
      class="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
    >
      ← Назад
    </a>
  </div>

  <!-- Большой индикатор состояния -->
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Текущее состояние
    </h2>
    <ConnectionStatus />
  </div>

  <!-- Информация о мониторинге -->
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      🔍 Что отслеживается
    </h3>

    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">Мониторинг соединения:</h4>
        <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li class="flex items-center">
            <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            <strong>Интернет:</strong> через Navigator.onLine API
          </li>
          <li class="flex items-center">
            <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            <strong>API сервер:</strong> проверка /api/health каждые 15 секунд
          </li>
          <li class="flex items-center">
            <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
            <strong>Время:</strong> последняя успешная проверка
          </li>
        </ul>
      </div>

      <div>
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">Состояния индикатора:</h4>
        <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li>🟢 <strong>Все работает</strong> — интернет есть, API доступен</li>
          <li>🔴 <strong>API недоступен</strong> — интернет есть, но сервер не отвечает</li>
          <li>⚫ <strong>Нет интернета</strong> — нет подключения к сети</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Техническая информация -->
  <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
    <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
      ⚙️ Техническая информация
    </h3>

    <div class="grid md:grid-cols-2 gap-6 text-sm">
      <div>
        <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2">Настройки:</h4>
        <ul class="space-y-1 text-blue-700 dark:text-blue-300">
          <li><strong>API URL:</strong> <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">{apiBaseUrl}</code></li>
          <li><strong>Интервал проверки:</strong> 15 секунд</li>
          <li><strong>Таймаут запроса:</strong> 5 секунд</li>
          <li><strong>Проверка при возврате на вкладку:</strong> включена</li>
        </ul>
      </div>

      <div>
        <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2">Возможности:</h4>
        <ul class="space-y-1 text-blue-700 dark:text-blue-300">
          <li>• Автоматическое отслеживание изменений сети</li>
          <li>• Периодическая проверка доступности API</li>
          <li>• Кнопка принудительной проверки статуса</li>
          <li>• Подробная техническая информация</li>
          <li>• Логирование всех проверок в консоль</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Инструменты для тестирования -->
  <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      🧪 Инструменты тестирования
    </h3>

    <div class="flex flex-wrap gap-3 mb-4">
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        on:click={() => window.navigator.onLine && alert('Интернет доступен!')}
      >
        Проверить Navigator.onLine
      </button>

      <button
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
        on:click={async () => {
          try {
            const response = await api.health();
            alert(response.ok ? 'API работает!' : `API ошибка: ${response.status}`);
          } catch (e) {
            alert(`Ошибка подключения: ${e.message}`);
          }
        }}
      >
        Проверить API вручную
      </button>

      <button
        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
        on:click={() => console.log('Navigator:', { onLine: navigator.onLine, userAgent: navigator.userAgent })}
      >
        Логи в консоль
      </button>

      <button
        class="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
        on:click={() => window.open(joinUrl(apiBaseUrl, '/status/health'), '_blank')}
      >
        Открыть {joinUrl(apiBaseUrl, '/status/health')}
      </button>
    </div>

    <p class="text-xs text-gray-500 dark:text-gray-400">
      💡 Откройте DevTools (F12) для просмотра подробных логов мониторинга соединения
    </p>
  </div>
</div>
