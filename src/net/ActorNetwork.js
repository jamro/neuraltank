import * as tf from '@tensorflow/tfjs';
import PersistentNetwork from "./PersistentNetwork";

export default class ActorNetwork extends PersistentNetwork {

  constructor(inputCount=1, outputCount=1, learningRate=0.001, name='actor') {
    super(inputCount, outputCount, learningRate, name)

    this.optimizer = tf.train.adam(this.learningRate);

    this.net = tf.sequential();
    this.net.add(tf.layers.dense({ units: 16, activation: 'tanh', inputShape: [this.inputCount] }));
    this.net.add(tf.layers.dense({ units: 16, activation: 'tanh' }));
    this.net.add(tf.layers.dense({ units: 2*this.outputCount, activation: 'linear' }));
    this.net.compile({optimizer: this.optimizer, loss: tf.losses.meanSquaredError })
  }

  exec(inputs) {
    return tf.tidy(() => {
      const output = this.net.predict(inputs);
      const mean = tf.tanh(output.slice([0, 0], [-1, 1]));
      const logStdDev = output.slice([0, 1], [-1, 1]);
      const stdDev = tf.exp(logStdDev);
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