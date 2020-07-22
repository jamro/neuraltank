import SimPlayer from './sim/SimPlayer';
import Population from './evolution/Population';
import PopulationHud from './evolution/PopulationHud';

const POPULATION_SIZE:number = 200;
const PLAYER_COUNT:number = 5;
const POPULATION_NAME:string = 'alice-0.0.1';

export class App {

  private _players: SimPlayer[] =[];
  private _population: Population;
  private _populationHud: PopulationHud;

  constructor() {
    this._population = new Population();
    this._population.create(POPULATION_SIZE);
    this._population.load(POPULATION_NAME);
    if(this._population.completed) {
      this.onPopulationCompleted();
    }
    this._populationHud = new PopulationHud('summary', this._population );

    for(let i:number=0; i < this._populationHud.settings.concurrency; i++) {
      this.createSimPlayer();
    }

    this._populationHud.settings.onSave(():void => {
      while(this._players.length > 0) {
        let p:SimPlayer = this._players.pop();
        p.releaseUnits();
        p.stop();
        p.destroy();
      }
      while(this._players.length < this._populationHud.settings.concurrency) {
        this.createSimPlayer();
      }

      this._players.forEach((p):void => {
        p.timeLimit = this._populationHud.settings.battleDuration;
        p.simSpeed = this._populationHud.settings.simSpeed;
        p.trainingUnits = this._populationHud.settings.trainingUnits;
        p.dummyUnits = this._populationHud.settings.dummyUnits;
        p.dummyType = this._populationHud.settings.dummyType;
        p.renderer = this._populationHud.settings.renderer;
      })
    })
  }

  private createSimPlayer():void {
    let simRoot:HTMLDivElement = document.getElementById('sim') as HTMLDivElement;
    let sim: SimPlayer = new SimPlayer(simRoot);
    sim.timeLimit = this._populationHud.settings.battleDuration;
    sim.simSpeed = this._populationHud.settings.simSpeed;
    sim.trainingUnits = this._populationHud.settings.trainingUnits;
    sim.dummyUnits = this._populationHud.settings.dummyUnits;
    sim.dummyType = this._populationHud.settings.dummyType;
    sim.renderer = this._populationHud.settings.renderer;
    
    sim.create();
    sim.onFinish(() => {
      if(this._population.completed) {
        sim.stop();
        this.onPopulationCompleted();
      } else {
        sim.start(this._population)
      }
      this._population.save(POPULATION_NAME);
    });
    sim.start(this._population);
    this._players.push(sim);
  }

  private onPopulationCompleted() {
    let i:number;
    for(i=0; i<this._players.length; i++) {
      this._players[i].stop();
    }
    this._population.evolve();
    for(i=0; i<this._players.length; i++) {
      this._players[i].start(this._population);
    }
  }
}
