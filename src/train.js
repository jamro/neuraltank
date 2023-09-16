import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'remixicon/fonts/remixicon.css'
import { LocalStorageServer } from './worker/LocalStorageProxy';
import MessageBus from './worker/MessageBus';
import initUi from './ui/train'
import BootCamp from './BootCamp';

(async () => {
  console.log("... Neural Tank ...")
  const bootCamp = new BootCamp()
  if(!bootCamp.inProgress) {
    window.location.href = '/index.html'
    return
  }
  const trainerWorker = new Worker("worker.js");
  const messageBus = new MessageBus(trainerWorker)
  const localStorageServer = new LocalStorageServer(messageBus)
  console.log("Waiting for worker to say hello")
  await new Promise(done => messageBus.addEventListener('workerHello', done))
  console.log("The worker is alive. initializing...")
  messageBus.send('initWorker')

  initUi(messageBus, bootCamp)

})()