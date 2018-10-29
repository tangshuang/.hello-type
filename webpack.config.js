module.exports = {
  mode: 'none',
  entry: __dirname + '/src/hello-type.js',
  devtool: 'source-map',
  output: {
    path: __dirname + '/dist',
    filename: 'hello-type.js',
    library: 'hello-type',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
      },
    ],
  },
}
