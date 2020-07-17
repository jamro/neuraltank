import code from '../tankAI/aiScript';
declare const JsBattle: JsBattleModule;

export default class SimPlayer {

  private _canvas: HTMLCanvasElement;
  private _domContainer: HTMLDivElement;
  private _isRunning: boolean = false;
  private _simulation: Simulation;
  private _renderer: Renderer;
  private _onFinishCallbacks: (() => void)[] = [];

  constructor(containerName: string) {
    this._domContainer = document.getElementById(containerName) as HTMLDivElement;
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

  public start(): void {
    if(this._isRunning) {
      this.stop();
    }
    this._canvas = document.createElement('canvas') as HTMLCanvasElement;
    this._canvas.style.width = '450px';
    this._canvas.style.height = '300px';
    this._domContainer.appendChild(this._canvas);

    this._renderer = JsBattle.createRenderer('debug') as PixiRenderer;
    this._renderer.init(this._canvas);
    this._renderer.loadAssets(() => {
      this._simulation = JsBattle.createSimulation(this._renderer);
      this._simulation.setSpeed(2);
      this._simulation.init(900, 600);
      this._simulation.onFinish(() => {
        this._onFinishCallbacks.forEach((c) => c());
      })
      let ai: AiDefinition;

      ai = JsBattle.createAiDefinition();
      ai.fromCode('unit', code);
      this._simulation.addTank(ai);

      ai = JsBattle.createAiDefinition();
      ai.fromCode('unit', code);
      this._simulation.addTank(ai);

      ai = JsBattle.createAiDefinition();
      ai.fromCode('unit', code);
      this._simulation.addTank(ai);

      ai = JsBattle.createAiDefinition();
      ai.fromCode('unit', code);
      this._simulation.addTank(ai);

      ai = JsBattle.createAiDefinition();
      ai.fromCode('unit', code);
      this._simulation.addTank(ai);

      this._simulation.start();
      this._isRunning = true;
    })
  }

}
