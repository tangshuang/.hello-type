const makeConfig = (name) => ({
  mode: 'none',
  entry: __dirname + '/src/' + name + '.js',
  devtool: 'source-map',
  output: {
    path: __dirname,
    filename: name + '.js',
    library: 'txpe',
    libraryTarget: 'umd',
    globalObject: 'typeof window !== undefined ? window : typeof global !== undefined ? global : typeof self !== undefined ? self : this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
      },
    ],
  },
  optimization: {
    usedExports: true,
    sideEffects: true,
  },
})

module.exports = [
  makeConfig('index'),
  makeConfig('txpe'),
]
