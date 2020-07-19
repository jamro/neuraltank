import Unit from "./Unit";
import Genome from "./Genome";

const GENOME_LENGTH: number = 336;

export default class Population {
  private _units: Unit[] = [];
  private _unitIndex: number = 1;
  private _generation: number = 1;
  private _bestScore: number = 0;

  get size():number {
    return this._units.length;
  }

  get bestScore():number {
    return this._bestScore;
  }

  get generation():number {
    return this._generation;
  }

  get units():Unit[] {
    return this._units;
  }

  create(size: number):void {
    while(this.size < size) {
      let genome: Uint8Array = new Uint8Array(GENOME_LENGTH);
      for(let i:number = 0; i < GENOME_LENGTH; i++) {
        genome[i] = Math.round(Math.random()*0xff);
      }
      this._units.push(new Unit('tank-' + this._unitIndex++, new Genome(genome.buffer)));
    }
  }

  private pickFitUnit(normalizedPopulation: Unit[]): Unit {
    let randomPlace:number = Math.random();
    for(let i=0; i < normalizedPopulation.length; i++) {
      if(normalizedPopulation[i].score >= randomPlace) {
        return normalizedPopulation[i];
      }
    }
    return normalizedPopulation[normalizedPopulation.length-1];
  }

  private crossover(g1:Genome, g2:Genome): Genome {
    return g1;
  }

  evolve(): void {
    let oldGeneration:Unit[] = this._units;
    oldGeneration = oldGeneration.sort((a, b) => b.score - a.score);
    this._bestScore = oldGeneration[0].score;
    let scoreSum: number = oldGeneration.reduce((sum, unit) => sum + unit.score, 0);
    oldGeneration.forEach((unit) => unit.setScore(unit.score/scoreSum));
    for(let i: number = 1; i < oldGeneration.length;i++) {
      oldGeneration[i].setScore(oldGeneration[i-1].score+oldGeneration[i].score);
    }
    oldGeneration[oldGeneration.length-1].setScore(1);

    let newGeneration: Unit[] = [];
    while(newGeneration.length < oldGeneration.length) {
      let parentA:Unit = this.pickFitUnit(oldGeneration);
      let parentB:Unit = this.pickFitUnit(oldGeneration);
      let childGenome: Genome = parentA.genome.crossover(parentB.genome);
      if(Math.random() > 0.99) {
        childGenome = childGenome.mutate();
      }
      newGeneration.push(new Unit('tank-' + this._unitIndex++, childGenome));
    }

    this._units = newGeneration;
    this._generation++;
  }

  pickFree(): Unit {
    for(let i:number=0; i<this._units.length;i++) {
      if(!this._units[i].completed && !this._units[i].inProgress) {
        return this._units[i];
      }
    }
    return null;
  }

  get completed(): boolean {
    return !this._units.find((unit) => !unit.completed);
  }

  public toJSON(): any {
    return {
      generation: this._generation,
      unitIndex: this._unitIndex,
      bestScore: this._bestScore,
      units: this._units.map((u) => u.toJSON()),
    }
  }

  public save(name:string):void {
    localStorage.setItem(name + '-' + this._units.length, JSON.stringify(this.toJSON()))
  }

  public load(name:string):void {
    let jsonString:string = localStorage.getItem(name + '-' + this._units.length);
    if(!jsonString) {
      return;
    }
    let json:any = JSON.parse(jsonString);
    this._generation = json.generation;
    this._unitIndex = json.unitIndex;
    this._bestScore = json.bestScore;
    this._units = json.units
      .map((json: any): Unit => Unit.fromJSON(json))
      .map((unit:Unit): Unit => {
        if(unit.inProgress && !unit.completed) {
          unit.reset();
        }
        return unit;
      })

  }

}
