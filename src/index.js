import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import Agent from "./Agent";
import TankLogic from "./TankLogic";
import Trainer from './Trainer';
import initUI from './ui';
import 'remixicon/fonts/remixicon.css'
import Settings from './Settings'

(async () => {
  console.log("Neural Tank")

  tf.setBackend('webgl');
  await tf.ready()
  console.log("TF Backend:", tf.getBackend())

  const settings = new Settings()

  const agent = new Agent()
  const tankLogic = new TankLogic(JsBattle, agent)
  tankLogic.installCallbacks(window)
  const trainer = new Trainer(agent, tankLogic, JsBattle, settings)

  if(!(await trainer.restore())) {
    console.log('Stored model not found. creating...')
    await trainer.save()
  }

  initUI(trainer, tankLogic, agent)

  while(true) {
    await trainer.runEpoch()
  }
})()