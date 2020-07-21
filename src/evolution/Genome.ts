export default class Genome {

  private _data:Uint8Array;
  private _hash:number;

  constructor(buffer?:ArrayBuffer) {
    if(buffer) {
      this._data = new Uint8Array(buffer);
    } else {
      this._data = new Uint8Array(0);
    }
    this._hash = Genome.hash(this._data);
  }

  public get data():ArrayBuffer {
    return this._data.buffer;
  }

  public get hash():number {
    return this._hash;
  }

  private static hash(data: Uint8Array):number{
    return data.reduce((a:number,b:number) => {
      a=((a<<5)-a)+Math.round(b/10);
      return a&a
    },0);
  }

  public crossover(genome:Genome): Genome {
    let dataB: Uint8Array = new Uint8Array(genome.data);
    if(this._data.length != dataB.length) {
      throw new Error('Cannot crossover genomes with different lengths');
    }
    let oputputData: Uint8Array = new Uint8Array(this._data.length);

    for(let byteIndex: number = 0; byteIndex < this._data.length; byteIndex++) {
      let byteA: number = this._data[byteIndex];
      let byteB: number = dataB[byteIndex];
      let mask: number = Math.round(Math.random()*0xff);
      let outputByte: number = (byteA & mask) | (byteB & ~mask);
      oputputData[byteIndex] = outputByte;
    }

    return new Genome(oputputData.buffer);
  }

  public mutate(): Genome {
    let oputputData: Uint8Array = new Uint8Array(this._data.buffer.slice(0));
    let index:number = Math.floor(Math.random()*this._data.length);
    oputputData[index] = Math.round(Math.random()*0xff);

    return new Genome(oputputData.buffer);
  }

  public toJSON(): any {
    return {
      data: Array.from(this._data)
    }
  }

  public static fromJSON(json:any): Genome {
    let genome:Genome = new Genome();
    genome._data = new Uint8Array(json.data);
    genome._hash = Genome.hash(genome._data);
    return genome;
  }
}
