import SimPlayer from './ui/SimPlayer';
import Population from './evolution/Population';
import PopulationHud from './ui/PopulationHud';
import config from './config';

export class SimApp {

  private _players: SimPlayer[] =[];
  private _population: Population;
  private _populationHud: PopulationHud;

  constructor() {
    this._population = new Population();
    this._population.create(config.populationSize);
    this._population.load(config.populationName);
    if(this._population.completed) {
      this.onPopulationCompleted();
    }
    this._populationHud = new PopulationHud('summary', this._population );

    for(let i:number=0; i < this._populationHud.settingsPopup.concurrency; i++) {
      this.createSimPlayer();
    }

    this._populationHud.onChange(():void => {
      while(this._players.length > 0) {
        let p:SimPlayer = this._players.pop();
        p.releaseUnits();
        p.stop();
        p.destroy();
      }
      while(this._players.length < this._populationHud.settingsPopup.concurrency) {
        this.createSimPlayer();
      }

      this._players.forEach((p):void => {
        p.timeLimit = this._populationHud.settingsPopup.battleDuration;
        p.simSpeed = this._populationHud.settingsPopup.simSpeed;
        p.trainingUnits = this._populationHud.settingsPopup.trainingUnits;
        p.dummyUnits = this._populationHud.settingsPopup.dummyUnits;
        p.dummyType = this._populationHud.settingsPopup.dummyType;
        p.renderer = this._populationHud.settingsPopup.renderer;
      })

      this._population.mutationProbability = this._populationHud.settingsPopup.mutation;
    });
    this._populationHud.importPopup.onLoad((json:any):void => {
      this._population.restoreFromJSON(json);
      while(this._players.length > 0) {
        let p:SimPlayer = this._players.pop();
        p.releaseUnits();
        p.stop();
        p.destroy();
      }
      while(this._players.length < this._populationHud.settingsPopup.concurrency) {
        this.createSimPlayer();
      }
    });
  }

  private createSimPlayer():void {
    let simRoot:HTMLDivElement = document.getElementById('sim') as HTMLDivElement;
    let sim: SimPlayer = new SimPlayer(simRoot);
    sim.timeLimit = this._populationHud.settingsPopup.battleDuration;
    sim.simSpeed = this._populationHud.settingsPopup.simSpeed;
    sim.trainingUnits = this._populationHud.settingsPopup.trainingUnits;
    sim.dummyUnits = this._populationHud.settingsPopup.dummyUnits;
    sim.dummyType = this._populationHud.settingsPopup.dummyType;
    sim.renderer = this._populationHud.settingsPopup.renderer;

    sim.create();
    sim.onFinish(() => {
      if(this._population.completed) {
        sim.stop();
        this.onPopulationCompleted();
      } else {
        sim.start(this._population)
      }
      this._population.save(config.populationName);
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
