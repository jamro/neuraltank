export default class Unit {
  public _name: string;
  public _genome: ArrayBuffer;
  public _score: number = 0;
  public _completed: boolean = false;
  public _inProgress: boolean = false;

  constructor(name: string, genome: ArrayBuffer) {
    this._name = name;
    this._genome = genome;
  }

  public get genome(): ArrayBuffer {
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

  public setScore(value: number): void {
    this._completed = true;
    this._inProgress = false;
    this._score = value;
  }

  public startProcessing(): void {
    this._completed = false;
    this._inProgress = true;
  }

}
