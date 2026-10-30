export async function api(path, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: { 'X-Energy-Client': 'web', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the server. Check that both terminals are running.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('energy:session-expired'));
    }
    throw Object.assign(new Error(data?.message || 'Request failed. Check the server terminal.'), { status: response.status });
  }
  if (!data) throw new Error('No data received. Check the server terminal.');
  return data;
}
