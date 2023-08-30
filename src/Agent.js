
import ActorNetwork from './net/ActorNetwork.js';
import CriticNetwork from './net/CriticNetwork.js';
import * as tf from '@tensorflow/tfjs';
import DualActorNetwork from './net/DualActorNetwork.js';

const INIT_ACTOR_LEARNING_RATE = 0.001
const INIT_CRITIC_LEARNING_RATE = 0.01
const STATE_LEN = 2
const ACTION_LEN = 1

export default class Agent extends EventTarget {

  constructor() {
    super()

    this.actorNet = new DualActorNetwork(STATE_LEN, ACTION_LEN, INIT_ACTOR_LEARNING_RATE, 'actor')
    this.criticNet = new CriticNetwork(STATE_LEN, 1, INIT_CRITIC_LEARNING_RATE, 'critic')

    this.currentActions = null
    this.expectedValue = 0
    this.totalReward = 0
    this.rewardComponents = null
    this.epochRewardComponents = null

    this.benchmarkStartTime = 0
    this.benchmarkCount = 0
    this.benchmarkTotalDuration = 0
    this.benchmarkAvgDuration = 0

    this.criticLossHistory = []
    this.rewardHistory = [];
  }

  startBenchmark() {
    this.benchmarkStartTime = performance.now()
  }

  endBenchmark() {
    const duration = performance.now() - this.benchmarkStartTime 
    this.benchmarkCount += 1
    this.benchmarkTotalDuration += duration
  }

  get actorLearningRate() {
    return this.actorNet.optimizer.learningRate
  }

  get criticLearningRate() {
    return this.criticNet.optimizer.learningRate
  }

  onBatchStart() {

  }

  onBatchFinish() {

  }

  onGameStart() {
    this.totalReward = 0
    this.rewardComponents = null
  }

  async onGameFinish() {
    
  }

  storeRewards(rewards) {
    const scoreIncrement = rewards.reduce((s, a) => s + a, 0);
    this.totalReward += scoreIncrement
    if(!this.rewardComponents) {
      this.rewardComponents = [...rewards]
    } else {
      this.rewardComponents = rewards.reduce((r, v, i) => {
        r[i] += v
        return r
      }, this.rewardComponents)
    }
    return scoreIncrement
  }

  act(input, rewards) {
    this.storeRewards(rewards)
    const inputTensor = tf.tensor2d([input]);
    let [mean, stdDev, actions] = this.actorNet.exec(inputTensor);
    this.currentActions = actions.dataSync();
    this.expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]
    return this.currentActions
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
      this.currentActions = null
      this.totalReward = 0
      return true
    } else {
      return false
    }
  }

}