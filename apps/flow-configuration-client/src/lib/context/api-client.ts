import { getContext, setContext } from 'svelte';
import type { ApiClient } from '../api';

// Type-safe context key
const API_CLIENT_KEY = Symbol('api-client');

export function setApiClientContext(apiClient: ApiClient): void {
  setContext(API_CLIENT_KEY, apiClient);
}

export function getApiClientContext(): ApiClient {
  const apiClient = getContext<ApiClient>(API_CLIENT_KEY);

  if (!apiClient) {
    throw new Error('API Client context not found. Make sure to call setApiClientContext in a parent component.');
  }

  return apiClient;
}

// Опциональный helper для проверки доступности
export function hasApiClientContext(): boolean {
  return getContext(API_CLIENT_KEY) !== undefined;
}
