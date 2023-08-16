const INIT_EPOCH_SIZE = 15
const INIT_EPISODE_TIME_LIMIT = 15000
export default class Trainer extends EventTarget {

  constructor(policy, tankLogic, jsBattle) {
    super()
    this.jsBattle = jsBattle
    this.canvas = document.getElementById('battlefield');
    this.policy = policy
    this.tankLogic = tankLogic
    this.epochSize = INIT_EPOCH_SIZE
    this.epochIndex = 0
    this._simSpeed = 1
    this._simulation = null
    this._epochDuration = null
    this._epochStartTime = 0
    this.episodeIndex = 0
    this.scoreHistory = []
    this.episodeTimeLimit = INIT_EPISODE_TIME_LIMIT
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

  async runEpoch() {
    this._epochStartTime = performance.now()
    this.policy.onBatchStart()
    for(let i=0; i < this.epochSize; i++) {
      this.episodeIndex = i
      await this.runEpisode()   
    }
    this.scoreHistory.push({
      x: this.epochIndex+1, 
      mean: mean(this.policy.gameScores), 
      min: Math.min(...this.policy.gameScores), 
      max: Math.max(...this.policy.gameScores)
    })
    while(this.scoreHistory.length > 100) {
      this.scoreHistory.shift()
    }
    this.policy.onBatchFinish()
    this.epochIndex++
    this._epochDuration = performance.now() - this._epochStartTime
    await this.save()
    this.dispatchEvent(new Event('epochComplete'))
    
  }

  async runEpisode() {
    await new Promise(async (onEpisodeEnd) => {
      this.policy.onGameStart()
      const renderer = this.jsBattle.createRenderer('bw');
      renderer.init(this.canvas);
      await new Promise(done => renderer.loadAssets(done))
      this._simulation = this.jsBattle.createSimulation(renderer);
      this._simulation.init(900, 600);
      const bx = (this._simulation.battlefield.minX + this._simulation.battlefield.maxX)/2
      const by = (this._simulation.battlefield.minY + this._simulation.battlefield.maxY)/2;
      
      this.tankLogic.createAI(this._simulation)

      const opponentCode = `importScripts('lib/tank.js');
        tank.init(function(settings, info) {

        })
        tank.loop(function(state, control) {

        });`
      
      let opponent = this.jsBattle.createAiDefinition();
      opponent.fromCode('opponent', opponentCode);
      opponent.disableSandbox()
      let opponentTank = this._simulation.addTank(opponent).tank
      opponentTank.moveTo(bx+200, by+200, 0)
    
      opponent = this.jsBattle.createAiDefinition();
      opponent.fromCode('opponent', opponentCode);
      opponent.disableSandbox()
      opponentTank = this._simulation.addTank(opponent).tank
      opponentTank.moveTo(bx+200, by-200, 0)
    
      opponent = this.jsBattle.createAiDefinition();
      opponent.fromCode('opponent', opponentCode);
      opponent.disableSandbox()
      opponentTank = this._simulation.addTank(opponent).tank
      opponentTank.moveTo(bx-200, by, 0)
      
      this._simulation.onFinish(() => {
        this.policy.onGameFinish()
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
    const policyResult = await this.policy.restoreModel()
    if(!policyResult) return false

    const rawTrainerState = localStorage.getItem("trainerState")
    if(!rawTrainerState) return false

    const trainerState = JSON.parse(rawTrainerState)

    this.epochSize = INIT_EPOCH_SIZE
    this.epochIndex = trainerState.epochIndex
    this._simSpeed = 1
    this._simulation = null
    this._epochDuration = trainerState.epochDuration
    this._epochStartTime = 0
    this.episodeIndex = 0
    this.scoreHistory = trainerState.scoreHistory
    this.episodeTimeLimit = INIT_EPISODE_TIME_LIMIT

    this.dispatchEvent(new Event('restore'))
    return true
  }

  async save() {
    await this.policy.saveModel()

    localStorage.setItem("trainerState", JSON.stringify({
      epochIndex: this.epochIndex,
      scoreHistory: this.scoreHistory,
      epochDuration: this._epochDuration,
    }));

    this.dispatchEvent(new Event('save'))
  }

  async removeStored() {
    await this.policy.removeModel()
    this.dispatchEvent(new Event('remove'))
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