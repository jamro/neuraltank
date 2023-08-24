import * as tf from '@tensorflow/tfjs';
import ActorNetwork from './net/ActorNetwork';
import Memory from './Memory';

const INIT_DISCOUNT_RATE = 0.98
const INIT_LEARNING_RATE = 0.005

export default class Agent extends EventTarget {
  constructor() {
    super()
    this.discountRate = INIT_DISCOUNT_RATE

    this.actorNet = new ActorNetwork(2, 1, INIT_LEARNING_RATE)

    this.memory = new Memory()
    this.gameScores = [];

    this.currentActions = null
    this.totalReward = 0
  }

  get learningRate() {
    return this.actorNet.optimizer.learningRate
  }

  onBatchStart() {
    this.memory.resetAll()
    this.gameScores = [];
  }

  onBatchFinish() {
    tf.tidy(() => this.actorNet.optimizer.applyGradients(this.memory.scaleAndAverageGradients(this.discountRate)));
  }

  onGameStart() {
    this.memory.resetGame()
    this.totalReward = 0
  }

  train(input, totalScore) {
    const inputTensor = tf.tensor2d([input]);
    const scoreIncrement = totalScore - this.totalReward
    this.totalReward = totalScore
    const gradients = tf.tidy(() => this.getGradientsAndSaveActions(inputTensor).grads );

    this.memory.rememberGameStep(gradients, scoreIncrement);

    return this.currentActions
  }

  onGameFinish() {
    this.gameScores.push(this.totalReward);
    this.memory.aggregateGameResults()
  }

  getGradientsAndSaveActions(inputTensor) {
    const f = () => tf.tidy(() => {
      let [mean, stdDev, actions] = this.actorNet.exec(inputTensor);
      this.currentActions = actions.dataSync();

      const variance = tf.square(stdDev)
      const exponent = tf.mul(-0.5, tf.div(tf.sub(actions, mean).square(), variance))
      const coefficient = tf.div(1, tf.mul(stdDev, Math.sqrt(Math.PI * 2)))
      const logProb = tf.add(tf.log(coefficient), exponent)

      return tf.neg(logProb).asScalar()
    });
    return tf.variableGrads(f);
  }

  pushGradients(record, gradients) {
    for (const key in gradients) {
      if (key in record) {
        record[key].push(gradients[key]);
      } else {
        record[key] = [gradients[key]];
      }
    }
  }

  async saveModel() {
    await this.actorNet.save();
    this.dispatchEvent(new Event('save'))
  }

  async removeModel() {
    await this.actorNet.remove();
    this.dispatchEvent(new Event('remove'))
  }

  get dateSaved() {
    return this.actorNet.dateSaved
  }

  async restoreModel() {
    if (await this.actorNet.restore()) {
      this.memory.resetAll()
      this.gameScores = []
  
      this.currentActions = null
      this.totalReward = 0

      this.discountRate = INIT_DISCOUNT_RATE
      return true
    } else {
      return false
    }
  }

}