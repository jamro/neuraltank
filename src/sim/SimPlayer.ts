import code from '../tankAI/aiScript';
import Population from '../evolution/Population';
import Unit from '../evolution/Unit';
declare const JsBattle: JsBattleModule;

export default class SimPlayer {

  private _canvas: HTMLCanvasElement;
  private _domContainer: HTMLDivElement;
  private _rootContainer: HTMLDivElement;
  private _isRunning: boolean = false;
  private _simulation: Simulation;
  private _renderer: Renderer;
  private _onFinishCallbacks: (() => void)[] = [];
  private _units: Unit[] = [];

  constructor(rootContainer: HTMLDivElement) {
    this._rootContainer = rootContainer;
  }

  public onFinish(callback: () => void): void {
    this._onFinishCallbacks.push(callback);
  }

  public create():void {
    this._domContainer = document.createElement('div') as HTMLDivElement;
    this._domContainer.style.width = '450px';
    this._domContainer.style.display = 'inline-block';
    this._rootContainer.appendChild(this._domContainer);
  }

  public destroy():void {
    if(this._domContainer && this._domContainer.parentNode) {
      this._domContainer.parentNode.removeChild(this._domContainer);
      this._domContainer = null;
    }
  }

  public stop(): void {
    while(this._domContainer.firstChild) {
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
    this._units = [];
  }

  public releaseUnits():void {
    while(this._units.length) {
      this._units.pop().reset();
    }
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
      this._simulation.timeLimit = 60000;
      this._simulation.init(900, 600);
      this._simulation.onFinish(() => {
        this._simulation.tankList
          .filter((tank) => tank.name != 'dummy')
          .forEach((tank) => {
            population.units.find((unit) => unit.name == tank.name).setScore(tank.score);
          })
        this._onFinishCallbacks.forEach((c) => c());
      })
      if(!population.pickFree()) {
        return;
      }

      let dummyCode: string = `importScripts("lib/tank.js");var turnDirection,turnTimer;tank.init(function(n,r){n.SKIN="forest",turnDirection=Math.random()<.5?1:-1,turnTimer=Math.round(Math.randomRange(0,30))}),tank.loop(function(n,r){(n.collisions.wall||n.collisions.enemy||n.collisions.ally)&&(turnTimer=Math.round(Math.randomRange(20,50))),turnTimer>0?(turnTimer--,r.THROTTLE=0,r.TURN=turnDirection):(r.THROTTLE=1,r.TURN=0),n.radar.enemy&&(r.SHOOT=0)});`;

      let i:number;
      for(i = 0; i < 5 && population.pickFree(); i++) {
        unit = population.pickFree();
        unit.startProcessing();
        ai = JsBattle.createAiDefinition();
        ai.fromCode(unit.name, code, {braindump: unit.genome.data});
        ai.disableSandbox();
        this._simulation.addTank(ai);
        this._units.push(unit);
      }
      for(i = 0; i < 0; i++) {
        ai = JsBattle.createAiDefinition();
        ai.fromCode('dummy', dummyCode);
        ai.disableSandbox();
        this._simulation.addTank(ai);
      }

      this._simulation.start();
      this._isRunning = true;
    })
  }

}
