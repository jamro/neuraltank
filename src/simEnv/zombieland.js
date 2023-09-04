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

  for(let deg=0; deg < 360; deg+=120) {
    opponent = jsBattle.createAiDefinition();
    opponent.fromCode('opponent', opponentCode);
    opponent.disableSandbox()
    opponentTank = sim.addTank(opponent).tank
    const rad = deg*(Math.PI/180)
    const r = 100+150*Math.random()
    opponentTank.moveTo(
      bx + Math.cos(rad) * r, 
      by + Math.sin(rad) * r, 
      deg-90
    )
    opponentTank._energy = 20
  }

  tankLogic.tankModel.moveTo(bx, by)
}
