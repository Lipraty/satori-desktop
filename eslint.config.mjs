import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['docs/**'],
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
    },
  },
})
