function backendUrl() {
  return process.env.BACKEND_URL || 'http://localhost:3000';
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    throw new Error(`Não foi possível conectar ao backend (${backendUrl()}): ${err.message}`);
  }
}

export async function fetchSession(sessionId) {
  const response = await safeFetch(`${backendUrl()}/session/${sessionId}`);
  if (!response.ok) throw new Error(`Erro ao verificar sessão: ${response.status}`);
  return response.json();
}

export async function getRunnerToken(sessionId, repo) {
  const response = await safeFetch(`${backendUrl()}/runner/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, repo })
  });
  if (!response.ok) throw new Error(`Erro ao obter token: ${response.status}`);
  return response.json();
}

export async function getRemoveToken(sessionId, repo) {
  const response = await safeFetch(`${backendUrl()}/runner/remove-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, repo })
  });
  if (!response.ok) throw new Error(`Erro ao obter token de remoção: ${response.status}`);
  return response.json();
}

export function getAuthUrl(sessionId) {
  return `${backendUrl()}/auth/github?sessionId=${sessionId}`;
}
