import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { execSync } from 'child_process';
import { detectOS, getRunnerFileName } from '../utils/os.js';
import { log, success, info } from '../utils/logger.js';

async function getLatestRunnerVersion() {
  const response = await fetch('https://api.github.com/repos/actions/runner/releases/latest', {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'meu-runner' }
  });
  if (!response.ok) throw new Error(`Falha ao obter versão do runner: ${response.status}`);
  const data = await response.json();
  return data.tag_name.replace(/^v/, '');
}

export async function downloadRunner(targetDir) {
  const osInfo = detectOS();
  const version = await getLatestRunnerVersion();
  const fileName = getRunnerFileName(osInfo, version);
  const fileUrl = `https://github.com/actions/runner/releases/download/v${version}/${fileName}`;
  const outputPath = path.join(targetDir, fileName);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  log(`Baixando runner ${version} para ${osInfo.runnerPlatform}...`);
  info(`URL: ${fileUrl}`);

  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Falha no download: ${response.status}`);

  // response.body é um WHATWG ReadableStream; converte para stream do Node antes de gravar.
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(outputPath));
  success(`Download concluído: ${fileName}`);

  return { filePath: outputPath, osInfo };
}

export async function extractRunner(filePath, osInfo, targetDir) {
  log('Extraindo arquivos...');

  if (osInfo.isWindows) {
    extractZip(filePath, targetDir);
  } else {
    extractTarGz(filePath, targetDir);
  }

  fs.unlinkSync(filePath);
  success('Extração concluída');
}

function extractZip(filePath, targetDir) {
  execSync(
    `powershell -Command "Expand-Archive -LiteralPath '${filePath}' -DestinationPath '${targetDir}' -Force"`,
    { stdio: 'inherit' }
  );
}

function extractTarGz(filePath, targetDir) {
  execSync(`tar -xzf "${filePath}" -C "${targetDir}"`, { stdio: 'inherit' });
}
