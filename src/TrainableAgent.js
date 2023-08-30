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
    const actorLoss = this.actorNet.train(
      this.memory.epochMemory.input,
      this.memory.epochMemory.action,
      this.memory.epochMemory.reward,
      this.memory.epochMemory.value,
      this.discountRate
    )
    console.log("Actor loss:", actorLoss)
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
    const [_, __, action] = this.actorNet.exec(inputTensor);
    this.currentActions = action.dataSync();

    this.expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]
    this.memory.add({
      input: input, 
      action: action,
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
    const criticLoss = await this.criticNet.train(
      this.memory.episodeMemory.input,
      this.memory.episodeMemory.value,
      this.memory.episodeMemory.reward,
      this.discountRate
    )
    this.criticLossHistory.push(criticLoss)
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