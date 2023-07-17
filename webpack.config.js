const DotenvWebpackPlugin = require('dotenv-webpack');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: resolveRoot('src/index'),
  target: 'node',
  devtool: false,
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
              presets: ['@babel/preset-env', '@babel/preset-typescript'],
              plugins: ['@babel/plugin-transform-runtime'],
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

function resolveRoot(...segments) {
  return path.resolve(__dirname, ...segments);
}
