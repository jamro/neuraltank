export default function(jsBattle, sim, tankLogic) {
  const bx = (sim.battlefield.minX + sim.battlefield.maxX)/2
  const by = (sim.battlefield.minY + sim.battlefield.maxY)/2;

  const opponentCode = `importScripts('lib/tank.js');
    tank.init(function(settings, info) {

    })
    tank.loop(function(state, control) {

    });`
  
  let opponent
  let opponentTank

  opponent = jsBattle.createAiDefinition();
  opponent.fromCode('opponent', opponentCode);
  opponent.disableSandbox()
  opponentTank = sim.addTank(opponent).tank
  opponentTank.moveTo(
    bx + -50 + Math.random()*100, 
    by - 100 - Math.random()*100,
  )

  tankLogic.tankModel.moveTo(bx, by, -90)
}
