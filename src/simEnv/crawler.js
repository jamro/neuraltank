export default function(jsBattle, sim, tankLogic) {

  const opponentCode = `importScripts('lib/tank.js');

  var turnDirection, turnTimer;
  
  tank.init(function(settings, info) {
    turnDirection = Math.random() < 0.5 ? 1 : -1;
    turnTimer = Math.round(Math.randomRange(0, 30));
  })
  
  tank.loop(function(state, control) {
    if(state.collisions.wall || state.collisions.enemy || state.collisions.ally) {
      turnTimer = Math.round(Math.randomRange(20, 50));
    }
    if(turnTimer > 0) {
      turnTimer--;
      control.THROTTLE = 0;
      control.TURN = turnDirection;
    } else {
      control.THROTTLE = 1;
      control.TURN = 0;
    }
  });`
  
  for(let i=0; i < 3; i++) {
    let opponent = jsBattle.createAiDefinition();
    opponent.fromCode('opponent', opponentCode);
    opponent.disableSandbox()
    sim.addTank(opponent).tank
  }
 
}
