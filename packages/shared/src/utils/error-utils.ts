/**
 * Проверяет является ли значение Error объектом
 * Использует нативный Error.isError() если доступен, иначе fallback на instanceof
 */
export function isError(error: unknown): error is Error {
  // Используем нативный Error.isError() если доступен (Node.js 24+, современные браузеры)
  if (typeof Error.isError === 'function') {
    return Error.isError(error);
  }

  // Fallback для старых сред
  return error instanceof Error;
}

/**
 * Безопасно извлекает сообщение ошибки из unknown значения
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return getErrorMessage(error);
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof getErrorMessage(error) === 'string') {
    return getErrorMessage(error);
  }

  return 'Unknown error occurred';
}

/**
 * Безопасно извлекает stack trace из ошибки
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }

  return undefined;
}

/**
 * Создает Error объект из unknown значения
 */
export function toError(error: unknown): Error {
  if (isError(error)) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error(getErrorMessage(error));
}

/**
 * Извлекает причину ошибки (если есть)
 * Поддерживает стандартное свойство error.cause (доступно в Node.js 16.9.0+)
 */
export function getErrorCause(error: unknown): unknown {
  if (isError(error) && 'cause' in error) {
    return error.cause;
  }

  return undefined;
}

/**
 * Проверяет является ли ошибка конкретного типа (TypeError, RangeError, etc.)
 */
export function isErrorOfType<T extends Error>(
  error: unknown,
  ErrorClass: new (...args: any[]) => T
): error is T {
  return isError(error) && error instanceof ErrorClass;
}

/**
 * Создает цепочку ошибок с причиной (для Node.js 16.9.0+)
 */
export function createErrorWithCause(message: string, cause?: unknown): Error {
  // Проверяем поддержку error.cause
  try {
    return new Error(message, { cause } as any);
  } catch {
    // Fallback для старых версий Node.js
    const error = new Error(message);
    (error as any).cause = cause;
    return error;
  }
}


// В error-utils.ts добавляем расширенную декларацию типов
declare global {
  interface ErrorConstructor {
    isError(value: unknown): value is Error;
  }
}

// Type guard для асинхронных ошибок
export function isAsyncError(error: unknown): error is Error & { code?: string } {
  return isError(error) && Boolean(
    'code' in error ||
    error.name.includes('Async') ||
    error.stack?.includes('async')
  );
}
