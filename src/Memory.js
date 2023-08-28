import * as tf from '@tensorflow/tfjs';

export default class Memory {
  constructor(discountRate) {
    this.discountRate = discountRate
    this.resetAll()
  }

  rememberGameStep(input, gradients, reward, value) {
    if(this.gameRewards.length > 0) {
      const prevReward = this.gameRewards[this.gameRewards.length-1]
      const prevValue = this.gameValues[this.gameValues.length-1]
      const advantage = prevReward + this.discountRate * value - prevValue
      this.gameAdvantages.push(advantage)
    }

    this.pushGradients(this.gameGradients, gradients);
    this.gameRewards.push(reward);
    this.gameValues.push(value)
    this.gameInputs.push(input)
  }

  aggregateGameResults() {
    if(this.gameRewards.length > 0) {
      const prevReward = this.gameRewards[this.gameRewards.length-1]
      const prevValue = this.gameValues[this.gameValues.length-1]
      const advantage = prevReward - prevValue
      this.gameAdvantages.push(advantage)
    }

    this.pushGradients(this.allGradients, this.gameGradients);
    this.allRewards.push(this.gameRewards);
    this.allAdvantages.push(this.gameAdvantages);
  }

  resetAll() {
    this.allGradients = [];
    this.allRewards = [];
    this.allAdvantages = [];
    this.resetGame()
  }

  resetGame() {
    this.gameValues = [];
    this.gameInputs = [];
    this.gameRewards = [];
    this.gameGradients = [];
    this.gameAdvantages = [];
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

  scaleAndAverageGradients() {
    return tf.tidy(() => {
      const normalizedRewards = this.allAdvantages.map(a => tf.tensor1d(a))

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
          const reshapedNormalizedRewards = normalizedRewards.map(rs => rs.reshape(rs.shape.concat(expandedDims)));
          for (let g = 0; g < varGradients.length; ++g) {
            // This mul() call uses broadcasting.
            varGradients[g] = varGradients[g].mul(reshapedNormalizedRewards[g]);
          }

          const loss = tf.mean(tf.concat(varGradients, 0), 0);
          return loss
        });
      }
      console.debug(gradients)
      return gradients;
    });
  }

  getCriticTrainData() {
    let x = []
    let y = []

    for(let i=0; i < this.gameInputs.length-1; i++) {
      x.push(this.gameInputs[i])
      y.push(this.gameRewards[i] + this.discountRate * this.gameValues[i+1])
    }

    return [
      tf.tensor2d(x),
      tf.tensor1d(y)
    ]
  }
}

