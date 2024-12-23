import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';
import jsxA11Y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});
const MAX_COMPLEXITY = 20;

export default [
  {
    ignores: ['**/node_modules/', '**/build/'],
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:jsx-a11y/recommended',
      'plugin:prettier/recommended',
      'plugin:jest/recommended',
    ),
  ),
  {
    languageOptions: {
      ecmaVersion: 12,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      'jsx-a11y': fixupPluginRules(jsxA11Y),
      prettier: fixupPluginRules(prettier),
      react: fixupPluginRules(react),
      jest: fixupPluginRules(jest),
    },
    rules: {
      'arrow-body-style': 'error',
      'block-scoped-var': 'error',
      camelcase: 'error',
      complexity: ['error', MAX_COMPLEXITY],
      'consistent-return': 'error',
      curly: 'error',
      'default-case-last': 'error',
      'default-param-last': 'error',
      eqeqeq: 'error',
      'func-style': ['error', 'expression'],
      'no-await-in-loop': 'error',
      'no-cond-assign': 'error',
      'no-console': 'warn',
      'no-const-assign': 'error',
      'no-dupe-args': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-duplicate-imports': 'error',
      'no-undef': 'error',
      'no-unused-vars': 'error',
      'prefer-const': 'error',
      'prefer-destructuring': 'error',
      'prefer-object-spread': 'error',
      'prettier/prettier': 'error',
      'require-await': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
