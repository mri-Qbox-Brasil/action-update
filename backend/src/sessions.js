// Store de sessões em memória com TTL. Simples de propósito — para produção,
// trocar por um store compartilhado (Redis) se houver múltiplas instâncias.

const TTL_MS = 10 * 60 * 1000; // 10 minutos (a CLI faz polling por ~2 min).

const sessions = new Map();

export function createSession(id) {
  sessions.set(id, { status: 'PENDING', token: null, createdAt: Date.now() });
}

export function getSession(id) {
  const session = sessions.get(id);
  if (!session) return null;

  if (Date.now() - session.createdAt > TTL_MS) {
    sessions.delete(id);
    return null;
  }
  return session;
}

export function setSessionReady(id, token) {
  const session = sessions.get(id);
  if (!session) return;
  session.status = 'READY';
  session.token = token;
}

export function setSessionError(id) {
  const session = sessions.get(id);
  if (!session) return;
  session.status = 'ERROR';
}
