<script lang="ts">
  /** online | offline | api-error */
  export let variant: 'online' | 'offline' | 'api-error' = 'online';

  const palette = {
    online:    '#16a34a',  // зелёный
    offline:   '#9ca3af',  // серый
    'api-error': '#dc2626' // красный
  };

  const labels = {
    online: 'Соединение установлено',
    offline: 'Нет интернета',
    'api-error': 'Проблемы с API'
  };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  aria-label={labels[variant]}
  class="w-4 h-4 shrink-0"
  fill={palette[variant]}
>
  {#if variant === 'online'}
    <!-- check-circle -->
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/>
    <path d="M10.2 13.7 7.8 11.3l-1.4 1.4 3.8 3.8 7-7-1.4-1.4-5.6 5.6Z" fill="#fff"/>
  {:else if variant === 'offline'}
    <!-- minus-circle -->
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/>
    <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff"/>
  {:else}
    <!-- exclamation-circle -->
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/>
    <path d="M11 6h2v8h-2zM11 16h2v2h-2z" fill="#fff"/>
  {/if}
</svg>
