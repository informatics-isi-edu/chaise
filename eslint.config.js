const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const jsxa11y = require('eslint-plugin-jsx-a11y');
const globals = require('globals');

module.exports = [
  // ignore patterns
  {
    ignores: [
      'common/**/*',
      'lib/**/*',
      'styles/**/*',
      'config/*'
    ]
  },

  // base config for all files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        JSX: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxa11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // ------------------ general ------------------
      'quotes': ['error', 'single'],
      'max-len': ['warn', { code: 150, ignoreComments: true }],
      'max-classes-per-file': ['warn', 1],
      'no-underscore-dangle': 0,
      'prefer-destructuring': 0,
      'no-plusplus': 0,
      'import/no-unresolved': 0, // webpack will handle this
      'import/extensions': 0, // webpack will handle this
      'no-param-reassign': 0,
      'one-var': 0,
      'one-var-declaration-per-line': 0,
      'no-restricted-syntax': 'warn',
      'no-continue': 0,
      eqeqeq: 'warn',
      'prefer-const': 'warn',
      'jsx-quotes': ['warn', 'prefer-single'],
      'no-restricted-imports': ['error', {
        'patterns': ['.*']
      }],
      // disable base rule in favor of @typescript-eslint version below
      'no-use-before-define': 'off',
      'no-extra-boolean-cast': 'warn', // it's harmless

      // ------------------ react ------------------
      'react/function-component-definition': 0,
      'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
      'react/jsx-uses-react': 0,
      'react/react-in-jsx-scope': 0,
      // downgrade to warning - useful for catching mutations but strict on declaration order
      'react-hooks/immutability': 'warn',

      // ------------------ typescript ------------------
      '@typescript-eslint/no-duplicate-enum-values': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      // disabled: creates too many false positives in React components where
      // const functions are defined before return but used in effects
      '@typescript-eslint/no-use-before-define': 'off',

      // ------------------ testing ------------------
      '@typescript-eslint/no-floating-promises': 'warn'
    },
  },

  // TypeScript specific config with project reference
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
  },
];
