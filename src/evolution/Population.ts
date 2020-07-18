import Unit from "./Unit";

const GENOME_LENGTH: number = 336;

export default class Population {
  private _units: Unit[] = [];
  private _unitIndex: number = 1;

  get size():number {
    return this._units.length;
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
      this._units.push(new Unit('tank-' + this._unitIndex, genome.buffer));
      this._unitIndex++;
    }
  }

  pickFree(): Unit {
    for(let i:number=0; i<this._units.length;i++) {
      if(!this._units[i].completed && !this._units[i].inProgress) {
        return this._units[i];
      }
    }
    return null;
  }

}
