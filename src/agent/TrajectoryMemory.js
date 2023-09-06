import * as tf from '@tensorflow/tfjs';

export default class TrajectoryMemory {
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

  correct(keyValue) {
    const keys = Object.keys(keyValue)
    for(let key of keys) {
      const corrections = keyValue[key]
      if(corrections.length == 0) continue
      const raw = this.episodeMemory[key].arraySync()
      for(let correction of corrections) {
        raw[correction.sourceTime][0] -= correction.value
        raw[correction.targetTime][0] += correction.value
      }
      this.episodeMemory[key] = tf.tensor2d(raw)
    }
  }
  
  aggregateGameResults() {
    const keys = Object.keys(this.episodeMemory)
    for(let key of keys) {
      if(!this.epochMemory[key]) {
        this.epochMemory[key] = this.episodeMemory[key].expandDims()
      } else {
        const expandedEpisodeMemory = this.episodeMemory[key].expandDims()
        console.log(`Aggregating results episodeMemory${expandedEpisodeMemory.shape} with epochMemory${this.epochMemory[key].shape}`)
        this.epochMemory[key] = tf.concat([this.epochMemory[key], expandedEpisodeMemory])
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

