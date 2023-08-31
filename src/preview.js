import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'remixicon/fonts/remixicon.css'
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import Agent from "./agent/Agent.js";
import TankLogic from "./agent/TankLogic.js";
import Trainer from './Trainer.js';
import Settings from './Settings.js'
import * as $ from 'jquery'

(async () => {
  console.log("... Neural Tank ...")

  tf.setBackend('webgl');
  await tf.ready()
  console.log("TF Backend:", tf.getBackend())

  const settings = new Settings()

  const agent = new Agent()
  const tankLogic = new TankLogic(JsBattle, agent)
  tankLogic.installCallbacks(window)
  const battleFieldCanvas = document.getElementById('battlefield')
  const trainer = new Trainer(agent, tankLogic, JsBattle, settings, battleFieldCanvas)
  trainer.autoSave = false
  trainer.simSpeed = 1

  if(!(await trainer.restore())) {
    console.log('Stored model not found. creating...')
    await trainer.save()
  }

  const totalRewardField = $('#reward-total')
  const rewardField = [
    $('#reward-0'),
    $('#reward-1'),
    $('#reward-2'),
    $('#reward-3'),
  ]
  const valueField = $('#value')

  trainer.addEventListener('step', () => {
    totalRewardField.text(agent.totalReward.toFixed(2))
    valueField.text(agent.expectedValue.toFixed(2))
    for(let i=0; i < agent.rewardComponents.length; i++) {
      rewardField[i].text(agent.rewardComponents[i].toFixed(2))
    }
  })

  while(true) {
    await trainer.runEpoch()
  }

})()