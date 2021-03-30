import babel from '@rollup/plugin-babel';

export default {
  input: 'src/game.js',
  output: {
    file: './index.js',
    format: 'iife'
  },
  plugins: [
    babel({
      babelHelpers: 'bundled',
      "plugins": [
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-nullish-coalescing-operator",
        "@babel/plugin-proposal-optional-chaining"
      ]
    })
  ]
}
