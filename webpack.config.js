const path = require('path');
const DotenvPlugin = require('dotenv-webpack');

module.exports = {
  entry: path.resolve(__dirname, './src/index'),
  mode: 'production',
  target: 'node',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index.js',
    clean: true,
  },
  externals: {
    express: "require('express')",
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
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
  plugins: [new DotenvPlugin()],
  resolve: {
    extensions: ['.js', '.ts'],
  },
};
