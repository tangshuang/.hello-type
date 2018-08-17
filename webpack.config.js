module.exports = {
  mode: 'none',
  entry: __dirname + '/src/hello-type.js',
  output: {
    path: __dirname + '/dist',
    filename: 'hello-type.js',
    library: 'HelloTypeLib',
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