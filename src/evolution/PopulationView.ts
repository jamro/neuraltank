import Population from "./Population";

export default class PopulationView {

  private _domContainer: HTMLDivElement;
  private _population: Population;

  constructor(containerName: string, population: Population) {
    this._domContainer = document.getElementById(containerName) as HTMLDivElement;
    this._population = population;

    setInterval(() => {
      let result = '';
      let progress = 0;
      for(let i=0; i<this._population.size; i++) {
        if(this._population.units[i].completed) {
          result += "#";
          progress++;
        } else if(this._population.units[i].inProgress) {
          result += "+";
        } else  {
          result += "-";
        }
      }
      progress = 100*(progress / this._population.size)
      this._domContainer.innerText = `population (${progress.toFixed(1)}%) ${result}\ngeneration: ${this._population.generation}\nScore range: ${this._population.worstScore.toFixed(2)} - ${this._population.bestScore.toFixed(2)}\ndiversity: ${this._population.diversity}%`;
    }, 50);
  }

}
