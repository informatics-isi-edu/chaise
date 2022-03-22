// if NODE_DEV defined properly, uset it. otherwise set it to production.
const nodeDevs = ['production', 'development'];
let mode = process.env.NODE_ENV;
if (nodeDevs.indexOf(mode) == -1) {
  mode = nodeDevs[0];
}

module.exports = {
  'presets': [
      '@babel/env',
      ['@babel/preset-react', {
        runtime: 'automatic',
        development: mode === 'development',
        importSource: (mode === 'development') ? '@welldone-software/why-did-you-render' : 'react',
      }],
      '@babel/preset-typescript',
  ],
  'plugins': [
      '@babel/plugin-proposal-class-properties',
  ]
}
