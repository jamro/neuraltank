export default function(jsBattle, sim, tankLogic) {
  const bx = (sim.battlefield.minX + sim.battlefield.maxX)/2
  const by = (sim.battlefield.minY + sim.battlefield.maxY)/2;

  const flip = Math.random() < 0.5 ? -1 : 1
  
  const opponentCode = `importScripts('lib/tank.js');
    tank.init(function(settings, info) {
      this.t = 0
    })
    tank.loop(function(state, control) {
      this.t ++
      const cos = Math.cos(this.t/90 + Math.PI/2)
      if(cos === 0) {
        control.THROTTLE =0
      } else {
        control.THROTTLE = Math.abs(cos)/cos * Math.sqrt(Math.abs(cos))
      }
    });`
  
  let opponent = jsBattle.createAiDefinition();
  opponent.fromCode('opponent', opponentCode);
  opponent.disableSandbox()
  let opponentTank = sim.addTank(opponent).tank
  opponentTank.moveTo(bx-30*flip, by-120, (flip > 0) ? 180 : 0)

  tankLogic.tankModel.moveTo(bx, by, -135+Math.random()*90)
}
