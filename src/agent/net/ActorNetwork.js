import * as tf from '@tensorflow/tfjs';
import PersistentNetwork from "./PersistentNetwork.js";

export default class ActorNetwork extends PersistentNetwork {

  constructor(inputCount=1, outputCount=1, learningRate=0.001, name='actor') {
    super(inputCount, outputCount, learningRate, name)

    this.optimizer = tf.train.adam(this.learningRate);

    this.net = tf.sequential();
    this.net.add(tf.layers.dense({ units: 64, activation: 'linear', inputShape: [this.inputCount] }));
    this.net.add(tf.layers.leakyReLU());
    this.net.add(tf.layers.dense({ units: 32, activation: 'linear' }));
    this.net.add(tf.layers.leakyReLU());
    this.net.add(tf.layers.dense({ units: 32, activation: 'linear' }));
    this.net.add(tf.layers.leakyReLU());
    this.net.add(tf.layers.dense({ units: 2*this.outputCount, activation: 'linear' }));
    this.net.compile({optimizer: this.optimizer, loss: tf.losses.meanSquaredError })
  }

  exec(inputs) {
    return tf.tidy(() => {
      const output = this.net.predict(inputs);
      const mean = tf.tanh(output.slice([0, 0], [-1, this.outputCount]));
      let stdDev = tf.tanh(output.slice([0, this.outputCount], [-1, -1]));
      stdDev = stdDev.div(4).add(0.5)
      const unscaledActions = tf.add(mean, tf.mul(stdDev, tf.randomNormal(mean.shape)));
      const scaledActions = tf.clipByValue(unscaledActions, -1, 1);

      return [mean, stdDev, scaledActions];
    });
  }

  async restore() {
    const result = await super.restore()
    if(result) {
      this.outputCount /= 2
    }
    return result
  }

}