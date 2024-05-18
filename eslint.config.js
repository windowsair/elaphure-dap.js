import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'

export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  stylistic.configs.customize({
    braceStyle: '1tbs',
    commaDangle: 'never',
    indent: 2,
    quotes: 'single',
    semi: false,
    jsx: true
  }),
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/indent': ['error', 2, {
        CallExpression: { arguments: 'first' },
        FunctionExpression: { parameters: 'first' },
        FunctionDeclaration: { parameters: 'first' }
      }],
      // align with first argument when using if block
      '@stylistic/indent-binary-ops': ['error', 4],
      '@stylistic/max-len': ['error', { code: 100 }],
      '@stylistic/operator-linebreak': ['error', 'after'],
      '@stylistic/quote-props': ['error', 'consistent'],
      'space-before-blocks': 'error'
    }
  }
]
