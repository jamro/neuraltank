console.log("Neural Tank")


function tankInit(settings, info) {

}

function tankLoop(state, control) {
  control.THROTTLE = 0.5;
  control.TURN = 1;
  control.SHOOT = 0.1
}

window.tankInit = tankInit
window.tankLoop = tankLoop

const code = `importScripts('lib/tank.js');
tank.init(function(settings, info) {
  tankInit(settings, info)
})
tank.loop(function(state, control) {
  tankLoop(state, control)
});`
var canvas = document.getElementById('battlefield');
var renderer = JsBattle.createRenderer('debug');
renderer.init(canvas);

var simulation = JsBattle.createSimulation(renderer);
simulation.init(900, 600);
for(var i=0; i < 5; i++) {
  var ai = JsBattle.createAiDefinition();
  ai.fromCode('neuraltank', code);
  ai.disableSandbox()
  simulation.addTank(ai);
}
simulation.start()