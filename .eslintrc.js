module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
  ],
  rules: {
    'max-len': ['warn', { code: 110, ignoreComments: true }],
    'max-classes-per-file': ['warn', 1],
    'no-underscore-dangle': 0,
    'prefer-destructuring': 0,
    'no-plusplus': 0,
    'react/function-component-definition': 0,
    'import/no-unresolved': 0, // webpack will handle this
    'import/extensions': 0, // webpack will handle this
    'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
    'no-param-reassign': 0,
    'one-var': 0,
    'one-var-declaration-per-line': 0,
    'no-restricted-syntax': 'warn',
    'no-continue': 0,
    eqeqeq: 'warn',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
    'prefer-const': 'warn'
  },
  settings: {
    'import/resolver': 'webpack',
    'react': {
      'version': 'detect'
    }
  },
  globals: {
    JSX: true,
  },
};
