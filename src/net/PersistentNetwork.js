import * as tf from '@tensorflow/tfjs';

export default class PersistentNetwork {

  constructor(inputCount=1, outputCount=1, learningRate=0.001, name='default') {
    this.name = name
    this.inputCount = inputCount
    this.outputCount = outputCount
    this.learningRate = learningRate
    this.dateSaved = null
    this.net = tf.sequential();

    this.optimizer = tf.train.adam(this.learningRate);

    this.net = null
  }
  
  async save() {
    const savePath = getModelSavePath(this.name)
    await this.net.save(savePath);
    const modelsInfo = await tf.io.listModels();
    this.dateSaved = modelsInfo[savePath].dateSaved
  }

  async remove() {
    await tf.io.removeModel(getModelSavePath(this.name));
    this.dateSaved = null
  }

  async restore() {
    const savePath = getModelSavePath(this.name)
    const modelsInfo = await tf.io.listModels();
    if(!modelsInfo) return false
    if (savePath in modelsInfo) {
      this.net = await tf.loadLayersModel(savePath);
      this.net.compile({optimizer: this.optimizer, loss: tf.losses.meanSquaredError })
      this.dateSaved = modelsInfo[savePath].dateSaved

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