import os from 'os';

export function detectOS() {
  const platform = os.platform();
  const arch = os.arch();

  const mapping = {
    linux: { osName: 'linux', ext: 'tar.gz' },
    darwin: { osName: 'osx', ext: 'tar.gz' },
    win32: { osName: 'win', ext: 'zip' }
  };

  const osInfo = mapping[platform];
  if (!osInfo) throw new Error(`Sistema operacional não suportado: ${platform}`);

  const archSuffix = arch === 'arm64' ? 'arm64' : 'x64';
  const runnerPlatform = `${osInfo.osName}-${archSuffix}`;

  return {
    platform,
    arch,
    osName: osInfo.osName,
    ext: osInfo.ext,
    runnerPlatform,
    isWindows: platform === 'win32',
    isLinux: platform === 'linux',
    isMac: platform === 'darwin'
  };
}

export function getRunnerFileName(osInfo, version) {
  // Os assets do GitHub incluem a versão (ex.: actions-runner-win-x64-2.319.1.zip).
  return `actions-runner-${osInfo.runnerPlatform}-${version}.${osInfo.ext}`;
}
