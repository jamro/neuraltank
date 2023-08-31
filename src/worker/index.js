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

  const agent = new TrainableAgent()
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
      criticLossHistory: trainer.criticLossHistory || [],
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
  trainer.addEventListener('episodeComplete', () => {
    messageBus.send("episodeStats", {
      episodeIndex: trainer.episodeIndex,
      epochSize: trainer.epochSize,
      stepAvgDuration: agent.stepAvgDuration,
      benchmarkAvgDuration: agent.benchmarkAvgDuration,
      expectedValue: agent.expectedValue
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

  messageBus.addEventListener('clearSave', async () => await trainer.removeStored())
  messageBus.addEventListener('clearHistory', async () => await trainer.resetScoreHistory())
  messageBus.addEventListener('config', ({data}) => {
    switch(data.key) {
      case 'epochSize':
        settings.prop('epochSize', data.value)
        break
      case 'episodeTimeLimit':
        settings.prop('episodeTimeLimit', data.value)
        break
    }
  })
  // --------------------------------------------------------------------------------------------------------------

  if(!(await trainer.restore())) {
    console.log('Stored model not found. creating...')
    await trainer.save()
  }

  messageBus.send("episodeStats", {
    episodeIndex: trainer.episodeIndex,
    epochSize: trainer.epochSize,
    stepAvgDuration: agent.stepAvgDuration,
    expectedValue: agent.expectedValue
  })
  messageBus.send("epochStats", {
    epochIndex: trainer.epochIndex,
    epochDuration: trainer.epochDuration,
    epochSize: trainer.epochSize,
    scoreHistory: trainer.scoreHistory || [],
    criticLossHistory: trainer.criticLossHistory || [],
  })
  messageBus.send("settings", {
    epochSize: trainer.epochSize,
    episodeTimeLimit: trainer.episodeTimeLimit,
    actorLearningRate: agent.actorLearningRate,
    criticLearningRate: agent.criticLearningRate,
    discountRate: agent.discountRate,
  })

  while(true) {
    await trainer.runEpoch()
  }

})()