import * as tf from '@tensorflow/tfjs';
import ActorNetwork from './net/ActorNetwork';
import Memory from './Memory';
import CriticNetwork from './net/CriticNetwork';

const INIT_DISCOUNT_RATE = 0.98
const INIT_ACTOR_LEARNING_RATE = 0.001
const INIT_CRITIC_LEARNING_RATE = 0.01
const STATE_LEN = 2
const ACTION_LEN = 1

export default class Agent extends EventTarget {
  constructor() {
    super()
    
    this.actorNet = new ActorNetwork(STATE_LEN, ACTION_LEN, INIT_ACTOR_LEARNING_RATE)
    this.criticNet = new CriticNetwork(STATE_LEN, 1, INIT_CRITIC_LEARNING_RATE)

    this.memory = new Memory(INIT_DISCOUNT_RATE)
    this.gameScores = [];

    this.currentActions = null
    this.totalReward = 0

    this.expectedValue = 0
    this.stepCount = 0
    this.stepTotalDuration = 0
    this.stepAvgDuration = 0
  }

  get actorLearningRate() {
    return this.actorNet.optimizer.learningRate
  }

  get criticLearningRate() {
    return this.criticNet.optimizer.learningRate
  }

  onBatchStart() {
    this.memory.resetAll()
    this.gameScores = [];
  }

  onBatchFinish() {
    tf.tidy(() => this.actorNet.optimizer.applyGradients(this.memory.scaleAndAverageGradients()));
  }

  onGameStart() {
    console.log("reset game memory")
    this.memory.resetGame()
    this.totalReward = 0
    this.stepCount = 0
    this.stepTotalDuration = 0
  }

  train(input, totalScore) {
    const startTime = performance.now()
    const inputTensor = tf.tensor2d([input]);
    const scoreIncrement = totalScore - this.totalReward
    this.totalReward = totalScore
    const gradients = tf.tidy(() => this.getGradientsAndSaveActions(inputTensor).grads );

    this.expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]
    this.memory.rememberGameStep(input, gradients, scoreIncrement, this.expectedValue);

    // performance stats
    const duration = performance.now() - startTime 
    this.stepCount += 1
    this.stepTotalDuration += duration

    return this.currentActions
  }

  async onGameFinish() {
    this.gameScores.push(this.totalReward);
    this.memory.aggregateGameResults()

    this.stepAvgDuration = this.stepCount ? this.stepTotalDuration / this.stepCount : 0
    console.log(`Average step duration ${this.stepAvgDuration.toFixed(2)}ms`)

    console.log("Getting critic train data")
    const [x, y] = this.memory.getCriticTrainData()

    console.log("Training critic")
    await this.criticNet.net.fit(x, y, {epochs: 1})
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
    await this.criticNet.save();
    this.dispatchEvent(new Event('save'))
  }

  async removeModel() {
    await this.actorNet.remove();
    await this.criticNet.remove();
    this.dispatchEvent(new Event('remove'))
  }

  get dateSaved() {
    return this.actorNet.dateSaved
  }

  async restoreModel() {
    const actorStatus = await this.actorNet.restore()
    const criticStatus = await this.criticNet.restore()

    if (actorStatus && criticStatus) {
      this.memory.resetAll()
      this.gameScores = []
  
      this.currentActions = null
      this.totalReward = 0

      return true
    } else {
      return false
    }
  }

}