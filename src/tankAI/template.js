importScripts('lib/tank.js');

/** INJECT_TANK_AI **/

const ai = new TankAI.default();

tank.init(function(settings, info) {
  ai.init(settings, info)
});

tank.loop(function(state, control) {
  ai.loop(state, control);
});
