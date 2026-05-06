import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['docs/**', 'packages/schemastery/**'],
  typescript: {
    overrides: {
      'ts/no-namespace': 'off',
      'ts/no-empty-object-type': 'off',
      'ts/consistent-type-imports': 'off',
      'ts/no-unsafe-declaration-merging': 'off',
      'vue/no-unused-vars': 'off',
      'vue/no-deprecated-slot-attribute': 'off',
      'style/no-mixed-operators': 'off',
      'array-callback-return': 'off',
      'perfectionist/sort-imports': 'off',
      'valid-typeof': 'off',
    },
  },
  rules: {
    'no-restricted-syntax': ['error', {
      selector: 'TSAsExpression[typeAnnotation.type="TSAnyKeyword"]',
      message: 'Avoid using `as any`; please use proper type annotations.',
    }],
  },
}, {
  files: ['**/*.test.ts', '**/test/*.ts', '**/__tests__/**/*.ts'],
  rules: {
    'no-restricted-syntax': 'off',
  },
}, {
  files: ['app/electron-esm/electron.vite.config.ts', 'app/electron-esm/vite/**'],
  rules: {
    'no-restricted-syntax': 'off',
  },
}, {
  files: ['app/electron-esm/src/renderer/src/process-polyfill.ts'],
  rules: {
    'node/prefer-global/process': 'off',
  },
})
