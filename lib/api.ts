export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Có lỗi xảy ra');
  return data as T;
}

export function formatNumber(value: unknown) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n);
}
