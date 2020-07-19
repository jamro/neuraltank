export default class Genome {

  private _data:Uint8Array;

  constructor(buffer:ArrayBuffer) {
    this._data = new Uint8Array(buffer);
  }

  public get data():ArrayBuffer {
    return this._data.buffer;
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
}
