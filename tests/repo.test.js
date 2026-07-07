import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRepo } from '../src/utils/repo.js';

test('validateRepo aceita owner/repo', () => {
  assert.doesNotThrow(() => validateRepo('owner/repo'));
});

test('validateRepo rejeita formatos inválidos', () => {
  assert.throws(() => validateRepo('sembarra'));
  assert.throws(() => validateRepo('a/b/c'));
  assert.throws(() => validateRepo(''));
  assert.throws(() => validateRepo(undefined));
});
