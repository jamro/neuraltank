const path = require('path');
const TankAiPostProcessPlugin = require('./tools/TankAiPostProcessPlugin.js');

module.exports = {
  entry: path.join(__dirname, 'src', 'tankAI', 'index.ts'),
  output: {
    library: 'TankAI',
    libraryTarget: 'var',
    filename: 'aiScript.js',
    path: path.resolve(__dirname, 'src', 'tankAI')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  plugins: [
    new TankAiPostProcessPlugin()
  ]
};
