import * as tf from '@tensorflow/tfjs';
import PersistentNetwork from "./PersistentNetwork.js";

const BATCH_SIZE = 128

export default class CriticNetwork extends PersistentNetwork {

  constructor(inputCount=1, outputCount=1, learningRate=0.001, name='critic') {
    super(inputCount, outputCount, learningRate, name)

    this.optimizer = tf.train.adam(this.learningRate);

    this.net = tf.sequential();
    this.net.add(tf.layers.dense({ units: 64, activation: 'linear', inputShape: [this.inputCount] }));
    this.net.add(tf.layers.leakyReLU());
    this.net.add(tf.layers.dense({ units: 32, activation: 'linear' }));
    this.net.add(tf.layers.leakyReLU());
    this.net.add(tf.layers.dense({ units: 32, activation: 'linear' }));
    this.net.add(tf.layers.leakyReLU());
    this.net.add(tf.layers.dense({ units: this.outputCount, activation: 'linear' }));
    this.net.compile({optimizer: this.optimizer, loss: tf.losses.meanSquaredError })
  }

  exec(inputs) {
    return tf.tidy(() => this.net.predict(inputs));
  }

  async train(i, v, r, discountRate) {
    const inputTensor = tf.concat(i)
    const valueTensor = tf.concat(v)
    const rewardTensor = tf.concat(r)

    const input = tf.slice2d(inputTensor, [1, 0], [-1, -1])
    const nextValue = tf.slice2d(valueTensor, [1, 0], [-1, 1])
    const reward = tf.slice2d(rewardTensor, [1, 0], [-1, 1])
    const expectedValue = nextValue.mul(discountRate).add(reward).squeeze() // reward + discountRate * nextValue

    const criticResults = await this.net.fit(input, expectedValue, {epochs: 1, batchSize: BATCH_SIZE})
    const criticLoss = criticResults.history.loss[0]
    return criticLoss
  }

}