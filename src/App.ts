import SimPlayer from './sim/SimPlayer';
import Population from './evolution/Population';
import PopulationView from './evolution/PopulationView';

export class App {

  constructor() {

    let population:Population = new Population();
    population.create(150);
    let populationView: PopulationView = new PopulationView('population', population);

    let simRoot:HTMLDivElement = document.getElementById('sim') as HTMLDivElement;
    for(let i:number=1; i<=6; i++) {
      let sim: SimPlayer = new SimPlayer(simRoot);
      sim.onFinish(() => sim.start(population));
      sim.start(population);
    }

  }
}
