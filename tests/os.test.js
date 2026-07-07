import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectOS, getRunnerFileName } from '../src/utils/os.js';

test('getRunnerFileName monta o nome com a versão', () => {
  const osInfo = { runnerPlatform: 'win-x64', ext: 'zip' };
  assert.equal(getRunnerFileName(osInfo, '2.319.1'), 'actions-runner-win-x64-2.319.1.zip');
});

test('detectOS retorna uma plataforma coerente', () => {
  const info = detectOS();
  assert.match(info.runnerPlatform, /^(win|linux|osx)-(x64|arm64)$/);
  assert.equal(typeof info.isWindows, 'boolean');
});
