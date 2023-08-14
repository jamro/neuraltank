const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src', 'public'),
    },
    compress: true,
    port: 9000,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/public" },
        { from: "node_modules/jsbattle-engine/dist/js/jsbattle.min.js", to: "js/" },
        { from: "node_modules/jsbattle-engine/dist/tanks/lib/tank.js", to: "tanks/lib/" },
        { from: "node_modules/jsbattle-engine/dist/img", to: 'img'},
      ],
    }),
  ],
};