const DotenvWebpackPlugin = require('dotenv-webpack');
const path = require('path');

const resolveRoot = (...segments) => {
  return path.resolve(__dirname, ...segments);
};

module.exports = {
  target: 'node',
  mode: 'production',
  entry: resolveRoot('src/index'),
  target: 'node',
  devtool: 'source-map',
  output: {
    path: resolveRoot('dist'),
    filename: 'index.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-typescript'],
            },
          },
        ],
      },
    ],
  },
  plugins: [new DotenvWebpackPlugin()],
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
