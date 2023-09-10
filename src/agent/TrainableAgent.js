import * as tf from '@tensorflow/tfjs';
import TrajectoryMemory from './TrajectoryMemory.js';
import Agent from './Agent.js';

const INIT_DISCOUNT_RATE = 0.99

export default class TrainableAgent extends Agent {
  constructor() {
    super()

    this.discountRate = INIT_DISCOUNT_RATE

    this.actorNet.addEventListener('progress', (event) => {
      this.sendStatus(`Training actor (${Math.round(event.progress*100)}%)...`)
    })
  }

  onBatchStart() {
    super.onBatchStart()
    this.memory.resetAll()
  }

  async onBatchFinish() {
    await super.onBatchFinish()

    this.sendStatus("Training critic...")

    console.log("Training critic")
    this.stats.criticLoss = await this.criticNet.train(
      this.memory.epochMemory.input,
      this.memory.epochMemory.value,
      this.memory.epochMemory.reward,
      this.discountRate
    )

    this.sendStatus("Training actor...")

    console.log("Training actor")
    const [loss, entropy] = await this.actorNet.train(
      this.memory.epochMemory.input,
      this.memory.epochMemory.action,
      this.memory.epochMemory.reward,
      this.memory.epochMemory.value,
      this.discountRate
    )

    this.stats.actorLoss = loss
    this.stats.entropy = entropy

    this.sendStatus("Training completed")
    console.log(`Actor loss: ${this.stats.actorLoss.toFixed(2)}, critic loss: ${this.stats.criticLoss.toFixed(2)}`)
    
  }

  onGameStart() {
    super.onGameStart()
    console.log("reset game memory")
    this.memory.resetGame()
  }

  act(input, rewards, corrections) {
    this.stats.onStepStart()
    const inputTensor = tf.tensor2d([input]);

    // process reward
    const weightedRewards = this.weightRewards(rewards)
    const weightedCorrections = corrections.map((v) => ({...v, value: v.value * this.rewardWeights[0]}))
    const scoreIncrement = this.stats.storeRewards(weightedRewards)

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

    this.memory.correct({
      reward: weightedCorrections
    })

    // update stats
    this.stats.onStepEnd()

    return action.dataSync();
  }

  async onGameFinish() {
    super.onGameFinish()
    this.memory.aggregateGameResults()
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