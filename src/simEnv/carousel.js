export default function(jsBattle, sim, tankLogic) {
  const bx = (sim.battlefield.minX + sim.battlefield.maxX)/2
  const by = (sim.battlefield.minY + sim.battlefield.maxY)/2;

  const flip = Math.random() < 0.5 ? -1 : 1

  const opponentCode = `importScripts('lib/tank.js');
    tank.init(function(settings, info) {
      this.flip = info.initData.flip
    })
    tank.loop(function(state, control) {
      control.THROTTLE = 1
      control.TURN = -0.314*this.flip
    });`
  
  let opponent
  let opponentTank

  for(let deg=0; deg < 360; deg+=60) {
    opponent = jsBattle.createAiDefinition();
    opponent.fromCode('opponent', opponentCode, {flip});
    opponent.disableSandbox()
    opponentTank = sim.addTank(opponent).tank
    const rad = deg*(Math.PI/180)
    opponentTank.moveTo(
      bx + Math.cos(rad) * 150, 
      by + Math.sin(rad) * 150, 
      deg-90*flip
    )
  }

  tankLogic.tankModel.moveTo(bx, by)
}
