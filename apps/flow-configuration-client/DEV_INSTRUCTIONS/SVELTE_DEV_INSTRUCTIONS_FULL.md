# Инструкции для LLM: Писать код на Svelte 5

## Основные принципы Svelte 5

### Основа: Руны как магические символы
- **Руны** - это символы с префиксом `$`, которые управляют компилятором Svelte
- Выглядят как функции, но это ключевые слова компилятора, не функции
- Не нужно импортировать - встроены в язык
- Обеспечивают **универсальную детализированную реактивность** через сигналы

### Стиль кода: Четкие правила использования

#### ВСЕГДА используй эти конструкции для Svelte 5:
```javascript
// Состояние
let count = $state(0);
let user = $state({ name: 'John', settings: { theme: 'dark' } });

// Вычисляемые значения
const doubled = $derived(count * 2);
const hasItems = $derived(items.length > 0);

// Побочные эффекты
$effect(() => {
    console.log(`Count: ${count}`);
});

// Пропсы
let { title, items = [], children } = $props();

// Bindable пропсы
let { value = $bindable() } = $props();

// События на элементах
<button onclick={handleClick}>
<input oninput={handleInput}>
```

#### НИКОГДА НЕ используй эти устаревшие конструкции:
```javascript
// ❌ Старый Svelte 4 синтаксис - ЗАПРЕЩЕНО
let count = 0;              // → ИСПОЛЬЗУЙ ЭТО: let count = $state(0)
$: doubled = count * 2;     // → ИСПОЛЬЗУЙ ЭТО: const doubled = $derived(count * 2)
$: console.log(count);      // → ИСПОЛЬЗУЙ ЭТО: $effect(() => console.log(count))
export let prop;            // → ИСПОЛЬЗУЙ ЭТО: let { prop } = $props()
on:click={handler}          // → ИСПОЛЬЗУЙ ЭТО: onclick={handler}
```

## Руны: Детальное использование

### $state - Реактивное состояние
```javascript
// Примитивы
let count = $state(0);
let name = $state('');
let isVisible = $state(false);

// Объекты и массивы (глубокая реактивность)
let user = $state({
    profile: { name: 'John', age: 30 },
    preferences: { theme: 'dark' }
});
let items = $state([]);

// Можно мутировать напрямую - реактивно
user.profile.name = 'Jane';
user.preferences.theme = 'light';
items.push(newItem);
items[0] = updatedItem;
```

### $derived - Вычисления без побочных эффектов
```javascript
// Простые вычисления
const doubled = $derived(count * 2);
const fullName = $derived(`${firstName} ${lastName}`);

// Сложные вычисления
const filteredItems = $derived(() => {
    return items.filter(item =>
        item.completed === showCompleted &&
        item.text.includes(searchQuery)
    );
});

// Вложенные зависимости
const expensiveCalculation = $derived(() => {
    if (isEnabled) {
        return heavyComputation(filteredItems);
    }
    return null;
});
```

### $effect - Только для побочных эффектов
```javascript
// Логирование
$effect(() => {
    console.log(`User ${user.name} logged in`);
});

// Работа с localStorage
$effect(() => {
    localStorage.setItem('preferences', JSON.stringify(user.preferences));
});

// Подписки на внешние API
$effect(() => {
    const unsubscribe = externalApi.subscribe(data => {
        processData(data);
    });

    return unsubscribe; // cleanup
});

// Манипуляции с DOM
$effect(() => {
    document.title = `Todos: ${todos.length}`;
});
```

### $props - Пропсы компонента
```javascript
// Базовые пропсы
let { title, count = 0 } = $props();

// С детструктуризацией и значениями по умолчанию
let {
    variant = 'primary',
    size = 'medium',
    disabled = false,
    items = [],
    onSelect,
    children
} = $props();

// Рест-пропсы
let { class: className, ...rest } = $props();
```

### $bindable - Двусторонняя привязка
```javascript
// В дочернем компоненте
let { value = $bindable(), placeholder = 'Enter text' } = $props();

// Использование в родительском компоненте
<MyInput bind:value={inputValue} />
<MySlider bind:value={sliderValue} />
```

## Idiomatic Svelte 5: Стиль и паттерны

### Структура .svelte файла
```svelte
<script lang="ts">
    // 1. Импорты
    import { onMount } from 'svelte';
    import Button from './Button.svelte';
    import { userStore } from './stores.svelte.js';

    // 2. Пропсы (всегда первыми)
    let {
        items = [],
        selectedId = $bindable(),
        onItemSelect,
        children
    } = $props();

    // 3. Локальное состояние
    let searchQuery = $state('');
    let isLoading = $state(false);
    let selectedItem = $state(null);

    // 4. Вычисляемые значения
    const filteredItems = $derived(() =>
        items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    const hasResults = $derived(filteredItems.length > 0);

    // 5. Эффекты
    $effect(() => {
        if (selectedId) {
            selectedItem = items.find(item => item.id === selectedId);
        }
    });

    // 6. Обработчики событий
    function handleSearch(event) {
        searchQuery = event.target.value;
    }

    function handleItemClick(item) {
        selectedId = item.id;
        onItemSelect?.(item);
    }

    // 7. Lifecycle hooks
    onMount(() => {
        // инициализация
    });
</script>

<!-- HTML разметка -->
<div class="search-container">
    <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        oninput={handleSearch}
    />

    {#if isLoading}
        <div class="loading">Loading...</div>
    {:else if hasResults}
        <ul class="results">
            {#each filteredItems as item (item.id)}
                <li
                    class="item"
                    class:selected={item.id === selectedId}
                    onclick={() => handleItemClick(item)}
                >
                    {item.name}
                </li>
            {/each}
        </ul>
    {:else}
        <div class="no-results">
            {@render children?.() ?? 'No items found'}
        </div>
    {/if}
</div>

<style>
    .search-container {
        padding: 1rem;
    }

    .item {
        cursor: pointer;
        padding: 0.5rem;
    }

    .item:hover,
    .item.selected {
        background: var(--accent-color);
    }
</style>
```

