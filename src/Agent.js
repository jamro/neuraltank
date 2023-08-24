import * as tf from '@tensorflow/tfjs';
import ActorNetwork from './net/ActorNetwork';
import Memory from './Memory';

const INIT_DISCOUNT_RATE = 0.98
const INIT_LEARNING_RATE = 0.005

function discountRewards(rewards, discountRate) {
  const discountedBuffer = tf.buffer([rewards.length]);
  let prev = 0;
  for (let i = rewards.length - 1; i >= 0; --i) {
    const current = discountRate * prev + rewards[i];
    discountedBuffer.set(current, i);
    prev = current;
  }
  return discountedBuffer.toTensor();
}

function discountAndNormalizeRewards(rewardSequences, discountRate) {
  return tf.tidy(() => {
    const discounted = [];
    for (const sequence of rewardSequences) {
      discounted.push(discountRewards(sequence, discountRate))
    }
    // Compute the overall mean and stddev.
    const concatenated = tf.concat(discounted);
    const mean = tf.mean(concatenated);
    const std = tf.sqrt(tf.mean(tf.square(concatenated.sub(mean))));
    // Normalize the reward sequences using the mean and std.
    const normalized = discounted.map(rs => rs.sub(mean).div(std));
    return normalized;
  });
}

function scaleAndAverageGradients(allGradients, normalizedRewards) {
  return tf.tidy(() => {
    const gradients = {};
    for (const varName in allGradients) {
      gradients[varName] = tf.tidy(() => {
        // Stack gradients together.
        const varGradients = allGradients[varName].map(
            varGameGradients => tf.stack(varGameGradients));
        // Expand dimensions of reward tensors to prepare for multiplication
        // with broadcasting.
        const expandedDims = [];
        for (let i = 0; i < varGradients[0].rank - 1; ++i) {
          expandedDims.push(1);
        }
        const reshapedNormalizedRewards = normalizedRewards.map(
            rs => rs.reshape(rs.shape.concat(expandedDims)));
        for (let g = 0; g < varGradients.length; ++g) {
          // This mul() call uses broadcasting.
          varGradients[g] = varGradients[g].mul(reshapedNormalizedRewards[g]);
        }
        // Concatenate the scaled gradients together, then average them across
        // all the steps of all the games.
        return tf.mean(tf.concat(varGradients, 0), 0);
      });
    }
    return gradients;
  });
}

export default class Agent extends EventTarget {
  constructor() {
    super()
    this.discountRate = INIT_DISCOUNT_RATE

    this.actorNet = new ActorNetwork(2, 1, INIT_LEARNING_RATE)

    this.memory = new Memory()
    this.gameScores = [];

    this.currentActions = null
    this.totalReward = 0
  }

  get learningRate() {
    return this.actorNet.optimizer.learningRate
  }

  onBatchStart() {
    this.memory.resetAll()
    this.gameScores = [];
  }

  onBatchFinish() {
    tf.tidy(() => {
      const normalizedRewards = discountAndNormalizeRewards(this.memory.allRewards, this.discountRate);
      this.actorNet.optimizer.applyGradients(scaleAndAverageGradients(this.memory.allGradients, normalizedRewards));
    });
    tf.dispose(this.memory.allGradients);
  }

  onGameStart() {
    this.memory.resetGame()
    this.totalReward = 0
  }

  train(input, totalScore) {
    const inputTensor = tf.tensor2d([input]);
    const scoreIncrement = totalScore - this.totalReward
    this.totalReward = totalScore
    const gradients = tf.tidy(() => this.getGradientsAndSaveActions(inputTensor).grads );

    this.memory.rememberGameStep(gradients, scoreIncrement);

    return this.currentActions
  }

  onGameFinish() {
    this.gameScores.push(this.totalReward);
    this.memory.aggregateGameResults()
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

  async saveModel() {
    await this.actorNet.save();
    this.dispatchEvent(new Event('save'))
  }

  async removeModel() {
    await this.actorNet.remove();
    this.dispatchEvent(new Event('remove'))
  }

  get dateSaved() {
    return this.actorNet.dateSaved
  }

  async restoreModel() {
    if (await this.actorNet.restore()) {
      this.memory.resetAll()
      this.gameScores = []
  
      this.currentActions = null
      this.totalReward = 0

      this.discountRate = INIT_DISCOUNT_RATE
      return true
    } else {
      return false
    }
  }

}