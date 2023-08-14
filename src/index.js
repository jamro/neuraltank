import PolicyNetwork from "./PolicyNetwork";
import TankLogic from "./TankLogic";

console.log("Neural Tank")
console.log("Creating policy network")

const policy = new PolicyNetwork()
const tankLogic = new TankLogic(JsBattle, policy)
tankLogic.installCallbacks(window)


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


const opponentCode = `importScripts('lib/tank.js');
tank.init(function(settings, info) {

})
tank.loop(function(state, control) {

});`


const batchSize = 10
let batchIndex = 0
let epochIndex = 1
function startGame() {
  if(batchIndex === 0) {
    console.log(`Starting batch ${epochIndex} =======================`)
    policy.onBatchStart()
  }
  policy.onGameStart()

  const canvas = document.getElementById('battlefield');
  const renderer = JsBattle.createRenderer('debug');
  renderer.init(canvas);
  
  const simulation = JsBattle.createSimulation(renderer);
  simulation.init(900, 600);
  const bx = (simulation.battlefield.minX + simulation.battlefield.maxX)/2
  const by = (simulation.battlefield.minY + simulation.battlefield.maxY)/2;
  
  const ai = tankLogic.createAI(simulation)
  
  let opponent = JsBattle.createAiDefinition();
  opponent.fromCode('opponent', opponentCode);
  opponent.disableSandbox()
  let opponentTank = simulation.addTank(opponent).tank
  opponentTank.moveTo(bx+200, by+200, 0)

  opponent = JsBattle.createAiDefinition();
  opponent.fromCode('opponent', opponentCode);
  opponent.disableSandbox()
  opponentTank = simulation.addTank(opponent).tank
  opponentTank.moveTo(bx+200, by-200, 0)

  opponent = JsBattle.createAiDefinition();
  opponent.fromCode('opponent', opponentCode);
  opponent.disableSandbox()
  opponentTank = simulation.addTank(opponent).tank
  opponentTank.moveTo(bx-200, by, 0)
  
  simulation.onFinish(() => {
    console.log(`Game ${batchIndex+1}/${batchSize} completed`)
    policy.onGameFinish()
    batchIndex++
    if(batchIndex >= batchSize) {
      console.log(`Batch ${epochIndex} completed. Best score: ${mean(policy.gameScores)}`)
      policy.onBatchFinish()
      batchIndex = 0
      epochIndex++
    }
    startGame()
  })
  
  simulation.setRendererQuality(0)
  simulation.setSpeed(100)
  simulation.timeLimit = 15000

  tankLogic.tankModel.moveTo(bx, by, 0)

  simulation.start()
  window.simulation = simulation
}

startGame()
