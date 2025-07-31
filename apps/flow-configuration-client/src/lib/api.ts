import { joinUrl } from './url-utils';

export interface ApiClient {
  readonly baseUrl: string;
  url(path: string): string;
  get(path: string, options?: RequestInit): Promise<Response>;
  post(path: string, data?: any, options?: RequestInit): Promise<Response>;

  // Специфичные методы
  health(): Promise<Response>;
  flows: {
    list(): Promise<Response>;
    get(name: string): Promise<Response>;
    create(data: any): Promise<Response>;
    update(name: string, data: any): Promise<Response>;
    delete(name: string): Promise<Response>;
  };
}

export function createApiClient(baseUrl: string): ApiClient {
  const api: ApiClient = {
    baseUrl,

    url: (path: string) => joinUrl(baseUrl, path),

    get: async (path: string, options?: RequestInit) => {
      return fetch(api.url(path), { method: 'GET', ...options });
    },

    post: async (path: string, data?: any, options?: RequestInit) => {
      return fetch(api.url(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        body: data ? JSON.stringify(data) : undefined,
        ...options
      });
    },

    // Специфичные методы
    health: () => api.get('/status/health'),

    flows: {
      list: () => api.get('/flows'),
      get: (name: string) => api.get(`/flows/${name}`),
      create: (data: any) => api.post('/flows', data),
      update: (name: string, data: any) => api.post(`/flows/${name}`, data),
      delete: (name: string) => fetch(api.url(`/flows/${name}`), { method: 'DELETE' })
    }
  };

  return api;
}
