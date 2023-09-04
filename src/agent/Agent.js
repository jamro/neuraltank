
import CriticNetwork from './net/CriticNetwork.js';
import * as tf from '@tensorflow/tfjs';
import DualActorNetwork from './net/DualActorNetwork.js';
import Stats from './Stats.js';
import TrajectoryMemory from './TrajectoryMemory.js';

const INIT_ACTOR_LEARNING_RATE = 0.0005
const INIT_CRITIC_LEARNING_RATE = 0.005
const STATE_LEN = 4
const ACTION_LEN = 1
const INIT_REWARD_WEIGHTS = [1, 0, 1, 1]

export default class Agent extends EventTarget {

  constructor() {
    super()

    this.actorNet = new DualActorNetwork(STATE_LEN, ACTION_LEN, INIT_ACTOR_LEARNING_RATE, 'actor')
    this.criticNet = new CriticNetwork(STATE_LEN, 1, INIT_CRITIC_LEARNING_RATE, 'critic')

    this.memory = new TrajectoryMemory()


    this.rewardWeights = INIT_REWARD_WEIGHTS

    this.stats = new Stats()
  }

  sendStatus(msg) {
    const event = new Event('status')
    event.msg = msg
    this.dispatchEvent(event)
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

  weightRewards(rewards) {
    return rewards.map((r, i) => r * this.rewardWeights[i])
  }

  act(input, rewards) {
    const weightedRewards = this.weightRewards(rewards)
    const scoreIncrement = this.stats.storeRewards(weightedRewards)
    const inputTensor = tf.tensor2d([input]);
    let [mean, stdDev, action] = this.actorNet.exec(inputTensor);
    this.stats.expectedValue = this.criticNet.exec(inputTensor).dataSync()[0]

    this.memory.add({
      input: input, 
      action: action,
      actionMean: mean,
      actionMin: mean.sub(stdDev).clipByValue(-1, 1),
      actionMax: mean.add(stdDev).clipByValue(-1, 1),
      reward: scoreIncrement, 
      value: this.stats.expectedValue
    });

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

    if (actorStatus && criticStatus) {
      await this.stats.restore()
      this.rewardWeights = INIT_REWARD_WEIGHTS
      return true
    } else {
      return false
    }
  }

}