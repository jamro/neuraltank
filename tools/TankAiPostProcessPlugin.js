const path = require('path');
const fs = require('fs');

class TankAiPostProcessPlugin {

  constructor(options) {
    this._templatePath = (options && options.template) ? options.template : path.resolve(__dirname, '..', 'src', 'TankAI', 'template.js');
  }

  apply(compiler) {
    compiler.hooks.shouldEmit.tap('TankAiPostProcessPlugin', (compilation) => {
      compilation.chunks.forEach((chunk) => {
        chunk.files.forEach(filename => {
          let template = fs.readFileSync(this._templatePath, 'utf8');
          let code = compilation.assets[filename]._value;
          code = template.replace(/\/\*[ *]*INJECT_TANK_AI[ *]*\*\//, code);
          code = 'export default ' + JSON.stringify(code) + ";";
          compilation.assets[filename]._value = code;
        });
      });
    });



    compiler.hooks.afterEmit.tap('TankAiPostProcessPlugin', (compilation) => {
      let inputFile = path.resolve(compilation.runtimeTemplate.outputOptions.path, compilation.runtimeTemplate.outputOptions.filename);
      let outputFile = inputFile.replace(/\.js$/, '.ts');
      fs.copyFile(inputFile, outputFile, (err) => {
        if (err) throw err;
        console.log('TypeScript output created!');
      });
    });
  }
}

module.exports = TankAiPostProcessPlugin;
