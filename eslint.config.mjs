import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const ignoreConfig = { ignores: ['app/**', '**/lib/**', 'packages/yakumo/**', 'node_modules/**'] };

export default [
  ignoreConfig,

  ...tseslint.config(
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        globals: {
          ...globals.browser,
          ...globals.es2021,
          ...globals.node,
        },
      },
      linterOptions: {
        reportUnusedDisableDirectives: true,
      },
      settings: {
        'import/resolver': {
          typescript: true,
          node: true,
        },
      },
      plugins: {
        import: importPlugin,
        'react-refresh': reactRefreshPlugin,
      },
    },

    eslint.configs.recommended,

    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: ['./tsconfig.base.json', './packages/*/tsconfig.json'],
        },
      },
    },
    
    ...tseslint.configs.recommended,
    ...compat.config({
      extends: [
        'plugin:import/recommended',
        'plugin:import/electron',
        'plugin:import/typescript',
      ],
    }),

    {
      rules: {
        'import/no-unresolved': [
          'error',
          {
            commonjs: true,
            caseSensitive: true,
            ignore: ['electron', '\\.s?css$'],
          },
        ],
        'import/order': [
          'error',
          {
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            'newlines-between': 'ignore',
          },
        ],
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-unsafe-declaration-merging': 'off',
        '@typescript-eslint/no-unused-vars': [
          1,
          { argsIgnorePattern: '^_|^config$' },
        ],
      },
    }
  )
];
