import crypto from 'crypto';
import path from 'path';
import open from 'open';
import { detectOS } from '../utils/os.js';
import { log, success, error, info, warn } from '../utils/logger.js';
import { fetchSession, getRunnerToken, getAuthUrl } from '../services/apiClient.js';
import { downloadRunner, extractRunner } from '../services/runnerDownloader.js';
import { configureRunner, startRunner } from '../services/runnerInstaller.js';

const POLL_INTERVAL = 2000;
const POLL_TIMEOUT = 120000;

export async function installCommand(repo, options) {
  try {
    validateRepo(repo);

    // Propaga o --backend para o apiClient, que resolve a URL em tempo de chamada.
    if (options.backend) {
      process.env.BACKEND_URL = options.backend;
    }

    const sessionId = crypto.randomUUID();
    info(`Session ID: ${sessionId}`);
    info(`Repo: ${repo}`);
    info(`Runner name: ${options.name}`);
    info(`Work dir: ${options.workdir}`);

    const authUrl = getAuthUrl(sessionId);
    log('Abrindo navegador para autenticação...');
    info(`URL: ${authUrl}`);
    
    await open(authUrl);
    log('Aguardando autorização no navegador...');

    const session = await pollSession(sessionId);
    success('Autorização concluída!');

    log('Obtendo token do runner...');
    const { token } = await getRunnerToken(sessionId, repo);
    info('Token obtido com sucesso');

    const osInfo = detectOS();
    const runnerDir = path.resolve(`./runner-${osInfo.runnerPlatform}`);
    
    const { filePath } = await downloadRunner(runnerDir);
    await extractRunner(filePath, osInfo, runnerDir);

    await configureRunner(runnerDir, repo, token, options.name, options.workdir);

    log('Iniciando runner...');
    await startRunner(runnerDir);

  } catch (err) {
    error(err.message);
    process.exit(1);
  }
}

function validateRepo(repo) {
  if (!/^[^/]+\/[^/]+$/.test(repo)) {
    throw new Error('Formato inválido. Use: owner/repo');
  }
}

async function pollSession(sessionId) {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT) {
    try {
      const session = await fetchSession(sessionId);
      
      if (session.status === 'READY') {
        return session;
      }
      
      if (session.status === 'ERROR') {
        throw new Error('Erro na autenticação');
      }

      process.stdout.write('.');
      await sleep(POLL_INTERVAL);
    } catch (err) {
      if (err.message.includes('Erro na autenticação')) throw err;
      warn(`Erro no polling: ${err.message}`);
      await sleep(POLL_INTERVAL);
    }
  }

  throw new Error('Timeout: autorização não concluída em 2 minutos');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
