# LLM Инструкции: Svelte 5

## Основы: Руны вместо старого синтаксиса

### ВСЕГДА используй:
```javascript
// Состояние
let count = $state(0);
let user = $state({ name: 'John' });

// Вычисления
const doubled = $derived(count * 2);

// Эффекты
$effect(() => console.log(count));

// Пропсы
let { title, items = [] } = $props();
let { value = $bindable() } = $props();

// События
<button onclick={handleClick}>
```

### НИКОГДА НЕ используй (Svelte 4):
```javascript
let count = 0;              // → $state(0)
$: doubled = count * 2;     // → $derived()
$: console.log(count);      // → $effect()
export let prop;            // → $props()
on:click={handler}          // → onclick={}
```

## Структура компонента

```svelte
<script lang="ts">
    // 1. Импорты
    import { onMount } from 'svelte';

    // 2. Пропсы
    let { items = [], selectedId = $bindable() } = $props();

    // 3. Состояние
    let searchQuery = $state('');
    let isLoading = $state(false);

    // 4. Вычисления
    const filteredItems = $derived(() =>
        items.filter(item => item.name.includes(searchQuery))
    );

    // 5. Эффекты
    $effect(() => {
        localStorage.setItem('search', searchQuery);
    });

    // 6. Обработчики
    function handleSearch(event) {
        searchQuery = event.target.value;
    }

    // 7. Lifecycle
    onMount(() => {});
</script>

<input value={searchQuery} oninput={handleSearch} />
{#each filteredItems as item (item.id)}
    <div onclick={() => selectedId = item.id}>
        {item.name}
    </div>
{/each}
```

## Сложное состояние: Классы

```javascript
// stores/todoStore.svelte.js
class TodoStore {
    #todos = $state([]);
    #filter = $state('all');

    get todos() { return this.#todos; }

    filteredTodos = $derived(() => {
        return this.#filter === 'all'
            ? this.#todos
            : this.#todos.filter(t => t.completed === (this.#filter === 'completed'));
    });

    addTodo(text) {
        this.#todos.push({
            id: crypto.randomUUID(),
            text,
            completed: false
        });
    }

    toggleTodo(id) {
        const todo = this.#todos.find(t => t.id === id);
        if (todo) todo.completed = !todo.completed;
    }

    setFilter(filter) {
        this.#filter = filter;
    }
}

export const todoStore = new TodoStore();
```

## Разделяемое состояние

```javascript
// counter.svelte.js
export const counter = $state({ count: 0 });

export function increment() {
    counter.count++;
}

// В компонентах
import { counter, increment } from './counter.svelte.js';
// Автоматически реактивно везде
```

## Внешние библиотеки: Actions

```javascript
// chartAction.svelte.js
import Chart from 'chart.js/auto';

export function chartAction(node, config) {
    let chart;

    $effect(() => {
        chart = new Chart(node, config);
        return () => chart?.destroy();
    });

    $effect(() => {
        if (chart && config) {
            chart.data = config.data;
            chart.update();
        }
    });
}

// Использование
<canvas use:chartAction={chartConfig}></canvas>
```

## Продвинутые паттерны

### Компонент с типизацией
```svelte
<script lang="ts">
    interface Props {
        variant?: 'primary' | 'secondary';
        disabled?: boolean;
        onclick?: (e: MouseEvent) => void;
        children: import('svelte').Snippet;
    }

    let {
        variant = 'primary',
        disabled = false,
        onclick,
        children,
        class: className = '',
        ...rest
    }: Props = $props();

    const classes = $derived(() => [
        'btn',
        `btn-${variant}`,
        disabled && 'btn-disabled',
        className
    ].filter(Boolean).join(' '));
</script>

<button class={classes} {disabled} {onclick} {...rest}>
    {@render children()}
</button>
```

### Контекст для состояния
```javascript
// themeContext.svelte.js
import { getContext, setContext } from 'svelte';

const THEME_KEY = Symbol('theme');

export class ThemeStore {
    #theme = $state('light');

    get theme() { return this.#theme; }

    toggle() {
        this.#theme = this.#theme === 'light' ? 'dark' : 'light';
    }
}

export function createThemeContext() {
    const store = new ThemeStore();
    setContext(THEME_KEY, store);
    return store;
}

export function getThemeContext() {
    return getContext(THEME_KEY);
}
```

### Интеграция с внешним API
```javascript
// queryStore.svelte.js
export function createAsyncData(fetcher) {
    let data = $state(null);
    let loading = $state(false);
    let error = $state(null);

    async function load() {
        loading = true;
        error = null;
        try {
            data = await fetcher();
        } catch (err) {
            error = err;
        } finally {
            loading = false;
        }
    }

    return {
        get data() { return data; },
        get loading() { return loading; },
        get error() { return error; },
        load,
        refetch: load
    };
}
```

## События и стили

### События
```svelte
<script>
    const handleClick = () => console.log('clicked');
    const handleItemClick = (item) => () => selectItem(item);
</script>

<button onclick={handleClick}>Click</button>
{#each items as item}
    <div onclick={handleItemClick(item)}>{item.name}</div>
{/each}
```

### Динамические стили
```svelte
<script>
    let isActive = $state(false);
    let size = $state(100);
</script>

<div
    class:active={isActive}
    style:width="{size}px"
    style:background={isActive ? 'blue' : 'gray'}
>
    Content
</div>
```

## Лучшие практики

### Производительность
```javascript
// Мемоизация тяжелых вычислений
const expensive = $derived(() => {
    if (!needsUpdate) return cached;
    return heavyCalculation(data);
});

// Виртуализация
const visibleItems = $derived(() =>
    allItems.slice(scrollOffset, scrollOffset + viewportSize)
);
```

### Обработка ошибок
```javascript
let error = $state(null);
let loading = $state(false);

$effect(() => {
    loading = true;
    error = null;

    asyncOperation()
        .then(handleSuccess)
        .catch(err => error = err)
        .finally(() => loading = false);
});
```

## Ключевые принципы

1. **Используй руны** - $state, $derived, $effect, $props, $bindable
2. **Явная реактивность** - всё реактивное помечено рунами
3. **Глубокая реактивность** - объекты и массивы в $state автоматически реактивны
4. **$derived для вычислений** - чистые функции без побочных эффектов
5. **$effect экономно** - только для побочных эффектов (DOM, API, localStorage)
6. **Классы для сложного состояния** - организация в .svelte.js файлах
7. **Actions для интеграции** - обёртка внешних библиотек
8. **События как свойства** - onclick вместо on:click