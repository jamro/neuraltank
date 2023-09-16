
import CriticNetwork from './net/CriticNetwork.js';
import * as tf from '@tensorflow/tfjs';
import DualActorNetwork from './net/DualActorNetwork.js';
import Stats from './Stats.js';
import TrajectoryMemory from './TrajectoryMemory.js';


/*
Input:
  0: distance
  1: radar
  2: enemyDirection
  3: gunPos
  4: wall
  5: tankAngle
*/
const DRIVER_INPUT_MASK =  [1, 1, 1, 0, 1, 1, 1]
const SHOOTER_INPUT_MASK = [1, 1, 1, 1, 0, 1, 0]
const CRITIC_INPUT_MASK =  [1, 1, 1, 1, 1, 1, 1]

export const DRIVER_INPUT_INDICES =  DRIVER_INPUT_MASK.map((v, i) => v ? i : null).filter(v => v !== null)
export const SHOOTER_INPUT_INDICES = SHOOTER_INPUT_MASK.map((v, i) => v ? i : null).filter(v => v !== null)
export const CRITIC_INPUT_INDICES =  CRITIC_INPUT_MASK.map((v, i) => v ? i : null).filter(v => v !== null)

export const DRIVER_STATE_LEN = DRIVER_INPUT_INDICES.length
export const SHOOTER_STATE_LEN = SHOOTER_INPUT_INDICES.length + 1
export const CRITIC_STATE_LEN = CRITIC_INPUT_INDICES.length

export const SHOOTER_ACTION_LEN = 2
export const DRIVER_ACTION_LEN = 2

export default class Agent extends EventTarget {

  constructor(settings) {
    super()
    this.settings = settings

    this.shooterNet = new DualActorNetwork(SHOOTER_STATE_LEN, SHOOTER_ACTION_LEN, this.learningRate, 'shooter')
    this.driverNet = new DualActorNetwork(DRIVER_STATE_LEN, DRIVER_ACTION_LEN, this.learningRate, 'driver')
    this.criticNet = new CriticNetwork(CRITIC_STATE_LEN, 1, 10 * this.learningRate, 'critic')

    this.memory = new TrajectoryMemory()
    this.rewardWeights = settings.prop('rewardWeights')
    this.stats = new Stats()
  }

  filterInput(input, indices) {
    return indices.map(v => input[v])
  }

  sendStatus(msg) {
    const event = new Event('status')
    event.msg = msg
    this.dispatchEvent(event)
  } 

  get shooterEnabled() {
    return this.settings.prop('shooterEnabled')
  }

  get driverEnabled() {
    return this.settings.prop('driverEnabled')
  }

  get shooterTrainable() {
    return this.settings.prop('shooterTrainable')
  }

  get driverTrainable() {
    return this.settings.prop('driverTrainable')
  }

  get learningRate() {
    return this.settings.prop('learningRate')
  }

  onBatchStart() {
    this.stats.onEpochStart()
    this.rewardWeights = this.settings.prop('rewardWeights')
  }

  async onBatchFinish() {
    this.stats.onEpochEnd()
  }

  onGameStart() {
    this.stats.onEpisodeStart()
  }

  async onGameFinish() {
    this.stats.onEpisodeEnd()
  }

  weightRewards(rewards) {
    return rewards.map((r, i) => r * this.rewardWeights[i])
  }

  filterCriticInput(input) {
    return this.filterInput(input, CRITIC_INPUT_INDICES)
  }

  filterShooterInput(input) {
    return this.filterInput(input, SHOOTER_INPUT_INDICES)
  }

  filterDriverInput(input) {
    return this.filterInput(input, DRIVER_INPUT_INDICES)
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
    
    // driver
    let driverMean, driverStdDev, driverAction, driverActionArray
    if(this.driverEnabled) {
      [driverMean, driverStdDev, driverAction] = this.driverNet.exec(driverInputTensor);
    } else {
      driverMean = tf.tensor2d([Array(DRIVER_ACTION_LEN).fill(0)])
      driverStdDev = tf.tensor2d([Array(DRIVER_ACTION_LEN).fill(0.5)])
      driverAction = tf.tensor2d([Array(DRIVER_ACTION_LEN).fill(0)])
    }
    driverActionArray = driverAction.arraySync()[0]

    // shooter
    let shooterMean, shooterStdDev, shooterAction
    shooterInput.push(driverActionArray[0])
    const shooterInputTensor = tf.tensor2d([shooterInput]);
    if(this.shooterEnabled) {
      [shooterMean, shooterStdDev, shooterAction] = this.shooterNet.exec(shooterInputTensor);
    } else {
      shooterMean = tf.tensor2d([Array(SHOOTER_ACTION_LEN).fill(0)])
      shooterStdDev = tf.tensor2d([Array(SHOOTER_ACTION_LEN).fill(0.5)])
      shooterAction = tf.tensor2d([Array(SHOOTER_ACTION_LEN).fill(0)])
    }
    const shooterActionArray = shooterAction.arraySync()[0]

    this.stats.expectedValue = this.criticNet.exec(criticInputTensor).dataSync()[0]

    this.memory.add({
      criticInput: criticInput, 

      shooterInput: shooterInput, 
      shooterAction: shooterAction,
      shooterActionMean: shooterMean,
      shooterActionStdDev: shooterStdDev,

      driverInput: driverInput, 
      driverAction: driverAction,
      driverActionMean: driverMean,
      driverActionStdDev: driverStdDev,

      reward: scoreIncrement, 
      value: this.stats.expectedValue
    });

    this.memory.correct({
      reward: weightedCorrections
    })

    this.stats.onStepEnd()

    return [...driverActionArray, ...shooterActionArray];
  }

  async saveModel() {
    await this.shooterNet.save();
    await this.driverNet.save();
    await this.criticNet.save();
    await this.stats.save();
    this.dispatchEvent(new Event('save'))
  }

  async removeModel() {
    await this.shooterNet.remove();
    await this.driverNet.remove();
    await this.criticNet.remove();
    await this.stats.remove()
    this.dispatchEvent(new Event('remove'))
  }

  get dateSaved() {
    return this.shooterNet.dateSaved
  }

  async restoreModel() {
    const shooterStatus = await this.shooterNet.restore()
    const drivertatus = await this.driverNet.restore()
    const criticStatus = await this.criticNet.restore()

    this.shooterNet.learningRate = this.learningRate
    this.driverNet.learningRate = this.learningRate
    this.criticNet.learningRate = 10*this.learningRate

    if (shooterStatus && drivertatus && criticStatus) {
      await this.stats.restore()
      this.rewardWeights = this.settings.prop('rewardWeights')
      return true
    } else {
      return false
    }
  }

}