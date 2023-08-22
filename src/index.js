import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import PolicyNetwork from "./PolicyNetwork";
import TankLogic from "./TankLogic";
import Trainer from './Trainer';
import initUI from './ui';
import 'remixicon/fonts/remixicon.css'


(async () => {
  console.log("Neural Tank")

  tf.setBackend('webgl');
  await tf.ready()
  console.log("TF Backend:", tf.getBackend())

  const policy = new PolicyNetwork()
  const tankLogic = new TankLogic(JsBattle, policy)
  tankLogic.installCallbacks(window)
  const trainer = new Trainer(policy, tankLogic, JsBattle)

  if(!(await trainer.restore())) {
    console.log('Stored model not found. creating...')
    await trainer.save()
  }

  initUI(trainer, tankLogic, policy)

  while(true) {
    await trainer.runEpoch()
  }
})()