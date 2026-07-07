import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['**/node_modules/**', 'runner-*/**'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
];
