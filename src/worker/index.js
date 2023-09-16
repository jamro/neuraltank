import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import TrainableAgent from "../agent/TrainableAgent.js";
import TankLogic from "../agent/TankLogic.js";
import Trainer from '../Trainer.js';
import Settings from '../Settings.js'

import JsBattle from 'jsbattle-engine';
import { LocalStorageClient } from './LocalStorageProxy.js';
import MessageBus from './MessageBus.js';


const messageBus = new MessageBus(self);

(async () => {
  messageBus.send('workerHello')
  console.log("Waiting to initialize the worker...")
  await new Promise(done => messageBus.addEventListener('initWorker', done))
  console.log("Worker ready!")

  self.localStorage = new LocalStorageClient(messageBus)

  tf.setBackend('webgl');
  await tf.ready()
  console.log("TF Backend:", tf.getBackend())

  const settings = new Settings()
  await settings.init()

  const agent = new TrainableAgent(settings)
  const tankLogic = new TankLogic(JsBattle, agent)
  tankLogic.installCallbacks(self)
  const trainer = new Trainer(agent, tankLogic, JsBattle, settings)

  // emit events over message bus ---------------------------------------------------------------------------------
  trainer.addEventListener('epochComplete', () => {
    messageBus.send("epochStats", {
      epochIndex: trainer.epochIndex+1,
      epochDuration: trainer.epochDuration,
      epochSize: trainer.epochSize,
      scoreHistory: trainer.scoreHistory || [],
      lossHistory: trainer.lossHistory || [],
    })
    messageBus.send("epochComplete")
  })
  trainer.addEventListener('save', () => {
    messageBus.send("saveDate", {value: (trainer.agent.dateSaved || '').toString()})
  })
  trainer.addEventListener('restore', () => {
    messageBus.send("saveDate", {value: (trainer.agent.dateSaved || '').toString()})
  })
  trainer.addEventListener('remove', () => {
    messageBus.send("saveDate", {value: null})
  })
  trainer.addEventListener('status', (data) => {
    messageBus.send("status", {msg: 'Trainer: ' + data.msg})
  })
  agent.addEventListener('status', (data) => {
    messageBus.send("status", {msg: 'Agent: ' + data.msg})
  })
  trainer.addEventListener('episodeComplete', () => {
    messageBus.send("episodeStats", {
      episodeIndex: trainer.episodeIndex,
      epochSize: trainer.epochSize,
      stepAvgDuration: agent.stats.stepAvgDuration,
      benchmarkAvgDuration: agent.stats.benchmarkAvgDuration,
      expectedValue: agent.stats.expectedValue
    })
  })
  setInterval(() => {
    if(trainer.simulation) {
      messageBus.send("episodeProgress", {
        timeElapsed: trainer.simulation.timeElapsed,
        timeLimit: trainer.simulation.timeLimit,
      })
    }
  }, 1000)
  // --------------------------------------------------------------------------------------------------------------

  messageBus.send("status", {msg: 'Restoring model...'})
  if(!(await trainer.restore())) {
    console.log('Stored model not found. creating...')
    await trainer.save()
  }

  messageBus.send("episodeStats", {
    episodeIndex: trainer.episodeIndex,
    epochSize: trainer.epochSize,
    stepAvgDuration: agent.stats.stepAvgDuration,
    expectedValue: agent.stats.expectedValue,
    benchmarkAvgDuration: agent.stats.benchmarkAvgDuration,
  })
  messageBus.send("epochStats", {
    epochIndex: trainer.epochIndex,
    epochDuration: trainer.epochDuration,
    epochSize: trainer.epochSize,
    scoreHistory: trainer.scoreHistory || [],
    lossHistory: trainer.lossHistory || [],
  })
  messageBus.send("settings", {
    epochSize: trainer.epochSize,
    episodeTimeLimit: trainer.episodeTimeLimit,
    learningRate: agent.learningRate,
    entropyCoefficient: agent.entropyCoefficient,
    discountRate: agent.discountRate,
    envId: trainer.envId,
    rewardWeights: agent.rewardWeights,
    entropyLimits: [
      Math.max(agent.shooterNet.entropyMin, agent.driverNet.entropyMin), 
      Math.min(agent.shooterNet.entropyMax, agent.driverNet.entropyMax)
    ],
    activeNetworks: {
      shooter: agent.shooterEnabled,
      driver: agent.driverEnabled,
    },
    trainableNetworks: {
      shooter: agent.shooterTrainable,
      driver: agent.driverTrainable,
    }
  })

  messageBus.send("status", {msg: 'Ready!'})
  while(true) {
    await trainer.runEpoch()
  }

})()