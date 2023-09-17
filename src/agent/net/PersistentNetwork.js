import * as tf from '@tensorflow/tfjs';

export default class PersistentNetwork extends EventTarget {

  constructor(inputCount=1, outputCount=1, learningRate=0.001, name='default') {
    super()
    this.name = name
    this.inputCount = inputCount
    this.outputCount = outputCount
    this._learningRate = learningRate
    this.saveDate = null
    this.net = tf.sequential();

    this.optimizer = tf.train.adam(this._learningRate);

    this.net = null
  }

  get learningRate() {
    return this._learningRate
  }

  set learningRate(v) {
    this._learningRate = v
    this.optimizer.learningRate = v
  }
  
  async save() {
    await this.saveAs(this.name)
  }

  async saveAs(name) {
    const savePath = getModelSavePath(name)
    await this.net.save(savePath);
    if(this.name == name) {
      const modelsInfo = await tf.io.listModels();
      this.saveDate = modelsInfo[savePath].saveDate
    }
  }

  async remove() {
    await tf.io.removeModel(getModelSavePath(this.name));
    this.saveDate = null
  }

  async restore() {
    return await this.restoreFrom(this.name)
  }

  async restoreFrom(name) {
    const savePath = getModelSavePath(name)
    const modelsInfo = await tf.io.listModels();
    if(!modelsInfo) return false
    if (savePath in modelsInfo) {
      this.net = await tf.loadLayersModel(savePath);
      this.net.compile({optimizer: this.optimizer, loss: tf.losses.meanSquaredError })
      this.saveDate = modelsInfo[savePath].saveDate

      this.inputCount = this.net.layers[0].batchInputShape[1]
      this.outputCount = this.net.layers[this.net.layers.length-1].outputShape[1]

      return true
    } else {
      return false
    }
  }

}

function getModelSavePath(name='default') {
  return `indexeddb://neural-tank-${name}`
}