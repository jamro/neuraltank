import * as tf from '@tensorflow/tfjs';

export default class Memory {
  constructor() {
    this.episodeMemory = {}
    this.epochMemory = {}
    this.resetAll()
  }

  add(keyValue) {
    const keys = Object.keys(keyValue)
    for(let key of keys) {
      let value = keyValue[key]

      // convert input into 2dim tensor
      if(typeof(value) !== 'object' || value.constructor.name !== 'Tensor') {
        value = tf.tensor(value)
        while(value.shape.length < 2) {
          value = value.expandDims()
        }
      } else {
        value = value.clone()
      }
      if(!this.episodeMemory[key]) {
        this.episodeMemory[key] = value
      } else {
        this.episodeMemory[key] = tf.concat([this.episodeMemory[key], value])
      }
    }
  }

  rememberGameStep(trajectory) {
    this.add(trajectory)
  }

  aggregateGameResults() {
    const keys = Object.keys(this.episodeMemory)
    for(let key of keys) {
      if(!this.epochMemory[key]) {
        this.epochMemory[key] = this.episodeMemory[key].expandDims()
      } else {
        this.epochMemory[key] = tf.concat([this.epochMemory[key], this.episodeMemory[key].expandDims()])
      }
    }
  }

  resetAll() {
    this.epochMemory = {}
    this.resetGame()
  }

  resetGame() {
    this.episodeMemory = {}
  }

}

