import { spawnSync } from 'child_process';
import { detectOS } from '../utils/os.js';
import { log, success } from '../utils/logger.js';

function quote(value) {
  // Aspas para preservar espaços; remove aspas embutidas para não quebrar o comando.
  return `"${String(value).replace(/"/g, '')}"`;
}

function run(command, cwd) {
  const result = spawnSync(command, { cwd, stdio: 'inherit', shell: true });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Comando falhou (código ${result.status}): ${command.split(' ')[0]}`);
  }
}

export function configureRunner(runnerDir, repo, token, name, workDir, asService) {
  const osInfo = detectOS();
  log('Configurando runner...');

  const url = `https://github.com/${repo}`;
  const script = osInfo.isWindows ? 'config.cmd' : './config.sh';

  const parts = [
    script,
    '--url', quote(url),
    '--token', quote(token),
    '--unattended',
    '--replace',
    '--name', quote(name),
    '--work', quote(workDir)
  ];

  // No Windows o próprio config instala e inicia o serviço.
  if (asService && osInfo.isWindows) {
    parts.push('--runasservice');
  }

  run(parts.join(' '), runnerDir);
  success('Runner configurado com sucesso');
}

// Instala/inicia como serviço no Linux/macOS (no Windows já foi via --runasservice).
export function installService(runnerDir) {
  const osInfo = detectOS();
  if (osInfo.isWindows) {
    success('Runner instalado como serviço');
    return;
  }
  log('Instalando serviço...');
  run('sudo ./svc.sh install', runnerDir);
  run('sudo ./svc.sh start', runnerDir);
  success('Serviço instalado e iniciado');
}

// Execução em primeiro plano (quando --service não é usado). Bloqueia até o runner parar.
export function startRunner(runnerDir) {
  const osInfo = detectOS();
  log('Iniciando runner...');
  const script = osInfo.isWindows ? 'run.cmd' : './run.sh';
  run(script, runnerDir);
  success('Runner encerrado');
}

export function removeRunner(runnerDir, token) {
  log('Removendo runner...');
  const osInfo = detectOS();
  const script = osInfo.isWindows ? 'config.cmd' : './config.sh';
  run([script, 'remove', '--token', quote(token)].join(' '), runnerDir);
  success('Runner removido');
}
