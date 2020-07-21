import SimPlayer from './sim/SimPlayer';
import Population from './evolution/Population';
import PopulationHud from './evolution/PopulationHud';

const POPULATION_SIZE:number = 200;
const PLAYER_COUNT:number = 5;
const POPULATION_NAME:string = 'alice-0.0.1';

export class App {

  private _players: SimPlayer[] =[];
  private _population: Population;

  constructor() {
    this._population = new Population();
    this._population.create(POPULATION_SIZE);
    this._population.load(POPULATION_NAME);
    if(this._population.completed) {
      this.onPopulationCompleted();
    }
    let populationView: PopulationHud = new PopulationHud('summary', this._population );

    for(let i:number=0; i < populationView.settings.concurrency; i++) {
      this.createSimPlayer();
    }

    populationView.settings.onSave(():void => {
      while(this._players.length < populationView.settings.concurrency) {
        this.createSimPlayer();
      }
      while(this._players.length > populationView.settings.concurrency) {
        let p:SimPlayer = this._players.pop();
        p.releaseUnits();
        p.stop();
      }
    })
  }

  private createSimPlayer():void {
    let simRoot:HTMLDivElement = document.getElementById('sim') as HTMLDivElement;
    let sim: SimPlayer = new SimPlayer(simRoot);
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
