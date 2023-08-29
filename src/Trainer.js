const INIT_REWARD_TYPE = 'radarBeam'

export default class Trainer extends EventTarget {

  constructor(agent, tankLogic, jsBattle, settings, canvas=null) {
    super()
    this.canvas = canvas
    this.settings = settings
    this.jsBattle = jsBattle
    this.agent = agent
    this.tankLogic = tankLogic
    this.epochIndex = 0
    this._simulation = null
    this._epochDuration = null
    this._epochStartTime = 0
    this.episodeIndex = 0
    this.scoreHistory = []
    this.criticLossHistory = []
    this.autoSave = true
    this.simSpeed = 10
    this.rewardType = INIT_REWARD_TYPE
    this.currentTimeLimit = this.settings.prop('episodeTimeLimit')
  }

  get simulation() {
    return this._simulation
  }

  get epochDuration() {
    return this._epochDuration
  }

  get epochSize() {
    return this.settings.prop('epochSize')
  }

  get episodeTimeLimit() {
    return this.currentTimeLimit
  }

  async runEpoch() {
    this._epochStartTime = performance.now()
    console.log("starting new epoch")
    this.currentTimeLimit = this.settings.prop('episodeTimeLimit')
    this.agent.onBatchStart()
    for(let i=0; i < this.epochSize; i++) {
      console.log("starting episode", i+1)
      this.episodeIndex = i
      await this.runEpisode()   
    }
    console.log("store history")
    this.scoreHistory.push({
      x: this.epochIndex+1, 
      mean: mean(this.agent.gameScores), 
      min: Math.min(...this.agent.gameScores), 
      max: Math.max(...this.agent.gameScores)
    })
    this.criticLossHistory.push({
      x: this.epochIndex+1, 
      mean: mean(this.agent.criticLossHistory), 
      min: Math.min(...this.agent.criticLossHistory), 
      max: Math.max(...this.agent.criticLossHistory)
    })
    while(this.scoreHistory.length > 100) {
      this.scoreHistory.shift()
    }
    while(this.criticLossHistory.length > 100) {
      this.criticLossHistory.shift()
    }
    this.agent.onBatchFinish()
    this.epochIndex++
    this._epochDuration = performance.now() - this._epochStartTime
    console.log("Epoch duration", this._epochDuration )
    if(this.autoSave) {
      console.log("saving...")
    }
    await this.save()
    console.log("%c--== Epoch End ==--", 'background-color:blue;color:white')
    this.dispatchEvent(new Event('epochComplete'))
    
  }

  async runEpisode() {
    await new Promise(async (onEpisodeEnd) => {
      console.log("on game start")
      this.agent.onGameStart()
      console.log("create game renderer")
      let renderer
      if(this.canvas) {
        renderer = this.jsBattle.createRenderer('debug');
        renderer.init(this.canvas);
        console.log("loading assets")
        await new Promise(done => renderer.loadAssets(done))
      } else {
        renderer = this.jsBattle.createRenderer('void');
      }      
      console.log("create simulation")
      this._simulation = this.jsBattle.createSimulation(renderer);
      this._simulation.init(900, 600);
      const bx = (this._simulation.battlefield.minX + this._simulation.battlefield.maxX)/2
      const by = (this._simulation.battlefield.minY + this._simulation.battlefield.maxY)/2;
      
      console.log("create Tank Logic AI")
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
    
      this._simulation.onFinish(async () => {
        console.log("Game finish")
        await this.agent.onGameFinish()
        if(this.canvas) {
          console.log("Clean texture cache")
          PIXI.utils.clearTextureCache()
        }
        console.log("%c- Episode End -", 'background-color:blue;color:white')
        setTimeout(() => onEpisodeEnd(), 50)
      })

      this._simulation.onStep(() => {
        this.dispatchEvent(new Event('step'))
      })

      this._simulation.setSpeed(this.simSpeed)
      this._simulation.timeLimit = this.episodeTimeLimit
    
      this.tankLogic.tankModel.moveTo(bx, by)
      console.log("start simulation")
      this._simulation.start()
      console.log("game started")
    })
    console.log("EVENT: episodeComplete")
    this.dispatchEvent(new Event('episodeComplete'))
  }

  async restore() {
    const agentResult = await this.agent.restoreModel()
    if(!agentResult) return false

    const rawTrainerState = await localStorage.getItem("trainerState")
    if(!rawTrainerState) return false

    const trainerState = JSON.parse(rawTrainerState)

    this.epochIndex = trainerState.epochIndex
    this._simulation = null
    this._epochDuration = trainerState.epochDuration
    this._epochStartTime = 0
    this.episodeIndex = 0
    this.scoreHistory = trainerState.scoreHistory
    this.criticLossHistory = trainerState.criticLossHistory
    this.rewardType = INIT_REWARD_TYPE

    console.log("EVENT: restore")
    this.dispatchEvent(new Event('restore'))
    return true
  }

  async save() {
    await this.agent.saveModel()

    await localStorage.setItem("trainerState", JSON.stringify({
      epochIndex: this.epochIndex,
      scoreHistory: this.scoreHistory,
      criticLossHistory: this.criticLossHistory,
      epochDuration: this._epochDuration,
    }));

    console.log("EVENT: save")
    this.dispatchEvent(new Event('save'))
  }

  async removeStored() {
    await this.agent.removeModel()
    console.log("EVENT: remove")
    this.dispatchEvent(new Event('remove'))
  }

  async resetScoreHistory() {
    const data = JSON.parse(await localStorage.getItem('trainerState'))
    this.scoreHistory = []
    data.scoreHistory = this.scoreHistory
    await localStorage.setItem("trainerState", JSON.stringify(data));
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