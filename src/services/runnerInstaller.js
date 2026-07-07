import path from 'path';
import { fileURLToPath } from 'url';
import { detectOS } from '../utils/os.js';
import { log, success, error } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function configureRunner(runnerDir, repo, token, name, workDir) {
  const osInfo = detectOS();
  log('Configurando runner...');

  const url = `https://github.com/${repo}`;
  const configScript = osInfo.isWindows ? 'config.cmd' : './config.sh';
  const configPath = path.join(runnerDir, configScript);

  const args = [
    `--url ${url}`,
    `--token ${token}`,
    '--unattended',
    `--name ${name}`,
    `--work ${workDir}`
  ].join(' ');

  const cmd = osInfo.isWindows ? `${configPath} ${args}` : `${configPath} ${args}`;
  
  const { execSync } = await import('child_process');
  try {
    execSync(cmd, { cwd: runnerDir, stdio: 'inherit' });
    success('Runner configurado com sucesso');
  } catch (err) {
    error(`Falha na configuração: ${err.message}`);
    throw err;
  }
}

export async function startRunner(runnerDir) {
  const osInfo = detectOS();
  log('Iniciando runner...');

  const runScript = osInfo.isWindows ? 'run.cmd' : './run.sh';
  const runPath = path.join(runnerDir, runScript);

  const cmd = osInfo.isWindows ? runPath : runPath;

  const { spawn } = await import('child_process');
  const child = spawn(cmd, { cwd: runnerDir, stdio: 'inherit', shell: true });

  child.on('close', (code) => {
    if (code !== 0) error(`Runner encerrado com código: ${code}`);
    else success('Runner encerrado');
  });

  return child;
}
