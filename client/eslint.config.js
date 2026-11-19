import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['**/playwright.config.js', '**/tests/e2e/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/context/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // These screens intentionally load remote data in effects; the state
    // updates happen after asynchronous requests, not during render.
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
])
