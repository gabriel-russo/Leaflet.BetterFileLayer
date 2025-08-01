// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
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
