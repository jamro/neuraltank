import * as tf from '@tensorflow/tfjs';
import PersistentNetwork from "./PersistentNetwork.js";

export default class CriticNetwork extends PersistentNetwork {

  constructor(inputCount=1, outputCount=1, learningRate=0.001, name='critic') {
    super(inputCount, outputCount, learningRate, name)

    this.optimizer = tf.train.adam(this.learningRate);

    this.net = tf.sequential();
    this.net.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [this.inputCount] }));
    this.net.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    this.net.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    this.net.add(tf.layers.dense({ units: this.outputCount, activation: 'linear' }));
    this.net.compile({optimizer: this.optimizer, loss: tf.losses.meanSquaredError })
  }

  exec(inputs) {
    return tf.tidy(() => this.net.predict(inputs));
  }

  async train(input, value, reward, discountRate) {
    const inputTensor = input.reshape([-1, input.shape[2]])
    const valueTensor = value.reshape([-1, value.shape[2]])
    const rewardTensor = reward.reshape([-1, reward.shape[2]])

    const rewardArray = rewardTensor.squeeze().arraySync()
    const numSteps = rewardArray.length
    const returnArray = new Array(numSteps).fill(0);

    let lastReward = 0
    for (let t = numSteps - 1; t >= 0; t--) {
      returnArray[t] = rewardArray[t] + discountRate * lastReward
      lastReward = returnArray[t]
    }
    const expectedValue = tf.tensor2d(returnArray, [returnArray.length, 1])

    const criticResults = await this.net.fit(inputTensor, expectedValue, {epochs: 1})
    const criticLoss = criticResults.history.loss[0]
    return criticLoss
  }

}