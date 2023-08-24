import * as tf from '@tensorflow/tfjs';

export default class Memory {
  constructor() {
    this.resetAll()
  }

  rememberGameStep(gradients, reward) {
    this.pushGradients(this.gameGradients, gradients);
    this.gameRewards.push(reward);
  }

  aggregateGameResults() {
    this.pushGradients(this.allGradients, this.gameGradients);
    this.allRewards.push(this.gameRewards);
  }

  resetAll() {
    this.allGradients = [];
    this.allRewards = [];
    this.resetGame()
  }

  resetGame() {
    this.gameRewards = [];
    this.gameGradients = [];
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

  discountRewards(rewards, discountRate) {
    const discountedBuffer = tf.buffer([rewards.length]);
    let prev = 0;
    for (let i = rewards.length - 1; i >= 0; --i) {
      const current = discountRate * prev + rewards[i];
      discountedBuffer.set(current, i);
      prev = current;
    }
    return discountedBuffer.toTensor();
  }

  discountAndNormalizeRewards(discountRate) {
    return tf.tidy(() => {
      const discounted = [];
      for (const sequence of this.allRewards) {
        discounted.push(this.discountRewards(sequence, discountRate))
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

  scaleAndAverageGradients(discountRate) {
    return tf.tidy(() => {
      const normalizedRewards = this.discountAndNormalizeRewards(discountRate);
      const gradients = {};
      for (const varName in this.allGradients) {
        gradients[varName] = tf.tidy(() => {
          // Stack gradients together.
          const varGradients = this.allGradients[varName].map(varGameGradients => tf.stack(varGameGradients));
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
}

