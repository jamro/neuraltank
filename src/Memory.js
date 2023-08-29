import * as tf from '@tensorflow/tfjs';

export default class Memory {
  constructor(discountRate) {
    this.discountRate = discountRate
    this.episodeMemory = {}
    this.epochMemory = {}
    this.resetAll()
  }

  add(keyValue) {
    const keys = Object.keys(keyValue)
    for(let key of keys) {
      const value = keyValue[key]
      if(!this.episodeMemory[key]) {
        this.episodeMemory[key] = []
      }
      this.episodeMemory[key].push(value)
    }
  }

  rememberGameStep(trajectory, gradients) {
    this.pushGradients(this.gameGradients, gradients);
    this.add(trajectory)
  }

  aggregateGameResults() {
    const keys = Object.keys(this.episodeMemory)
    for(let key of keys) {
      if(!this.epochMemory[key]) {
        this.epochMemory[key] = []
      }
      this.epochMemory[key].push(this.episodeMemory[key])
    }

    this.pushGradients(this.allGradients, this.gameGradients);
  }

  resetAll() {
    this.allGradients = [];
    this.epochMemory = {}
    this.resetGame()
  }

  resetGame() {
    this.episodeMemory = {}
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

  calculateAdvantages() {
    if(this.epochMemory.reward.length !== this.epochMemory.value.length) {
      throw Error(`rewards[] (${this.epochMemory.reward.length}) and values[] (${this.epochMemory.value.length}) length must match`)
    }

    const advantages = []

    for(let j=0; j < this.epochMemory.reward.length; j++) {
      const rewards = this.epochMemory.reward[j]
      const values = this.epochMemory.value[j]
      advantages[j] = []

      if(rewards.length !== values.length) {
        throw Error(`rewards (${rewards.length}) and values (${values.length}) length must match`)
      }
      for(let i=0; i < rewards.length-1; i++) {
        const advantage = rewards[i] + this.discountRate * values[i+1] - values[i]
        advantages[j].push(advantage)
      }
      advantages[j].push(rewards[rewards.length-1] - values[values.length-1])
      
    }
    return advantages
  }

  scaleAndAverageGradients() {
    return tf.tidy(() => {
      const allAdvantages = this.calculateAdvantages()
      const normalizedRewards = allAdvantages.map(a => tf.tensor1d(a))

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
      return gradients;
    });
  }

  getCriticTrainData() {
    let x = []
    let y = []

    for(let i=0; i < this.episodeMemory.input.length-1; i++) {
      x.push(this.episodeMemory.input[i])
      y.push(this.episodeMemory.reward[i] + this.discountRate * this.episodeMemory.value[i+1])
    }

    return [
      tf.tensor2d(x),
      tf.tensor1d(y)
    ]
  }
}

