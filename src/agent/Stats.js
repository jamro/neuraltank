export default class Stats {

  constructor() {
    this.reset()
  }

  reset() {
    this.stepCount = 0
    this.stepTotalDuration = 0
    this.stepAvgDuration = 0
    this.stepStartTime = 0

    this.benchmarkStartTime = 0
    this.benchmarkCount = 0
    this.benchmarkTotalDuration = 0
    this.benchmarkAvgDuration = 0

    this.expectedValue = 0
    this.totalReward = 0
    this.rewardHistory = [];

    this.criticLoss = 0
    this.actorLoss = 0
    this.entropy = 0

    this.rewardComponents = null
    this.epochRewardComponents = null
  }

  onEpochStart() {
    this.rewardHistory = [];
    this.epochRewardComponents = null
  }

  onEpochEnd() {

  }

  onEpisodeStart() {
    this.stepCount = 0
    this.stepTotalDuration = 0
    this.totalReward = 0
    this.rewardComponents = null
  }

  onEpisodeEnd() {
    this.benchmarkAvgDuration = this.benchmarkCount ? this.benchmarkTotalDuration / this.benchmarkCount : 0
    this.stepAvgDuration = this.stepCount ? this.stepTotalDuration / this.stepCount : 0
    console.log(`Average step duration ${this.stepAvgDuration.toFixed(2)}ms`)

    this.rewardHistory.push(this.totalReward);

    if(!this.epochRewardComponents) {
      this.epochRewardComponents = [...this.rewardComponents]
    } else {
      this.epochRewardComponents = this.rewardComponents.reduce((r, v, i) => {
        r[i] += v
        return r
      }, this.epochRewardComponents)
    }
  }

  onStepStart() {
    this.stepStartTime = performance.now()
  }

  onStepEnd() {
    const duration = performance.now() - this.stepStartTime 
    this.stepCount += 1
    this.stepsPerSecCounter += 1
    this.stepTotalDuration += duration
  }


  startBenchmark() {
    this.benchmarkStartTime = performance.now()
  }

  endBenchmark() {
    const duration = performance.now() - this.benchmarkStartTime 
    this.benchmarkCount += 1
    this.benchmarkTotalDuration += duration
  }
  
  async save() {
    await localStorage.setItem('agentStats', JSON.stringify({
      benchmarkAvgDuration:  this.benchmarkAvgDuration,
      stepAvgDuration:  this.stepAvgDuration,
    }))
  }

  async remove() {
    await localStorage.removeItem('agentStats')
  }

  async restore() {
    const rawData = await localStorage.getItem('agentStats')
    this.stepCount = 0
    this.stepTotalDuration = 0
    this.stepAvgDuration = 0
    this.stepStartTime = 0

    this.benchmarkStartTime = 0
    this.benchmarkCount = 0
    this.benchmarkTotalDuration = 0
    this.benchmarkAvgDuration = 0

    this.expectedValue = 0
    this.totalReward = 0
    this.rewardHistory = [];
    if(rawData) {
      const json = JSON.parse(rawData)
      this.benchmarkAvgDuration = json.benchmarkAvgDuration
      this.stepAvgDuration = json.stepAvgDuration
    }
  }

  storeRewards(rewards) {
    const scoreIncrement = rewards.reduce((s, a) => s + a, 0);
    this.totalReward += scoreIncrement
    if(!this.rewardComponents) {
      this.rewardComponents = [...rewards]
    } else {
      this.rewardComponents = rewards.reduce((r, v, i) => {
        r[i] += v
        return r
      }, this.rewardComponents)
    }
    return scoreIncrement
  }

}