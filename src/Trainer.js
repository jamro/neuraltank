const INIT_REWARD_TYPE = 'radarBeam'

export default class Trainer extends EventTarget {

  constructor(agent, tankLogic, jsBattle, settings) {
    super()
    this.settings = settings
    this.jsBattle = jsBattle
    this.canvas = document.getElementById('battlefield');
    this.agent = agent
    this.tankLogic = tankLogic
    this.epochIndex = 0
    this._simSpeed = 1
    this._simulation = null
    this._epochDuration = null
    this._epochStartTime = 0
    this.episodeIndex = 0
    this.scoreHistory = []
    this.rewardType = INIT_REWARD_TYPE
  }

  get simulation() {
    return this._simulation
  }

  get epochDuration() {
    return this._epochDuration
  }

  get simSpeed() {
    return this._simSpeed
  }

  set simSpeed(v) {
    this._simSpeed = v
    if(this._simulation) {
      this._simulation.setSpeed(this._simSpeed)
    }
  }

  get epochSize() {
    return this.settings.prop('epochSize')
  }

  set epochSize(v) {
    return this.settings.prop('epochSize', v)
  }

  get episodeTimeLimit() {
    return this.settings.prop('episodeTimeLimit')
  }

  set episodeTimeLimit(v) {
    return this.settings.prop('episodeTimeLimit', v)
  }

  async runEpoch() {
    this._epochStartTime = performance.now()
    this.agent.onBatchStart()
    for(let i=0; i < this.epochSize; i++) {
      this.episodeIndex = i
      await this.runEpisode()   
    }
    this.scoreHistory.push({
      x: this.epochIndex+1, 
      mean: mean(this.agent.gameScores), 
      min: Math.min(...this.agent.gameScores), 
      max: Math.max(...this.agent.gameScores)
    })
    while(this.scoreHistory.length > 100) {
      this.scoreHistory.shift()
    }
    this.agent.onBatchFinish()
    this.epochIndex++
    this._epochDuration = performance.now() - this._epochStartTime
    await this.save()
    this.dispatchEvent(new Event('epochComplete'))
    
  }

  async runEpisode() {
    await new Promise(async (onEpisodeEnd) => {
      this.agent.onGameStart()
      const renderer = this.jsBattle.createRenderer('debug');
      renderer.init(this.canvas);
      await new Promise(done => renderer.loadAssets(done))
      this._simulation = this.jsBattle.createSimulation(renderer);
      this._simulation.init(900, 600);
      const bx = (this._simulation.battlefield.minX + this._simulation.battlefield.maxX)/2
      const by = (this._simulation.battlefield.minY + this._simulation.battlefield.maxY)/2;
      
      this.tankLogic.createAI(this._simulation, this.rewardType)

      const opponentCode = `importScripts('lib/tank.js');
        tank.init(function(settings, info) {
          this.t = 0
        })
        tank.loop(function(state, control) {
          this.t ++
          control.THROTTLE = Math.cos(this.t/100)
        });`
      
      let opponent = this.jsBattle.createAiDefinition();
      opponent.fromCode('opponent', opponentCode);
      opponent.disableSandbox()
      let opponentTank = this._simulation.addTank(opponent).tank
      opponentTank.moveTo(bx+180, by-50, 180)
    
      opponent = this.jsBattle.createAiDefinition();
      opponent.fromCode('opponent', opponentCode);
      opponent.disableSandbox()
      opponentTank = this._simulation.addTank(opponent).tank
      opponentTank.moveTo(bx+150, by+50, 0)
    
      this._simulation.onFinish(() => {
        this.agent.onGameFinish()
        PIXI.utils.clearTextureCache()
        onEpisodeEnd()
      })
      
      this._simulation.setSpeed(this._simSpeed)
      this._simulation.timeLimit = this.episodeTimeLimit
    
      this.tankLogic.tankModel.moveTo(bx, by, 0)
    
      this._simulation.start()
    })
    this.dispatchEvent(new Event('episodeComplete'))
  }

  async restore() {
    const agentResult = await this.agent.restoreModel()
    if(!agentResult) return false

    const rawTrainerState = localStorage.getItem("trainerState")
    if(!rawTrainerState) return false

    const trainerState = JSON.parse(rawTrainerState)

    this.epochIndex = trainerState.epochIndex
    this._simSpeed = 1
    this._simulation = null
    this._epochDuration = trainerState.epochDuration
    this._epochStartTime = 0
    this.episodeIndex = 0
    this.scoreHistory = trainerState.scoreHistory
    this.rewardType = INIT_REWARD_TYPE

    this.dispatchEvent(new Event('restore'))
    return true
  }

  async save() {
    await this.agent.saveModel()

    localStorage.setItem("trainerState", JSON.stringify({
      epochIndex: this.epochIndex,
      scoreHistory: this.scoreHistory,
      epochDuration: this._epochDuration,
    }));

    this.dispatchEvent(new Event('save'))
  }

  async removeStored() {
    await this.agent.removeModel()
    this.dispatchEvent(new Event('remove'))
  }

  async resetScoreHistory() {
    const data = JSON.parse(localStorage.getItem('trainerState'))
    this.scoreHistory = []
    data.scoreHistory = this.scoreHistory
    localStorage.setItem("trainerState", JSON.stringify(data));
  }

}

function mean(xs) {
  return sum(xs) / xs.length;
}

function sum(xs) {
  if (xs.length === 0) {
    throw new Error('Expected xs to be a non-empty Array.');
  } else {
    return xs.reduce((x, prev) => prev + x);
  }
}