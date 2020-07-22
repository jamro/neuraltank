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
  public timeLimit: number = 60000;
  public simSpeed: number = 2;
  public trainingUnits: number = 4;
  public dummyUnits: number = 1;
  public dummyType: string = 'crawler';

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
      this._simulation.setSpeed(this.simSpeed);
      this._simulation.timeLimit = this.timeLimit;
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

      let dummyCode: any = {
        static: `importScripts("lib/tank.js");tank.init(function(n,r){}),tank.loop(function(n,r){});`,
        crawler: `importScripts("lib/tank.js");var turnDirection,turnTimer;tank.init(function(n,r){n.SKIN="forest",turnDirection=Math.random()<.5?1:-1,turnTimer=Math.round(Math.randomRange(0,30))}),tank.loop(function(n,r){(n.collisions.wall||n.collisions.enemy||n.collisions.ally)&&(turnTimer=Math.round(Math.randomRange(20,50))),turnTimer>0?(turnTimer--,r.THROTTLE=0,r.TURN=turnDirection):(r.THROTTLE=1,r.TURN=0),n.radar.enemy&&(r.SHOOT=0)});`,
        sniper: `importScripts("lib/tank.js");var power;tank.init(function(a,e){a.SKIN="forest",power=.9*Math.random()+.1}),tank.loop(function(a,e){if(a.radar.enemy){var r=Math.deg.atan2(a.radar.enemy.y-a.y,a.radar.enemy.x-a.x),n=Math.deg.normalize(r-(a.radar.angle+a.angle));e.RADAR_TURN=.2*n;var t=Math.deg.normalize(r-(a.gun.angle+a.angle));e.GUN_TURN=.2*t,Math.abs(t)<3&&(e.SHOOT=power),e.DEBUG="power="+power.toFixed(2)}else e.RADAR_TURN=1});`,
        predator: `importScripts("lib/tank.js");var turnTime;function shootEnemy(e,a){let n=e.radar.enemy;if(!n)return;let t=Math.distance(e.x,e.y,n.x,n.y)/4,r=n.x+t*n.speed*Math.cos(Math.deg2rad(n.angle)),l=n.y+t*n.speed*Math.sin(Math.deg2rad(n.angle)),i=Math.deg.atan2(l-e.y,r-e.x),d=Math.deg.normalize(i-e.angle),m=Math.deg.normalize(d-e.gun.angle);a.GUN_TURN=.3*m,Math.abs(m)<1&&(a.SHOOT=1)}function scanEnemy(e,a){if(e.radar.enemy){let n=Math.deg.atan2(e.radar.enemy.y-e.y,e.radar.enemy.x-e.x),t=Math.deg.normalize(n-e.angle),r=Math.deg.normalize(t-e.radar.angle);a.RADAR_TURN=r}else a.RADAR_TURN=1}function followEnemy(e,a){if(!e.radar.enemy)return;let n=Math.deg.atan2(e.radar.enemy.y-e.y,e.radar.enemy.x-e.x),t=Math.deg.normalize(n-e.angle);a.TURN=.5*t;let r=Math.distance(e.x,e.y,e.radar.enemy.x,e.radar.enemy.y)-150;a.THROTTLE=r/100}function exploreBattlefiield(e,a){e.radar.enemy?a.THROTTLE=0:(e.collisions.wall||turnTime>0||e.radar.enemy?a.THROTTLE=0:a.THROTTLE=1,e.collisions.wall&&(turnTime=10),turnTime>0?(a.TURN=1,turnTime--):a.TURN=0)}tank.init(function(e,a){turnTime=0}),tank.loop(function(e,a){shootEnemy(e,a),scanEnemy(e,a),followEnemy(e,a),exploreBattlefiield(e,a)});`
      };

      let playerCount:number = 0;
      let i:number;
      for(i = 0; i < this.trainingUnits && population.pickFree(); i++) {
        unit = population.pickFree();
        unit.startProcessing();
        ai = JsBattle.createAiDefinition();
        ai.fromCode(unit.name, code, {braindump: unit.genome.data});
        ai.disableSandbox();
        this._simulation.addTank(ai);
        this._units.push(unit);
        playerCount++;
      }
      for(i = 0; i < this.dummyUnits; i++) {
        ai = JsBattle.createAiDefinition();
        ai.fromCode('dummy', dummyCode[this.dummyType]);
        ai.disableSandbox();
        this._simulation.addTank(ai);
        playerCount++;
      }
      while(playerCount <= 1) {
        ai = JsBattle.createAiDefinition();
        ai.fromCode('dummy', dummyCode['crawler']);
        ai.disableSandbox();
        this._simulation.addTank(ai);
        playerCount++;
      }
      this._simulation.start();
      this._isRunning = true;
    })
  }

}
