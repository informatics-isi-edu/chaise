module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
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
    'react-hooks',
    '@typescript-eslint',
  ],
  rules: {
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

    // ------------------ react ------------------
    'react/function-component-definition': 0,
    'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
    'react/jsx-uses-react': 0,
    'react/react-in-jsx-scope': 0,

    // ------------------ typescript ------------------
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
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
  // ignore the old code
  ignorePatterns: [
    'common/**/*', 'lib/**/*', 'styles/**/*',
    // we might want to remove the following later:
    'test/e2e/*', 'config/*'
  ]
};
