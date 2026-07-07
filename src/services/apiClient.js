function backendUrl() {
  return process.env.BACKEND_URL || 'http://localhost:3000';
}

export async function fetchSession(sessionId) {
  const response = await fetch(`${backendUrl()}/session/${sessionId}`);
  if (!response.ok) throw new Error(`Erro ao verificar sessão: ${response.status}`);
  return response.json();
}

export async function getRunnerToken(sessionId, repo) {
  const response = await fetch(`${backendUrl()}/runner/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, repo })
  });
  if (!response.ok) throw new Error(`Erro ao obter token: ${response.status}`);
  return response.json();
}

export function getAuthUrl(sessionId) {
  return `${backendUrl()}/auth/github?sessionId=${sessionId}`;
}
