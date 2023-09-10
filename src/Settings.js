export default class Settings extends EventTarget {

  constructor() {
    super()
    
    this.data = {
      epochSize: 5,
      episodeTimeLimit: 20000,
      learningRate: 0.0005,
      rewardWeights: [1, 0.25, 1, 1, 1],
      envId: 'pendulum'
    }
  }

  async init() {
    const rawData = await localStorage.getItem('settings')
    if(rawData) {
      this.data = {
        ...this.data,
        ...JSON.parse(rawData)
      }
    }
    await localStorage.setItem('settings', JSON.stringify(this.data))
  }

  prop(key, newVal = undefined) {
    if(newVal !== undefined) {
      this.data[key] = newVal
      this.dispatchEvent(new Event('change_' + key))
      localStorage.setItem('settings', JSON.stringify(this.data))
    }
    return this.data[key]
  }


}