const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, 'src', 'index.ts'),
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-modules-typescript-loader',
          'css-loader',
          'sass-loader',
        ],
      },
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".css", ".scss"]
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          context: path.resolve(__dirname, 'node_modules', 'jsbattle-engine', 'dist', 'js'),
          from: path.resolve(__dirname, 'node_modules', 'jsbattle-engine', 'dist', 'js', 'jsbattle*'),
          to: path.resolve(__dirname, 'dist', 'vendor')
        },
        {
          context: path.resolve(__dirname, 'node_modules', 'jsbattle-engine', 'dist', 'tanks'),
          from: path.resolve(__dirname, 'node_modules', 'jsbattle-engine', 'dist', 'tanks', '**', '*'),
          to: path.resolve(__dirname, 'dist', 'tanks')
        },
        {
          context: path.resolve(__dirname, 'node_modules', 'pixi.js', 'dist'),
          from: path.resolve(__dirname, 'node_modules', 'pixi.js', 'dist', 'pixi*'),
          to: path.resolve(__dirname, 'dist', 'vendor')
        }
      ],
    })
  ]
};
