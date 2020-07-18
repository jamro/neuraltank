import code from '../tankAI/aiScript';
import Population from '../evolution/Population';
import Unit from '../evolution/Unit';
declare const JsBattle: JsBattleModule;

export default class SimPlayer {

  private _canvas: HTMLCanvasElement;
  private _domContainer: HTMLDivElement;
  private _isRunning: boolean = false;
  private _simulation: Simulation;
  private _renderer: Renderer;
  private _onFinishCallbacks: (() => void)[] = [];

  constructor(rootContainer: HTMLDivElement) {
    this._domContainer = document.createElement('div') as HTMLDivElement;
    this._domContainer.style.width = '450px';
    this._domContainer.style.display = 'inline-block';
    rootContainer.appendChild(this._domContainer);
  }

  public onFinish(callback: () => void): void {
    this._onFinishCallbacks.push(callback);
  }

  public stop(): void {
    while (this._domContainer.firstChild) {
      this._domContainer.removeChild(this._domContainer.lastChild);
    }
    if(this._simulation) {
      this._simulation.stop();
      this._simulation = null;
    }
    if(this._renderer) {
      this._renderer.stop();
      this._renderer.dispose();
      this._renderer = null;
    }
    this._canvas = null;
    this._isRunning = false;
  }

  public start(population:Population): void {
    if(this._isRunning) {
      this.stop();
    }
    if(!population.pickFree()) {
      return;
    }
    this._canvas = document.createElement('canvas') as HTMLCanvasElement;
    this._canvas.style.width = '450px';
    this._canvas.style.height = '300px';
    this._domContainer.appendChild(this._canvas);

    this._renderer = JsBattle.createRenderer('debug') as PixiRenderer;
    this._renderer.init(this._canvas);
    this._renderer.loadAssets(() => {
      let unit:Unit;
      let ai: AiDefinition;

      this._simulation = JsBattle.createSimulation(this._renderer);
      this._simulation.setSpeed(5);
      this._simulation.init(900, 600);
      this._simulation.onFinish(() => {
        this._simulation.tankList.forEach((tank) => {
          population.units.find((unit) => unit.name == tank.name).setScore(tank.score);
        })
        this._onFinishCallbacks.forEach((c) => c());
      })
      if(!population.pickFree()) {
        return;
      }

      for(let i:number = 0; i < 5 && population.pickFree(); i++) {
        unit = population.pickFree();
        unit.startProcessing();
        ai = JsBattle.createAiDefinition();
        ai.fromCode(unit.name, code, {braindump: unit.genome});
        ai.disableSandbox();
        this._simulation.addTank(ai);
      }

      this._simulation.start();
      this._isRunning = true;
    })
  }

}
