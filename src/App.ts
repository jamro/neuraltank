import SimPlayer from './sim/SimPlayer';
import Population from './evolution/Population';
import PopulationView from './evolution/PopulationView';

const POPULATION_SIZE:number = 120;

export class App {

  private _players: SimPlayer[] =[];
  private _population: Population;

  constructor() {
    this._population = new Population();
    this._population.create(POPULATION_SIZE);
    let populationView: PopulationView = new PopulationView('population', this._population );

    let simRoot:HTMLDivElement = document.getElementById('sim') as HTMLDivElement;
    for(let i:number=0; i<6; i++) {
      let sim: SimPlayer = new SimPlayer(simRoot);
      sim.onFinish(() => {
        if(this._population .completed) {
          sim.stop();
          this.onPopulationCompleted();
        } else {
          sim.start(this._population)
        }
      });
      sim.start(this._population);
      this._players.push(sim);
    }
  }

  private onPopulationCompleted() {
    let i:number;
    for(i=0; i<this._players.length; i++) {
      this._players[i].stop();
    }
    this._population.clear();
    this._population.create(POPULATION_SIZE);
    for(i=0; i<this._players.length; i++) {
      this._players[i].start(this._population);
    }
  }
}
