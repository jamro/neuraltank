import Unit from "./Unit";
import Genome from "./Genome";
import config from '../config';

export default class Population {

  private _units: Unit[] = [];
  private _unitIndex: number = 1;
  private _generation: number = 1;
  private _bestScore: number = 0;
  private _bestGenome: Genome;
  private _worstScore: number = 0;
  private _diversity:number = 100;
  private _scoreHistogram:number[] = [];
  private _lastCompleteTime:number = (new Date()).getTime();
  private _completeTimes:number[] = [];
  private _mutationProbability: number = 0.01;

  get scoreHistogram():number[] {
    return this._scoreHistogram;
  }

  get diversity():number {
    return this._diversity;
  }

  get size():number {
    return this._units.length;
  }

  get bestScore():number {
    return this._bestScore;
  }

  get bestGenome():Genome {
    return this._bestGenome;
  }

  get worstScore():number {
    return this._worstScore;
  }

  get generation():number {
    return this._generation;
  }

  get units():Unit[] {
    return this._units;
  }

  get mutationProbability():number {
    return this._mutationProbability;
  }

  set mutationProbability(v:number) {
    this._mutationProbability = v;
  }

  create(size: number):void {

    this._units = [];
    this._unitIndex = 1;
    this._generation = 1;
    this._bestScore = 0;
    this._bestGenome = null;
    this._worstScore = 0;
    this._diversity = 100;
    this._scoreHistogram = [];
    this._lastCompleteTime = (new Date()).getTime();
    this._completeTimes = [];

    while(this.size < size) {
      let genome: Uint8Array = new Uint8Array(config.genomeLength);
      for(let i:number = 0; i < config.genomeLength; i++) {
        genome[i] = Math.round(Math.random()*0xff);
      }
      this._units.push(new Unit('tank-' + this._unitIndex++, new Genome(genome.buffer)));
    }
    this.updateDiversity();
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

  private updateDiversity(): void {
    let hashTable:number[] = this._units.map((u) => u.genome.hash);
    let uniqueHash = hashTable.filter((v, i, a) => a.indexOf(v) === i);
    this._diversity = Math.round(10000*uniqueHash.length/hashTable.length)/100;
  }

  public evolve(): void {
    let i:number;
    let oldGeneration:Unit[] = this._units;
    oldGeneration = oldGeneration.sort((a, b) => b.score - a.score);
    this._bestScore = oldGeneration[0].score;
    this._bestGenome = oldGeneration[0].genome;
    this._worstScore = oldGeneration[oldGeneration.length-1].score;
    this._scoreHistogram = [];
    for(i=0; i<450; i+=5) {
      this._scoreHistogram.push(oldGeneration.filter((unit:Unit) => unit.score >= i && unit.score < i+5).length);
    }
    this._scoreHistogram.push(oldGeneration.filter((unit:Unit) => unit.score >= 450).length);

    let scoreSum: number = oldGeneration.reduce((sum, unit) => sum + unit.score, 0);
    oldGeneration.forEach((unit) => unit.setScore(unit.score/scoreSum));
    for(i = 1; i < oldGeneration.length;i++) {
      oldGeneration[i].setScore(oldGeneration[i-1].score+oldGeneration[i].score);
    }
    oldGeneration[oldGeneration.length-1].setScore(1);

    let newGeneration: Unit[] = [];
    while(newGeneration.length < oldGeneration.length) {
      let parentA:Unit = this.pickFitUnit(oldGeneration);
      let parentB:Unit = this.pickFitUnit(oldGeneration);
      let childGenome: Genome = parentA.genome.crossover(parentB.genome);
      if(Math.random() > (1-this._mutationProbability)) {
        console.log('mutate')
        childGenome = childGenome.mutate();
      }
      newGeneration.push(new Unit('tank-' + this._unitIndex++, childGenome));
    }

    this._units = newGeneration;
    this._generation++;
    this.updateDiversity();
  }

  public pickFree(): Unit {
    for(let i:number=0; i<this._units.length;i++) {
      if(!this._units[i].completed && !this._units[i].inProgress) {
        return this._units[i];
      }
    }
    return null;
  }

  public get completed(): boolean {
    return !this._units.find((unit) => !unit.completed);
  }

  public toJSON(): any {
    return {
      generation: this._generation,
      unitIndex: this._unitIndex,
      bestScore: this._bestScore,
      bestGenome: this._bestGenome ? this._bestGenome.toJSON() : null,
      worstScore: this._worstScore,
      scoreHistogram: this._scoreHistogram,
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
    this.restoreFromJSON(json);
  }

  public restoreFromJSON(json:any):void {
    this._generation = json.generation;
    this._unitIndex = json.unitIndex;
    this._bestScore = json.bestScore;
    this._worstScore = json.worstScore;
    this._scoreHistogram = json.scoreHistogram;
    if(json.bestGenome) {
      this._bestGenome = Genome.fromJSON(json.bestGenome);
    }
    this._units = json.units
      .map((json: any): Unit => Unit.fromJSON(json))
      .map((unit:Unit): Unit => {
        if(unit.inProgress && !unit.completed) {
          unit.reset();
        }
        return unit;
      })
  }

  public notifyCompleted() {
    let now: number = (new Date()).getTime();
    this._completeTimes.push(now - this._lastCompleteTime);
    this._lastCompleteTime = now;
    while(this._completeTimes.length > this._units.length) {
      this._completeTimes.shift();
    }
  }

  public getUnitProcessingRate():number {
    let count:number = this._completeTimes.length;
    if(count == 0) {
      return 0;
    }
    let averageTime:number = this._completeTimes.reduce((sum:number, val:number):number => sum + val, 0)/count;

    return 60000/averageTime;
  }

  reset() {
    const size:number = this.size;
    this.create(size);
  }

}