### Работа со сложным состоянием

#### Классы для организации состояния
```javascript
// stores/todoStore.svelte.js
class TodoStore {
    #todos = $state([]);
    #filter = $state('all');
    #isLoading = $state(false);

    // Геттеры для публичного API
    get todos() { return this.#todos; }
    get filter() { return this.#filter; }
    get isLoading() { return this.#isLoading; }

    // Вычисляемые значения
    filteredTodos = $derived(() => {
        switch (this.#filter) {
            case 'active': return this.#todos.filter(t => !t.completed);
            case 'completed': return this.#todos.filter(t => t.completed);
            default: return this.#todos;
        }
    });

    get activeCount() {
        return $derived(this.#todos.filter(t => !t.completed).length);
    }

    // Методы для мутации
    async loadTodos() {
        this.#isLoading = true;
        try {
            const response = await fetch('/api/todos');
            this.#todos = await response.json();
        } finally {
            this.#isLoading = false;
        }
    }

    addTodo(text) {
        this.#todos.push({
            id: crypto.randomUUID(),
            text,
            completed: false,
            createdAt: new Date()
        });
    }

    toggleTodo(id) {
        const todo = this.#todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
        }
    }

    setFilter(filter) {
        this.#filter = filter;
    }

    clearCompleted() {
        this.#todos = this.#todos.filter(t => !t.completed);
    }
}

export const todoStore = new TodoStore();
```

#### Разделяемое состояние между файлами
```javascript
// stores/counter.svelte.js
export const counter = $state({ count: 0 });

export function increment() {
    counter.count++;
}

export function reset() {
    counter.count = 0;
}

// В компонентах
import { counter, increment } from './stores/counter.svelte.js';
// counter автоматически реактивен везде
```

### Интеграция с внешними библиотеками

#### Svelte Actions - правильный способ
```javascript
// actions/chartAction.svelte.js
import Chart from 'chart.js/auto';

export function chartAction(node, config) {
    let chart;

    $effect(() => {
        // Создание графика
        chart = new Chart(node, config);

        return () => {
            // Cleanup при размонтировании
            chart?.destroy();
        };
    });

    // Обновление при изменении конфига
    $effect(() => {
        if (chart && config) {
            chart.data = config.data;
            chart.update();
        }
    });
}

// Использование в компоненте
<script>
    import { chartAction } from './actions/chartAction.svelte.js';

    let chartData = $state({
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ data: [10, 20, 30] }]
    });

    const chartConfig = $derived(() => ({
        type: 'line',
        data: chartData,
        options: { responsive: true }
    }));
</script>

<canvas use:chartAction={chartConfig}></canvas>
```

#### Интеграция с библиотеками управления состоянием
```javascript
// stores/queryStore.svelte.js
import { createQuery } from '@tanstack/svelte-query';

export function createReactiveQuery(queryKey, queryFn) {
    const query = createQuery({
        queryKey,
        queryFn
    });

    // Преобразуем в реактивное состояние Svelte 5
    const state = $state({
        data: null,
        isLoading: false,
        error: null
    });

    $effect(() => {
        const unsubscribe = query.subscribe(result => {
            state.data = result.data;
            state.isLoading = result.isLoading;
            state.error = result.error;
        });

        return unsubscribe;
    });

    return {
        get data() { return state.data; },
        get isLoading() { return state.isLoading; },
        get error() { return state.error; },
        refetch: query.refetch
    };
}
```

### Продвинутые паттерны компонентов

#### Композиция компонентов с контекстом
```javascript
// contexts/themeContext.svelte.js
import { getContext, setContext } from 'svelte';

const THEME_KEY = Symbol('theme');

export class ThemeStore {
    #theme = $state('light');
    #colors = $state({});

    get theme() { return this.#theme; }
    get colors() { return this.#colors; }

    setTheme(theme) {
        this.#theme = theme;
        this.#colors = getColorsForTheme(theme);
    }

    toggleTheme() {
        this.setTheme(this.#theme === 'light' ? 'dark' : 'light');
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

#### Переиспользуемые компоненты с гибкой типизацией
```svelte
<!-- Button.svelte -->
<script lang="ts">
    interface Props {
        variant?: 'primary' | 'secondary' | 'danger';
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        loading?: boolean;
        onclick?: (event: MouseEvent) => void;
        children: import('svelte').Snippet;
        [key: string]: any; // для rest props
    }

    let {
        variant = 'primary',
        size = 'md',
        disabled = false,
        loading = false,
        onclick,
        children,
        class: className = '',
        ...rest
    }: Props = $props();

    const classes = $derived(() => [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        disabled && 'btn-disabled',
        loading && 'btn-loading',
        className
    ].filter(Boolean).join(' '));
