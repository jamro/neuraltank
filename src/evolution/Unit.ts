import Genome from "./Genome";

export default class Unit {
  public _name: string;
  public _genome: Genome;
  public _score: number = 0;
  public _completed: boolean = false;
  public _inProgress: boolean = false;

  constructor(name?: string, genome?: Genome) {
    this._name = name || 'anonymous';
    this._genome = genome || new Genome();
  }

  public get genome(): Genome {
    return this._genome;
  }
  public get name(): string {
    return this._name;
  }
  public get score(): number {
    return this._score;
  }
  public get completed(): boolean {
    return this._completed;
  }
  public get inProgress(): boolean {
    return this._inProgress;
  }

  public reset(): void {
    this._completed = false;
    this._inProgress = false;
    this._score = 0;
  }

  public setScore(value: number): void {
    this._completed = true;
    this._inProgress = false;
    this._score = value;
  }

  public startProcessing(): void {
    this._completed = false;
    this._inProgress = true;
  }

  public toJSON(): any {
    return {
      name: this._name,
      genome: this._genome.toJSON(),
      score: this._score,
      completed: this._completed,
      inProgress: this._inProgress,
    }
  }

  public static fromJSON(json:any):Unit {
    let unit:Unit = new Unit();
    unit._name = json.name;
    unit._genome = Genome.fromJSON(json.genome);
    unit._score = json.score
    unit._completed = json.completed
    unit._inProgress = json.inProgress
    return unit;
  }

}
