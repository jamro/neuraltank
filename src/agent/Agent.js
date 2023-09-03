
import CriticNetwork from './net/CriticNetwork.js';
import * as tf from '@tensorflow/tfjs';
import DualActorNetwork from './net/DualActorNetwork.js';
import Stats from './Stats.js';

const INIT_ACTOR_LEARNING_RATE = 0.001
const INIT_CRITIC_LEARNING_RATE = 0.01
const STATE_LEN = 2
const ACTION_LEN = 1

export default class Agent extends EventTarget {

  constructor() {
    super()

    this.actorNet = new DualActorNetwork(STATE_LEN, ACTION_LEN, INIT_ACTOR_LEARNING_RATE, 'actor')
    this.criticNet = new CriticNetwork(STATE_LEN, 1, INIT_CRITIC_LEARNING_RATE, 'critic')

    this.stats = new Stats()
  }


  get actorLearningRate() {
    return this.actorNet.optimizer.learningRate
  }

  get criticLearningRate() {
    return this.criticNet.optimizer.learningRate
  }

  onBatchStart() {
    this.stats.onEpochStart()
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

  act(input, rewards) {
    this.stats.storeRewards(rewards)
    const inputTensor = tf.tensor2d([input]);
    let [mean, stdDev, actions] = this.actorNet.exec(inputTensor);
    this.stats.expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]
    return actions.dataSync();
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

    if (actorStatus && criticStatus) {
      await this.stats.restore()
      return true
    } else {
      return false
    }
  }

}