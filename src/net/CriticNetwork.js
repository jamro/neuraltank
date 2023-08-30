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

}