</script>

<button
    class={classes}
    {disabled}
    {onclick}
    {...rest}
>
    {#if loading}
        <span class="spinner"></span>
    {/if}
    {@render children()}
</button>
```

### События и обработчики

#### Правильная работа с событиями
```svelte
<script>
    let items = $state([]);

    // Простые обработчики
    const handleClick = () => console.log('clicked');

    // Обработчики с параметрами
    const handleItemClick = (item) => () => {
        console.log('Item clicked:', item);
    };

    // Inline обработчики для простых случаев
    const toggleItem = (item) => {
        item.active = !item.active;
    };
</script>

<!-- События как свойства элементов -->
<button onclick={handleClick}>Click me</button>

<!-- Обработчики с параметрами -->
{#each items as item}
    <div onclick={handleItemClick(item)}>
        {item.name}
    </div>
{/each}

<!-- Inline для простых операций -->
{#each items as item}
    <input
        type="checkbox"
        checked={item.active}
        onchange={() => toggleItem(item)}
    />
{/each}
```

### Стилизация: Современные подходы

#### CSS переменные и реактивность
```svelte
<script>
    let theme = $state('light');
    let accentColor = $state('#007acc');

    const cssVariables = $derived(() => ({
        '--theme': theme,
        '--accent-color': accentColor,
        '--bg-color': theme === 'dark' ? '#1a1a1a' : '#ffffff'
    }));
</script>

<div
    class="container"
    style={Object.entries(cssVariables).map(([k,v]) => `${k}:${v}`).join(';')}
>
    <!-- content -->
</div>

<style>
    .container {
        background: var(--bg-color);
        color: var(--text-color);
        border: 2px solid var(--accent-color);
    }
</style>
```

#### Условные классы и стили
```svelte
<script>
    let isActive = $state(false);
    let variant = $state('primary');
    let size = $state(100);
</script>

<!-- Условные классы -->
<div
    class="component"
    class:active={isActive}
    class:primary={variant === 'primary'}
    class:secondary={variant === 'secondary'}
>
    Content
</div>

<!-- Динамические стили -->
<div
    class="dynamic"
    style:width="{size}px"
    style:background-color={isActive ? 'blue' : 'gray'}
    style:transform="scale({isActive ? 1.1 : 1})"
>
    Styled content
</div>
```

## Best Practices: Производственные паттерны

### Производительность и оптимизация
```javascript
// Мемоизация тяжелых вычислений
const expensiveComputation = $derived(() => {
    if (!needsComputation) return cached;
    return heavyCalculation(largeDataset);
});

// Ленивая загрузка компонентов
const LazyComponent = $derived(() => {
    return showComponent ? import('./HeavyComponent.svelte') : null;
});

// Виртуализация больших списков
const visibleItems = $derived(() => {
    const start = scrollOffset;
    const end = start + viewportSize;
    return allItems.slice(start, end);
});
```

### Обработка ошибок и граничных случаев
```javascript
// Error boundaries с $effect
let error = $state(null);
let isLoading = $state(false);

$effect(() => {
    error = null;
    isLoading = true;

    asyncOperation()
        .then(result => {
            // handle success
        })
        .catch(err => {
            error = err;
            console.error('Operation failed:', err);
        })
        .finally(() => {
            isLoading = false;
        });
});

// Защитные проверки в derived
const safeComputation = $derived(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(transformItem).filter(Boolean);
});
```

### Тестирование компонентов
```javascript
// stores/testableStore.svelte.js
export class TestableStore {
    #state = $state({ count: 0 });

    get count() { return this.#state.count; }

    increment() {
        this.#state.count++;
    }

    // Методы для тестирования
    reset() {
        this.#state.count = 0;
    }

    setState(newState) {
        Object.assign(this.#state, newState);
    }
}

// В тестах можно легко проверить состояние и методы
```

## Общие принципы

### Ментальная модель Svelte 5
1. **Явная реактивность** - используй руны для создания реактивного поведения
2. **Композиция над наследованием** - собирай сложную функциональность из простых частей
3. **Близко к платформе** - используй нативные DOM API где возможно
4. **Производительность по умолчанию** - компилятор оптимизирует за тебя
5. **Предсказуемость** - состояние течет в одном направлении

### Архитектурные решения
- **Локальное состояние** - $state в компонентах
- **Разделяемое состояние** - классы в .svelte.js файлах
- **Вычисления** - $derived для чистых функций
- **Побочные эффекты** - $effect экономно, только когда нужно
- **Интеграция** - actions для внешних библиотек

Эти паттерны обеспечивают чистый, производительный и масштабируемый код в духе Svelte 5.