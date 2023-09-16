import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'remixicon/fonts/remixicon.css'
import initUi from './ui/home'
import Settings from './Settings';
import JsBattle from 'jsbattle-engine';
import Agent from './agent/Agent';
import TankLogic from './agent/TankLogic';
import Trainer from './Trainer';
import BootCamp from './BootCamp';

(async () => {
  console.log("... Neural Tank ...")

  const bootCamp = new BootCamp()
  if(bootCamp.inProgress) {
    window.location.href = '/train.html'
    return
  }
  const settings = new Settings()
  await settings.init()

  const agent = new Agent(settings)
  const tankLogic = new TankLogic(JsBattle, agent)
  const trainer = new Trainer(agent, tankLogic, JsBattle, settings, null)
  await trainer.restore()
 
  initUi(settings, trainer, bootCamp)

})()