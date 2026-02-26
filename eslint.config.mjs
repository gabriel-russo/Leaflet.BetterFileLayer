// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: { '@typescript-eslint/no-namespace': 'off' },
    extends: [],
    settings: {
      'import/resolver': {
        node: {
          paths: ['src'],
        },
      },
    },
  }
);
