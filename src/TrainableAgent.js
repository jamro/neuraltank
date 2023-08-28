import * as tf from '@tensorflow/tfjs';
import Memory from './Memory.js';
import Agent from './Agent.js';

const INIT_DISCOUNT_RATE = 0.98

export default class TrainableAgent extends Agent {
  constructor() {
    super()

    this.memory = new Memory(INIT_DISCOUNT_RATE)
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
    tf.tidy(() => this.actorNet.optimizer.applyGradients(this.memory.scaleAndAverageGradients()));
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
    const gradients = tf.tidy(() => this.getGradientsAndSaveActions(inputTensor).grads );

    this.startBenchmark()
    this.expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]
    this.endBenchmark()
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
    this.benchmarkAvgDuration = this.benchmarkCount ? this.benchmarkTotalDuration / this.benchmarkCount : 0
    console.log(`Average step duration ${this.stepAvgDuration.toFixed(2)}ms`)

    console.log("Getting critic train data")
    const [x, y] = this.memory.getCriticTrainData()

    console.log("Training critic")
    const criticResults = await this.criticNet.net.fit(x, y, {epochs: 1})
    const criticLoss = criticResults.history.loss[0]
    this.criticLossHistory.push(criticLoss)
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