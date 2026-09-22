/**
 * MoonFinance (moonfinanceme.com.br)
 * Serviço de Conexão Frontend React <-> Backend PHP MySQL
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('moonfinanceme.com.br')) {
      return 'https://api.moonfinanceme.com.br/api';
    }
  }
  return '/backend/api';
};

export const API_BASE_URL = getApiBaseUrl();

export async function fetchApiData<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    let tenantId = '';
    let userId = '';
    let token = '';
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('moon_user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          tenantId = userObj.tenantId || '';
          userId = userObj.id || '';
          token = userObj.token || '';
        } catch (e) {}
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      'X-User-Id': userId,
      ...options?.headers as Record<string, string>,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers,
      ...options,
    });

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined' && !endpoint.includes('auth/')) {
        console.warn(`[API MoonFinance] 401 Não Autorizado. Redirecionando para login.`);
        localStorage.removeItem('moon_user');
        window.location.href = '/login';
        return null;
      }
      console.warn(`[API MoonFinance] Resposta da API (${endpoint}):`, res.statusText);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.warn(`[API MoonFinance] Conexão com ${endpoint} em modo fallback:`, error);
    return null;
  }
}
