export async function api(path, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the server. Check that both terminals are running.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Request failed. Check the server terminal.');
  if (!data) throw new Error('No data received. Check the server terminal.');
  return data;
}
