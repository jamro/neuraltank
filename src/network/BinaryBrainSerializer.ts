import BrainSerializer, { BrainFieldType } from "./BrainSerializer";

export default class BinaryBrainSerializer implements BrainSerializer {

  private _data: Uint32Array;

  allocate(fieldCount: number): void {
    this._data = new Uint32Array(fieldCount);
  }

  writeRaw(value: number, index: number, min: number, max: number):void {
    if(isNaN(value)) {
      throw new Error('valid numeric value is erquired');
    }
    if(min >= max) {
      throw new Error(`Incorrect scale (${min} - ${max})`);
    }
    if(index >= this._data.length) {
      throw new Error(`Index ${index} out of range. Allocation: ${this._data.length}`)
    }
    value = Math.min(max, Math.max(min, value));
    value = (value - min)/(max-min);
    value *= 0xffffffff;
    value = Math.round(value);
    this._data[index] = value;
  }

  readRaw(index: number, min: number, max: number): number {
    if(min >= max) {
      throw new Error(`Incorrect scale (${min} - ${max})`);
    }
    let value:number = this._data[index];
    value /= 0xffffffff;
    value *= (max-min);
    value += min;
    return value;
  }

  write(value: number, index: number, type: BrainFieldType): void {
    switch(type) {
      case BrainFieldType.ConnectionWeight:
        return this.writeRaw(value, index, -4, 4);
      case BrainFieldType.Bias:
        return this.writeRaw(value, index, -1, 1);
      case BrainFieldType.ActivationType:
        return this.writeRaw(Math.round(value), index, 0, 7);
      default:
        throw new Error(`BrainFieldType(${type}) not supported`)
    }
  }

  read(index: number, type: BrainFieldType): number {
    switch(type) {
      case BrainFieldType.ConnectionWeight:
        return this.readRaw(index, -4, 4);
      case BrainFieldType.Bias:
        return this.readRaw(index, -1, 1);
      case BrainFieldType.ActivationType:
        return Math.round(this.readRaw(index, 0, 7));
      default:
        throw new Error(`BrainFieldType(${type}) not supported`)
    }
  }

  serialize(): ArrayBuffer {
    if(!this._data) {
      throw new Error('No data to serialize');
    }
    return this._data.buffer;
  }

  deserialize(data: ArrayBuffer): void {
    this._data = new Uint32Array(data);
  }

}
