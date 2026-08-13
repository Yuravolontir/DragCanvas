import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .history is the editor's backup folder - 1076 of the 1154 problems the
  // audit counted came from there, not from the code.
  globalIgnores(['dist', '.history', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // A leading underscore marks a binding that must exist but is not read.
      // Express identifies an error handler by its arity, so errorHandler has
      // to keep four parameters even though it never calls next - hence
      // argsIgnorePattern alongside the existing one for variables.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  {
    // Server-side files run in Node, not a browser: without this, `process`
    // and `Buffer` are reported as undefined everywhere on the backend.
    files: [
      'server.js',
      'routes.js',
      'features/**/*.js',
      'services/**/*.js',
      'jobs/**/*.js',
      'middlewares/**/*.js',
      'utils/**/*.js',
      'scripts/**/*.{js,mjs}',
      'tests/**/*.js',
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
