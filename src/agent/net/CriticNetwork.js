import * as tf from '@tensorflow/tfjs';
import PersistentNetwork from "./PersistentNetwork.js";

const BATCH_SIZE = 128

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

  async train(i, v, r, discountRate) {
    const inputTensor = i.reshape([-1, i.shape[2]])
    const valueTensor = v.reshape([-1, v.shape[2]])
    const rewardTensor = r.reshape([-1, r.shape[2]])

    const mean = tf.mean(rewardTensor);
    const stdDev = tf.sqrt(tf.mean(tf.square(rewardTensor.sub(mean))));
    const normalizedRewards = rewardTensor.sub(mean).div(stdDev);

    const input = tf.slice2d(inputTensor, [1, 0], [-1, -1])
    const nextValue = tf.slice2d(valueTensor, [1, 0], [-1, 1])
    const reward = tf.slice2d(normalizedRewards, [1, 0], [-1, 1])
    const expectedValue = nextValue.mul(discountRate).add(reward).squeeze() // reward + discountRate * nextValue

    const criticResults = await this.net.fit(input, expectedValue, {epochs: 1, batchSize: BATCH_SIZE})
    const criticLoss = criticResults.history.loss[0]
    return criticLoss
  }

}