export function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export async function apiPost(url: string, data: Record<string, any> | FormData): Promise<Response> {
  const csrf = getCsrfToken();
  const isForm = typeof FormData !== 'undefined' && data instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isForm) {
    headers['Content-Type'] = 'application/json';
  }
  if (csrf) {
    headers['X-CSRFToken'] = csrf;
  }

  return fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers,
    body: isForm ? (data as FormData) : JSON.stringify(data),
  });
}
