const makeConfig = (filename, bundlename, libraryname) => ({
  mode: 'none',
  entry: __dirname + '/src/' + filename + '.js',
  devtool: 'source-map',
  output: {
    path: __dirname,
    filename: bundlename + '.js',
    library: libraryname,
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
  makeConfig('index', 'typeschema', 'typeschema'),
  makeConfig(),
]
