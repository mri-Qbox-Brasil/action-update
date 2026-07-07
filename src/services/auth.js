import crypto from 'crypto';
import open from 'open';
import { log, success, info, warn } from '../utils/logger.js';
import { fetchSession, getAuthUrl } from './apiClient.js';

const POLL_INTERVAL = 2000;
const POLL_TIMEOUT = 120000;

// Abre o navegador para o consentimento OAuth e faz polling até a sessão ficar READY.
export async function authorize() {
  const sessionId = crypto.randomUUID();
  info(`Session ID: ${sessionId}`);

  const authUrl = getAuthUrl(sessionId);
  log('Abrindo navegador para autenticação...');
  info(`URL: ${authUrl}`);

  await open(authUrl);
  log('Aguardando autorização no navegador...');

  await pollSession(sessionId);
  success('Autorização concluída!');
  return sessionId;
}

async function pollSession(sessionId) {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT) {
    let session;
    try {
      session = await fetchSession(sessionId);
    } catch (err) {
      // A sessão pode ainda não existir até o navegador abrir /auth/github.
      warn(`Aguardando sessão: ${err.message}`);
      await sleep(POLL_INTERVAL);
      continue;
    }

    if (session.status === 'READY') return session;
    if (session.status === 'ERROR') throw new Error('Erro na autenticação');

    process.stdout.write('.');
    await sleep(POLL_INTERVAL);
  }

  throw new Error('Timeout: autorização não concluída em 2 minutos');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
