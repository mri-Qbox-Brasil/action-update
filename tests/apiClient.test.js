import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAuthUrl, getRunnerToken } from '../src/services/apiClient.js';

test('getAuthUrl usa BACKEND_URL', () => {
  process.env.BACKEND_URL = 'http://example.test:1234';
  assert.equal(getAuthUrl('abc'), 'http://example.test:1234/auth/github?sessionId=abc');
  delete process.env.BACKEND_URL;
});

test('erro amigável quando o backend está offline', async () => {
  process.env.BACKEND_URL = 'http://127.0.0.1:1';
  await assert.rejects(() => getRunnerToken('s', 'a/b'), /Não foi possível conectar ao backend/);
  delete process.env.BACKEND_URL;
});
