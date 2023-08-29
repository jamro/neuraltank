import * as tf from '@tensorflow/tfjs';
import Memory from './Memory.js';
import Agent from './Agent.js';

const INIT_DISCOUNT_RATE = 0.98

export default class TrainableAgent extends Agent {
  constructor() {
    super()

    this.memory = new Memory()
    this.discountRate = INIT_DISCOUNT_RATE
    this.gameScores = [];

    this.stepCount = 0
    this.stepTotalDuration = 0
    this.stepAvgDuration = 0
  }

  onBatchStart() {
    this.memory.resetAll()
    this.criticLossHistory = []
    this.gameScores = [];
  }

  onBatchFinish() {
    this.trainActor()
  }

  onGameStart() {
    console.log("reset game memory")
    super.onGameStart()
    this.memory.resetGame()
    this.stepCount = 0
    this.stepTotalDuration = 0
  }

  train(input, totalScore) {
    const startTime = performance.now()
    const inputTensor = tf.tensor2d([input]);
    const scoreIncrement = totalScore - this.totalReward
    this.totalReward = totalScore
    const [mean, stdDev, action] = this.actorNet.exec(inputTensor);
    this.currentActions = action.dataSync();

    this.expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]
    this.memory.rememberGameStep({
      input: input, 
      action: action,
      mean: mean,
      stdDev: stdDev,
      reward: scoreIncrement, 
      value: this.expectedValue
    });

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
    this.benchmarkAvgDuration = this.benchmarkCount ? this.benchmarkTotalDuration / this.benchmarkCount : 0
    console.log(`Average step duration ${this.stepAvgDuration.toFixed(2)}ms`)

    console.log("Training critic")
    const criticLoss = await this.trainCritic()
    this.criticLossHistory.push(criticLoss)
  }

  trainActor() {
    const f = () => tf.tidy(() => {
      const input = this.memory.epochMemory.input.reshape([-1, this.memory.epochMemory.input.shape[2]])
      const [mean, stdDev, _] = this.actorNet.exec(input)

      const action = this.memory.epochMemory.action.reshape([-1, this.memory.epochMemory.action.shape[2]])
      const reward = this.memory.epochMemory.reward.reshape([-1, this.memory.epochMemory.reward.shape[2]])
      const value = this.memory.epochMemory.value.reshape([-1, this.memory.epochMemory.value.shape[2]])

      const nextValue = tf.slice2d(value, [1, 0], [-1, 1]).concat(tf.zeros([1,1]))
      const advantage = nextValue.mul(this.discountRate).add(reward).sub(value)

      const variance = tf.square(stdDev)
      const exponent = tf.mul(-0.5, tf.div(tf.sub(action, mean).square(), variance))
      const coefficient = tf.div(1, tf.mul(stdDev, Math.sqrt(Math.PI * 2)))
      const logProb = tf.add(tf.log(coefficient), exponent)

      const loss = logProb.mul(advantage)
      return tf.neg(loss).mean()
    })
    tf.tidy(() => this.actorNet.optimizer.minimize(f))
  }

  async trainCritic() {
    const input = tf.slice2d(this.memory.episodeMemory.input, [1, 0], [-1, -1])
    const nextValue = tf.slice2d(this.memory.episodeMemory.value, [1, 0], [-1, 1])
    const reward = tf.slice2d(this.memory.episodeMemory.reward, [1, 0], [-1, 1])
    const expectedValue = nextValue.mul(this.discountRate).add(reward).squeeze() // reward + discountRate * nextValue

    const criticResults = await this.criticNet.net.fit(input, expectedValue, {epochs: 1})
    const criticLoss = criticResults.history.loss[0]
    return criticLoss
  }

  async restoreModel() {
    if (await super.restoreModel()) {
      this.memory.resetAll()
      this.gameScores = []
      return true
    } else {
      return false
    }
  }

}