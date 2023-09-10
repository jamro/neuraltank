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
import initUI from './ui/preview';

(async () => {
  console.log("... Neural Tank ...")

  tf.setBackend('webgl');
  await tf.ready()
  console.log("TF Backend:", tf.getBackend())

  const settings = new Settings()
  await settings.init()

  const agent = new Agent(settings)
  const tankLogic = new TankLogic(JsBattle, agent)
  tankLogic.installCallbacks(window)
  const battleFieldCanvas = document.getElementById('battlefield')
  const trainer = new Trainer(agent, tankLogic, JsBattle, settings, battleFieldCanvas)
  trainer.autoSave = false
  trainer.autoPlay = false
  trainer.simSpeed = 1
  trainer.style = 'debug'

  if(!(await trainer.restore())) {
    console.log('Stored model not found. creating...')
    await trainer.save()
  }

  initUI(trainer, agent)

  await trainer.runEpoch()

})()