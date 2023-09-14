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

      if(typeof(value) === 'object' && value.constructor.name === 'Tensor') {
        value = value.arraySync()[0]
      }
      if(typeof(value) === 'number') {
        value = [value]
      }
      
      if(!this.episodeMemory[key]) {
        this.episodeMemory[key] = []
      }
      this.episodeMemory[key].push(value)
    }
  }

  correct(keyValue) {
    const keys = Object.keys(keyValue)
    for(let key of keys) {
      const corrections = keyValue[key]
      if(corrections.length == 0) continue
      const series = this.episodeMemory[key]
      for(let correction of corrections) {
        series[correction.sourceTime][0] -= correction.value
        series[correction.targetTime][0] += correction.value
      }
      this.episodeMemory[key] = series
    }
  }
  
  aggregateGameResults() {
    const keys = Object.keys(this.episodeMemory)
    for(let key of keys) {
      if(!this.epochMemory[key]) {
        this.epochMemory[key] = []
      } 
      this.epochMemory[key].push(this.episodeMemory[key])
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

