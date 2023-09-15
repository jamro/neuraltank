import * as tf from '@tensorflow/tfjs';
import TrajectoryMemory from './TrajectoryMemory.js';
import Agent, { DRIVER_ACTION_LEN, SHOOTER_ACTION_LEN } from './Agent.js';

const INIT_DISCOUNT_RATE = 0.99
const INIT_ENTROPY_COEFFICIENT = 0.005

export default class TrainableAgent extends Agent {
  constructor(settings) {
    super(settings)

    this.discountRate = INIT_DISCOUNT_RATE

    this.shooterNet.addEventListener('progress', (event) => {
      this.sendStatus(`Training shooter actor (${Math.round(event.progress*100)}%)...`)
    })
    this.driverNet.addEventListener('progress', (event) => {
      this.sendStatus(`Training driver actor (${Math.round(event.progress*100)}%)...`)
    })
  }

  get entropyCoefficient() {
    return this.settings.prop('entropyCoefficient')
  }

  onBatchStart() {
    super.onBatchStart()
    this.memory.resetAll()
  }

  async onBatchFinish() {
    await super.onBatchFinish()

    this.shooterNet.learningRate = this.learningRate
    this.driverNet.learningRate = this.learningRate
    this.criticNet.learningRate = 10*this.learningRate

    this.sendStatus("Training critic...")

    console.log("Training critic")
    this.stats.criticLoss = await this.criticNet.train(
      this.memory.epochMemory.criticInput,
      this.memory.epochMemory.value,
      this.memory.epochMemory.reward,
      this.discountRate
    )

    this.sendStatus("Training actor...")

    let shooterLoss = 0
    let shooterEntropy = 0
    if(this.shooterEnabled) {
      console.log("Training shooter actor");
      [shooterLoss, shooterEntropy] = await this.shooterNet.train(
        this.memory.epochMemory.shooterInput,
        this.memory.epochMemory.shooterAction,
        this.memory.epochMemory.reward,
        this.memory.epochMemory.value,
        this.discountRate,
        this.entropyCoefficient,
      )
    } else {
      console.log("Skipping training of shooter actor")
    }

    let driverLoss = 0
    let driverEntropy = 0
    if(this.driverEnabled) {
      console.log("Training driver actor");
      [driverLoss, driverEntropy] = await this.driverNet.train(
        this.memory.epochMemory.driverInput,
        this.memory.epochMemory.driverAction,
        this.memory.epochMemory.reward,
        this.memory.epochMemory.value,
        this.discountRate,
        this.entropyCoefficient,
      )
    } else {
      console.log("Skipping training of driver actor")
    }

    this.stats.shooterLoss = shooterLoss
    this.stats.shooterEntropy = shooterEntropy
    this.stats.driverLoss = driverLoss
    this.stats.driverEntropy = driverEntropy

    this.sendStatus("Training completed")
    console.log(`Shooter loss: ${this.stats.shooterLoss.toFixed(2)}, Driver loss: ${this.stats.driverLoss.toFixed(2)}, critic loss: ${this.stats.criticLoss.toFixed(2)}`)
    
  }

  onGameStart() {
    super.onGameStart()
    console.log("reset game memory")
    this.memory.resetGame()
  }

  act(input, rewards, corrections) {
    this.stats.onStepStart()
    const criticInput = this.filterCriticInput(input)
    const shooterInput = this.filterShooterInput(input)
    const driverInput = this.filterDriverInput(input)
    const criticInputTensor = tf.tensor2d([criticInput]);
    const driverInputTensor = tf.tensor2d([driverInput]);

    // process reward
    const weightedRewards = this.weightRewards(rewards)
    const weightedCorrections = corrections.map((v) => ({...v, value: v.value * this.rewardWeights[0]}))
    const scoreIncrement = this.stats.storeRewards(weightedRewards)

    // select actions
    this.stats.startBenchmark()

    // driver
    let driverAction
    if(this.driverEnabled) {
      [, , driverAction] = this.driverNet.exec(driverInputTensor);
    } else {
      driverAction = tf.tensor2d([Array(DRIVER_ACTION_LEN).fill(0)])
    }
    const driverActionArray = driverAction.arraySync()[0]

    shooterInput.push(driverActionArray[0])
    const shooterInputTensor = tf.tensor2d([shooterInput]);
    let shooterAction
    if(this.shooterEnabled) {
      [, , shooterAction] = this.shooterNet.exec(shooterInputTensor);
    } else {
      shooterAction = tf.tensor2d([Array(SHOOTER_ACTION_LEN).fill(0)])
    }
    const shooterActionArray = shooterAction.arraySync()[0]

    const expectedValue = this.criticNet.exec(criticInputTensor).dataSync()[0]
    this.stats.endBenchmark()

    // store trajectory
    this.stats.expectedValue = expectedValue

    this.memory.add({
      criticInput: criticInput, 

      shooterInput: shooterInput, 
      shooterAction: shooterAction,

      driverInput: driverInput, 
      driverAction: driverAction,

      reward: scoreIncrement, 
      value: expectedValue
    });

    this.memory.correct({
      reward: weightedCorrections
    })

    // update stats
    this.stats.onStepEnd()

    return [...driverActionArray, ...shooterActionArray];
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