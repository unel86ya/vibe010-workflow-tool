<script>
  let message = 'Flow Configuration Client';
</script>

<svelte:head>
  <title>Flow Configuration Client</title>
  <meta name="description" content="Интерфейс настройки LLM workflow" />
</svelte:head>

<div class="space-y-6">
  <!-- Приветственное сообщение -->
  <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      {message}
    </h2>
    <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
      Интерфейс для настройки и управления LLM workflow
    </p>

    <!-- Навигационные кнопки -->
    <div class="flex justify-center gap-4">
      <a
        href="/flows"
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        🔧 Управление Flow
      </a>

      <a
        href="/context-modules"
        class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        📦 Контекстные модули
      </a>

      <a
        href="/status"
        class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
      >
        📊 Статус системы
      </a>
    </div>
  </div>

  <!-- Быстрая информация -->
  <div class="grid md:grid-cols-3 gap-6">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="flex items-center mb-3">
        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
          <span class="text-blue-600 dark:text-blue-400">🔧</span>
        </div>
        <h3 class="font-semibold text-gray-900 dark:text-white">Flows</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Создание и настройка workflow для обработки задач
      </p>
    </div>

    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="flex items-center mb-3">
        <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
          <span class="text-green-600 dark:text-green-400">📦</span>
        </div>
        <h3 class="font-semibold text-gray-900 dark:text-white">Модули</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Управление контекстными модулями и их конфигурацией
      </p>
    </div>

    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="flex items-center mb-3">
        <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
          <span class="text-purple-600 dark:text-purple-400">📊</span>
        </div>
        <h3 class="font-semibold text-gray-900 dark:text-white">Мониторинг</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Отслеживание состояния соединения и работы системы
      </p>
    </div>
  </div>
</div>
