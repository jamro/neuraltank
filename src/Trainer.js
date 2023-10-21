import simEnv from "./simEnv"
import SimEnv from "./simEnv/SimEnv"

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
    this.lossHistory = []
    this.autoSave = true
    this.autoPlay = true
    this.simSpeed = 10
    this.currentTimeLimit = this.settings.prop('episodeTimeLimit')
    this.envId = this.settings.prop('envId')
    this.style = 'debug'
    this.startTime = new Date().getTime()
  }

  get simulation() {
    return this._simulation
  }

  get epochDuration() {
    return this._epochDuration
  }

  get epochSize() {
    if(!this.autoPlay) return 1
    return this.settings.prop('epochSize')
  }

  get episodeTimeLimit() {
    return this.currentTimeLimit
  }

  async runEpoch() {
    this.sendStatus(`Starting epoch ${this.epochIndex+1}...`)
    this._epochStartTime = performance.now()
    console.log("starting new epoch")
    this.currentTimeLimit = this.settings.prop('episodeTimeLimit')
    this.agent.onBatchStart()
    for(let i=0; i < this.epochSize; i++) {
      console.log("starting episode", i+1)
      this.sendStatus(`Episode in progress...`)
      this.episodeIndex = i
      await this.runEpisode()   
    }
    this.sendStatus(`Epoch completed`)
    await this.agent.onBatchFinish()
    console.log("store history")
    if(this.agent.stats.rewardHistory.length) {
      const rewardShare = this.agent.stats.epochRewardComponents.map(a => a/(this.episodeIndex+1))
      this.scoreHistory.push({
        x: this.epochIndex+1, 
        mean: mean(this.agent.stats.rewardHistory), 
        min: Math.min(...this.agent.stats.rewardHistory), 
        max: Math.max(...this.agent.stats.rewardHistory),
        rewardShare: rewardShare
      })
    }
    this.lossHistory.push({
      x: this.epochIndex+1, 
      critic: this.agent.stats.criticLoss, 
      shooter: this.agent.stats.shooterLoss, 
      driver: this.agent.stats.driverLoss, 
      shooterEntropy: this.agent.stats.shooterEntropy, 
      driverEntropy: this.agent.stats.driverEntropy, 
    })
    while(this.scoreHistory.length > 100) {
      this.scoreHistory.shift()
    }
    while(this.lossHistory.length > 100) {
      this.lossHistory.shift()
    }

    this.epochIndex++
    this._epochDuration = performance.now() - this._epochStartTime
    console.log("Epoch duration", this._epochDuration )
    if(this.autoSave) {
      console.log("saving...")
      await this.save()
    }
    
    console.log("%c--== Epoch End ==--", 'background-color:blue;color:white')
    this.dispatchEvent(new Event('epochComplete'))
    
  }

  async runEpisode() {
    await new Promise(async (onEpisodeEnd) => {
      this.addEventListener('stopSim', () => {
        onEpisodeEnd()
      })
      console.log("on game start")
      this.agent.onGameStart()
      console.log("create game renderer")
      let renderer
      if(this.canvas) {
        renderer = this.jsBattle.createRenderer(this.style);
        renderer.init(this.canvas);
        console.log("loading assets")
        await new Promise(done => renderer.loadAssets(done))
      } else {
        renderer = this.jsBattle.createRenderer('void');
      }      
      console.log("create simulation")
      this._simulation = new SimEnv(renderer);
      this._simulation.init(900, 600);

      console.log("create Tank Logic AI")
      this.tankLogic.createAI(this._simulation)

      // setup env
      simEnv[this.envId](this.jsBattle, this._simulation, this.tankLogic)
    
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
    
      console.log("start simulation")
      this._simulation.start()
      console.log("game started")
    })
    console.log("EVENT: episodeComplete")
    this.dispatchEvent(new Event('episodeComplete'))
  }

  stop() {
    this._simulation.stop()
    const event = new Event("stopSim")
    this.dispatchEvent(event)
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
    this.lossHistory = trainerState.lossHistory
    this.startTime = trainerState.startTime

    console.log("EVENT: restore")
    this.dispatchEvent(new Event('restore'))
    return true
  }

  async save() {
    const score = this.scoreHistory.length > 0 ? this.scoreHistory[this.scoreHistory.length-1].mean : 0
    await this.agent.saveModel()
    // save the best result
    let isBest = true
    for(let past of this.scoreHistory) {
      if(score < past.mean) {
        isBest = false
        break;
      }
    }
    if(isBest) {
      await this.agent.saveModelAs(
        `best_${this.settings.prop('stageId')}_${this.startTime}`,
        `[Best ${this.settings.prop('stageName')}] score: ${score.toFixed(2)}`
      )
    }

    await this.agent.saveModelAs(
      'playback_' + new Date().getTime(), 
      JSON.stringify({
        stageId: this.settings.prop('stageId'),
        stageName: this.settings.prop('stageName'),
        score: Math.round(score*100)/100,
        stageStartTime: this.startTime
      })
    )

    await localStorage.setItem("trainerState", JSON.stringify({
      epochIndex: this.epochIndex,
      scoreHistory: this.scoreHistory,
      lossHistory: this.lossHistory,
      epochDuration: this._epochDuration,
      startTime: this.startTime
    }));
  
    console.log("EVENT: save")
    this.dispatchEvent(new Event('save'))
  }

  async removeStored() {
    await this.agent.removeModel()
    await this.resetScoreHistory()
    console.log("EVENT: remove")
    this.dispatchEvent(new Event('remove'))
  }

  async resetScoreHistory() {
    const data = JSON.parse(await localStorage.getItem('trainerState')) || {}
    this.scoreHistory = []
    this.lossHistory = []
    this.epochIndex = 0
    this._epochDuration = null
    data.scoreHistory = this.scoreHistory
    data.epochIndex = this.epochIndex
    data.lossHistory = this.lossHistory
    data.epochDuration = this.epochDuration
    data.startTime = new Date().getTime()
    await localStorage.setItem("trainerState", JSON.stringify(data));
  }

  sendStatus(msg) {
    const event = new Event('status')
    event.msg = msg
    this.dispatchEvent(event)
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