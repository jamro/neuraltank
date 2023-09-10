
import CriticNetwork from './net/CriticNetwork.js';
import * as tf from '@tensorflow/tfjs';
import DualActorNetwork from './net/DualActorNetwork.js';
import Stats from './Stats.js';
import TrajectoryMemory from './TrajectoryMemory.js';

const STATE_LEN = 4
const ACTION_LEN = 2

export default class Agent extends EventTarget {

  constructor(settings) {
    super()
    this.settings = settings

    this.actorNet = new DualActorNetwork(STATE_LEN, ACTION_LEN, this.learningRate, 'actor')
    this.criticNet = new CriticNetwork(STATE_LEN, 1, 10 * this.learningRate, 'critic')

    this.memory = new TrajectoryMemory()
    this.rewardWeights = settings.prop('rewardWeights')
    this.stats = new Stats()
  }

  sendStatus(msg) {
    const event = new Event('status')
    event.msg = msg
    this.dispatchEvent(event)
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

  act(input, rewards, corrections) {
    this.stats.onStepStart()
    const inputTensor = tf.tensor2d([input]);

    // process reward
    const weightedRewards = this.weightRewards(rewards)
    const weightedCorrections = corrections.map((v) => ({...v, value: v.value * this.rewardWeights[0]}))
    const scoreIncrement = this.stats.storeRewards(weightedRewards)
    
    let [mean, stdDev, action] = this.actorNet.exec(inputTensor);
    this.stats.expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]

    this.memory.add({
      input: input, 
      action: action,
      actionMean: mean,
      actionStdDev: stdDev,
      reward: scoreIncrement, 
      value: this.stats.expectedValue
    });

    this.memory.correct({
      reward: weightedCorrections
    })

    this.stats.onStepEnd()

    return action.dataSync();
  }

  async saveModel() {
    await this.actorNet.save();
    await this.criticNet.save();
    await this.stats.save();
    this.dispatchEvent(new Event('save'))
  }

  async removeModel() {
    await this.actorNet.remove();
    await this.criticNet.remove();
    await this.stats.remove()
    this.dispatchEvent(new Event('remove'))
  }

  get dateSaved() {
    return this.actorNet.dateSaved
  }

  async restoreModel() {
    const actorStatus = await this.actorNet.restore()
    const criticStatus = await this.criticNet.restore()

    this.actorNet.learningRate = this.learningRate
    this.criticNet.learningRate = 10*this.learningRate

    if (actorStatus && criticStatus) {
      await this.stats.restore()
      this.rewardWeights = this.settings.prop('rewardWeights')
      return true
    } else {
      return false
    }
  }

}