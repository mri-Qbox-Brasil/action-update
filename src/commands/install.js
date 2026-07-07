import path from 'path';
import { detectOS } from '../utils/os.js';
import { validateRepo } from '../utils/repo.js';
import { log, success, error, info } from '../utils/logger.js';
import { getRunnerToken } from '../services/apiClient.js';
import { authorize } from '../services/auth.js';
import { downloadRunner, extractRunner } from '../services/runnerDownloader.js';
import { configureRunner, startRunner, installService } from '../services/runnerInstaller.js';

export async function installCommand(repo, options) {
  try {
    validateRepo(repo);

    // Propaga o --backend para o apiClient, que resolve a URL em tempo de chamada.
    if (options.backend) {
      process.env.BACKEND_URL = options.backend;
    }

    info(`Repo: ${repo}`);
    info(`Runner name: ${options.name}`);
    info(`Work dir: ${options.workdir}`);

    const sessionId = await authorize();

    log('Obtendo token do runner...');
    const { token } = await getRunnerToken(sessionId, repo);
    info('Token obtido com sucesso');

    const osInfo = detectOS();
    const runnerDir = path.resolve(`./runner-${osInfo.runnerPlatform}`);

    const { filePath } = await downloadRunner(runnerDir);
    await extractRunner(filePath, osInfo, runnerDir);

    configureRunner(runnerDir, repo, token, options.name, options.workdir, options.service);

    if (options.service) {
      installService(runnerDir);
      success('Runner instalado como serviço.');
    } else {
      startRunner(runnerDir);
    }
  } catch (err) {
    error(err.message);
    process.exit(1);
  }
}
