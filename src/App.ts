declare const JsBattle: JsBattleModule

export class App {
  
  constructor() {

    let canvas: HTMLCanvasElement = document.getElementById('battlefield') as HTMLCanvasElement;

    let renderer : PixiRenderer = JsBattle.createRenderer('debug') as PixiRenderer;
    renderer.init(canvas);
    renderer.loadAssets(() => {
      let simulation: Simulation = JsBattle.createSimulation(renderer);
      simulation.init(900, 600);
      let ai : AiDefinition;

      ai = JsBattle.createAiDefinition();
      ai.fromFile('jamro');
      simulation.addTank(ai);

      ai = JsBattle.createAiDefinition();
      ai.fromFile('crazy');
      simulation.addTank(ai);

      simulation.start();
    })

  }
}
