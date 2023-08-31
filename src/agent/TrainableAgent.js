import * as tf from '@tensorflow/tfjs';
import TrajectoryMemory from './TrajectoryMemory.js';
import Agent from './Agent.js';

const INIT_DISCOUNT_RATE = 0.98

export default class TrainableAgent extends Agent {
  constructor() {
    super()

    this.memory = new TrajectoryMemory()
    this.discountRate = INIT_DISCOUNT_RATE
  }

  onBatchStart() {
    super.onBatchStart()
    this.memory.resetAll()
  }

  onBatchFinish() {
    super.onBatchFinish()
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
    super.onGameStart()
    console.log("reset game memory")
    this.memory.resetGame()
  }

  act(input, rewards) {
    this.stats.onStepStart()
    const inputTensor = tf.tensor2d([input]);

    // process reward
    const scoreIncrement = this.stats.storeRewards(rewards)
    // select actions
    this.stats.startBenchmark()
    const [, , action] = this.actorNet.exec(inputTensor);
    const expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]
    this.stats.endBenchmark()

    // store trajectory
    this.stats.expectedValue = expectedValue

    this.memory.add({
      input: input, 
      action: action,
      reward: scoreIncrement, 
      value: expectedValue
    });

    // update stats
    this.stats.onStepEnd()

    return action.dataSync();
  }

  async onGameFinish() {
    super.onGameFinish()
    this.memory.aggregateGameResults()

    console.log("Training critic")
    const criticLoss = await this.criticNet.train(
      this.memory.episodeMemory.input,
      this.memory.episodeMemory.value,
      this.memory.episodeMemory.reward,
      this.discountRate
    )
    this.stats.criticLossHistory.push(criticLoss)
  }

  async restoreModel() {
    if (await super.restoreModel()) {
      this.memory.resetAll()
      return true
    } else {
      return false
    }
  }

}