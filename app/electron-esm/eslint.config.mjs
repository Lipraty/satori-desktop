export * from '../../eslint.config.mjs'

// import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
// import tseslint from '@electron-toolkit/eslint-config-ts'
// import eslintPluginVue from 'eslint-plugin-vue'
// import vueParser from 'vue-eslint-parser'

// export default tseslint.config(
//   { ignores: ['**/node_modules', '**/dist', '**/out'] },
//   tseslint.configs.recommended,
//   eslintPluginVue.configs['flat/recommended'],
//   {
//     files: ['**/*.vue'],
//     languageOptions: {
//       parser: vueParser,
//       parserOptions: {
//         ecmaFeatures: {
//           jsx: true,
//         },
//         extraFileExtensions: ['.vue'],
//         parser: tseslint.parser,
//       },
//     },
//   },
//   {
//     files: ['**/*.{ts,mts,tsx,vue}'],
//     rules: {
//       'vue/require-default-prop': 'off',
//       'vue/multi-word-component-names': 'off',
//       'vue/block-lang': [
//         'error',
//         {
//           script: {
//             lang: 'ts',
//           },
//         },
//       ],
//     },
//   },
//   eslintConfigPrettier,
// )
