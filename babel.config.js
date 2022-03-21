module.exports = {
  'presets': [
      '@babel/env',
      ['@babel/react', {runtime: 'automatic'}],
      '@babel/preset-typescript',
  ],
  'plugins': [
      '@babel/plugin-proposal-class-properties',
  ]
}
