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
    this.policyNet.add(tf.layers.dense({ units: 4, activation: 'elu', inputShape: [2] }));
    this.policyNet.add(tf.layers.dense({ units: 4, activation: 'elu' }));
    this.policyNet.add(tf.layers.dense({units: 1}));

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

    return this.currentActions[0]
  }

  onGameFinish() {
    this.gameScores.push(this.totalReward);
    this.pushGradients(this.allGradients, this.gameGradients);
    this.allRewards.push(this.gameRewards);
  }

  getGradientsAndSaveActions(inputTensor) {
    const f = () => tf.tidy(() => {
      const [logits, actions] = this.getLogitsAndActions(inputTensor);
      this.currentActions = actions.dataSync();
      const labels = tf.sub(1, tf.tensor2d(this.currentActions, actions.shape));
      return tf.losses.sigmoidCrossEntropy(labels, logits).asScalar();
    });
    return tf.variableGrads(f);
  }

  getLogitsAndActions(inputs) {
    return tf.tidy(() => {
      const logits = this.policyNet.predict(inputs);

      // Get the probability of the leftward action.
      const leftProb = tf.sigmoid(logits);
      // Probabilites of the left and right actions.
      const leftRightProbs = tf.concat([leftProb, tf.sub(1, leftProb)], 1);
      const actions = tf.multinomial(leftRightProbs, 1, null, true);
      return [logits, actions];
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