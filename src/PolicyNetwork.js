import * as tf from '@tensorflow/tfjs';

const INIT_DISCOUNT_RATE = 0.98
const INIT_LEARNING_RATE = 0.01

const MODEL_SAVE_PATH = 'indexeddb://neural-tank';

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

export default class PolicyNetwork extends EventTarget {
  constructor() {
    super()
    this.discountRate = INIT_DISCOUNT_RATE
    this.optimizer = tf.train.adam(INIT_LEARNING_RATE);

    this.policyNet = tf.sequential();
    this.policyNet.add(tf.layers.dense({ units: 16, activation: 'tanh', inputShape: [2] }));
    this.policyNet.add(tf.layers.dense({ units: 16, activation: 'tanh' }));
    this.policyNet.add(tf.layers.dense({ units: 2, activation: 'linear' }));

    this.allGradients = [];
    this.allRewards = [];
    this.gameScores = [];

    this.gameRewards = [];
    this.gameGradients = [];

    this.currentActions = null
    this.totalReward = 0
    this.dateSaved = null
  }

  get learningRate() {
    return this.optimizer.learningRate
  }

  onBatchStart() {
    this.allGradients = [];
    this.allRewards = [];
    this.gameScores = [];
  }

  onBatchFinish() {
    tf.tidy(() => {
      const normalizedRewards = discountAndNormalizeRewards(this.allRewards, this.discountRate);
      this.optimizer.applyGradients(scaleAndAverageGradients(this.allGradients, normalizedRewards));
    });
    tf.dispose(this.allGradients);
  }

  onGameStart() {
    this.gameRewards = [];
    this.gameGradients = [];
    this.totalReward = 0
  }

  train(input, totalScore) {
    const inputTensor = tf.tensor2d([input]);
    const scoreIncrement = totalScore - this.totalReward
    this.totalReward = totalScore
    const gradients = tf.tidy(() => this.getGradientsAndSaveActions(inputTensor).grads );

    this.pushGradients(this.gameGradients, gradients);
    this.gameRewards.push(scoreIncrement);

    return this.currentActions
  }

  onGameFinish() {
    this.gameScores.push(this.totalReward);
    this.pushGradients(this.allGradients, this.gameGradients);
    this.allRewards.push(this.gameRewards);
  }

  getGradientsAndSaveActions(inputTensor) {
    const f = () => tf.tidy(() => {
      let [mean, stdDev, actions] = this.getDistributionsAndActions(inputTensor);
      this.currentActions = actions.dataSync();

      const variance = tf.square(stdDev)
      const exponent = tf.mul(-0.5, tf.div(tf.sub(actions, mean).square(), variance))
      const coefficient = tf.div(1, tf.mul(stdDev, Math.sqrt(Math.PI * 2)))
      const logProb = tf.add(tf.log(coefficient), exponent)

      return tf.neg(logProb).asScalar()
    });
    return tf.variableGrads(f);
  }

  getDistributionsAndActions(inputs) {
    return tf.tidy(() => {
      const output = this.policyNet.predict(inputs);
      const mean = tf.tanh(output.slice([0, 0], [-1, 1]));
      const logStdDev = output.slice([0, 1], [-1, 1]);
      const stdDev = tf.exp(logStdDev);
      const unscaledActions = tf.add(mean, tf.mul(stdDev, tf.randomNormal(mean.shape)));
      const scaledActions = tf.clipByValue(unscaledActions, -1, 1);
      return [mean, stdDev, scaledActions];
    });
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
    await this.policyNet.save(MODEL_SAVE_PATH);
    const modelsInfo = await tf.io.listModels();
    this.dateSaved = modelsInfo[MODEL_SAVE_PATH].dateSaved
    this.dispatchEvent(new Event('save'))
  }

  async removeModel() {
    this.dispatchEvent(new Event('remove'))
    await tf.io.removeModel(MODEL_SAVE_PATH);
    this.dateSaved = null
    this.dispatchEvent(new Event('remove'))
  }

  async restoreModel() {
    const modelsInfo = await tf.io.listModels();
    if(!modelsInfo) return false
    if (MODEL_SAVE_PATH in modelsInfo) {
      this.policyNet = await tf.loadLayersModel(MODEL_SAVE_PATH);

      this.allGradients = [];
      this.allRewards = [];
      this.gameScores = [];
  
      this.gameRewards = [];
      this.gameGradients = [];
  
      this.currentActions = null
      this.totalReward = 0

      this.dateSaved = modelsInfo[MODEL_SAVE_PATH].dateSaved

      this.discountRate = INIT_DISCOUNT_RATE
      this.optimizer = tf.train.adam(INIT_LEARNING_RATE);
      return true
    } else {
      return false
    }
  }

}