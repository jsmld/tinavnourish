// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsx_a11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  // Globals + ignores
  {
    ignores: [
      'dist/**',
      '.vercel/**',
      '.astro/**',
      'node_modules/**',
      'pnpm-lock.yaml',
      'public/**',
      'src/env.d.ts',
    ],
  },

  // Node globals for config files (astro.config.mjs uses `URL`, etc.)
  {
    files: ['**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: {
        URL: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // React + JSX a11y for .tsx islands
  {
    files: ['**/*.tsx', '**/*.jsx'],
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    ...jsx_a11y.flatConfigs.recommended,
    settings: {
      react: { version: 'detect' },
    },
  },

  // React hooks rules — required for any component using hooks.
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Astro component frontmatter & scripts
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
  },

  // Project-specific relaxations
  {
    rules: {
      // Astro template files often use HTML attributes that look like unused vars.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react/prop-types': 'off',
    },
  },
);
