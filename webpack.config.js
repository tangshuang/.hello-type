module.exports = {
  mode: 'none',
  entry: __dirname + '/src/hello-type.js',
  devtool: 'source-map',
  output: {
    path: __dirname + '/dist',
    filename: 'hello-type.js',
    library: 'hello-type',
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
}
