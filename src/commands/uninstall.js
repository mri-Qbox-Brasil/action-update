import path from 'path';
import fs from 'fs';
import { detectOS } from '../utils/os.js';
import { validateRepo } from '../utils/repo.js';
import { log, error, info } from '../utils/logger.js';
import { getRemoveToken } from '../services/apiClient.js';
import { authorize } from '../services/auth.js';
import { removeRunner } from '../services/runnerInstaller.js';

export async function uninstallCommand(repo, options) {
  try {
    validateRepo(repo);

    if (options.backend) {
      process.env.BACKEND_URL = options.backend;
    }

    const osInfo = detectOS();
    const runnerDir = path.resolve(`./runner-${osInfo.runnerPlatform}`);
    if (!fs.existsSync(runnerDir)) {
      throw new Error(`Runner não encontrado em ${runnerDir}`);
    }

    const sessionId = await authorize();

    log('Obtendo token de remoção...');
    const { token } = await getRemoveToken(sessionId, repo);

    removeRunner(runnerDir, token);
    fs.rmSync(runnerDir, { recursive: true, force: true });
    info(`Pasta removida: ${runnerDir}`);
  } catch (err) {
    error(err.message);
    process.exit(1);
  }
}
