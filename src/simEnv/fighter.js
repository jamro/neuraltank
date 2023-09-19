export default function(jsBattle, sim, tankLogic) {
  const bx = (sim.battlefield.minX + sim.battlefield.maxX)/2
  const by = (sim.battlefield.minY + sim.battlefield.maxY)/2;

  const opponentCode = `importScripts('lib/tank.js');

  var turnTime;
  
  // SHOOT ENEMY ---------------------------------------------------------------------------------
  function shootEnemy(state, control) {
    let enemy = state.radar.enemy;
    if(!enemy) {
      return;
    }
  
    let targetX = enemy.x 
    let targetY = enemy.y
  
    let targetAngle = Math.deg.atan2(targetY - state.y, targetX - state.x);
    let gunAngle = Math.deg.normalize(targetAngle - state.angle);
  
    let angleDiff = Math.deg.normalize(gunAngle - state.gun.angle);
    control.GUN_TURN = 0.3 * angleDiff;
  
    if(Math.abs(angleDiff) < 1) {
      control.SHOOT = 0.6;
    }
  }
  
  // SCAN ENEMY ---------------------------------------------------------------------------------
  function scanEnemy(state, control) {
    if(!state.radar.enemy) {
      control.RADAR_TURN = 1;
    } else {
      let targetAngle = Math.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
      let radarAngle = Math.deg.normalize(targetAngle - state.angle);
      let angleDiff = Math.deg.normalize(radarAngle - state.radar.angle);
      control.RADAR_TURN = 0.3 * angleDiff;
    }
  }
  
  // FOLLOW ENEMY ---------------------------------------------------------------------------------
  function followEnemy(state, control) {
    if(!state.radar.enemy) {
      return;
    }
  
    let targetAngle = Math.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
    let bodyAngleDiff = Math.deg.normalize(targetAngle - state.angle);
    control.TURN = 0.5 * bodyAngleDiff;
  
    let targetDistance = Math.distance(state.x, state.y, state.radar.enemy.x, state.radar.enemy.y);
    let distanceDiff = targetDistance - 150;
    control.THROTTLE = distanceDiff/100;
  }
  
  // EXPLORE THE BATTLEFIELD ---------------------------------------------------------------------------------
  function exploreBattlefiield(state, control) {
    if(state.radar.enemy) {
      control.THROTTLE = 0;
      return;
    }
  
    if(state.collisions.wall || turnTime > 0 || state.radar.enemy) {
      control.THROTTLE = 0;
    } else {
      control.THROTTLE = 1;
    }
  
    if(state.collisions.wall) {
      // start turning when hitting a wall
      turnTime = 10;
    }
  
    // keep turning whenever turn timer is above zero
    // reduce the timer with each step of the simulation
    if(turnTime > 0) {
      control.TURN = 1;
      turnTime--;
    } else {
      control.TURN = 0;
    }
  }
  // -------------------------------------------------------------------------------------------
  tank.init(function(settings, info) {
    // do not turn at the beginning
  turnTime = 0;
  });
  
  tank.loop(function(state, control) {
    shootEnemy(state, control);
    scanEnemy(state, control);
    followEnemy(state, control);
    exploreBattlefiield(state, control);
  });`
  
  let opponent
  let opponentTank

  opponent = jsBattle.createAiDefinition();
  opponent.fromCode('opponent', opponentCode);
  opponent.disableSandbox()
  opponentTank = sim.addTank(opponent).tank
  opponentTank.moveTo(
    bx + -20 + Math.random()*40, 
    by - 100,
    -90
  )

  tankLogic.tankModel.moveTo(bx, by+100, 0)
}
