
declare class JsBattleModule {
  createSimulation(renderer : Renderer, debug? : boolean) : Simulation;
  createAiDefinition() : AiDefinition;
  createUBD() : UltimateBattleDescriptor;
  createRenderer(name : string, debug? : boolean) : Renderer;
}

declare class PixiRenderer {
  init(canvas : HTMLCanvasElement) : void;
  loadAssets(done : () => void);
}

declare class Simulation {
  init(width : int, height: int) : void;
  addTank(ai : AiDefinition) : void;
  start() : void;
}

declare class AiDefinition {
  fromFile(name : string) : void;
}
