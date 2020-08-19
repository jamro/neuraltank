export enum ActivationType {
  Linear = 0,
  BinaryStep = 1,
  Sigmoid = 2,
  TanH = 3,
  ReLU = 4,
  SoftPlus = 5,
  LeakyReLU = 6,
  Gaussian = 7
}

export default class Activation {

  private _type: ActivationType = ActivationType.Linear;
  
  public get type() : ActivationType {
    return this._type;
  }

  constructor(type: ActivationType) {
    this._type = type;
  }

  public process(value: number): number {
    // https://en.wikipedia.org/wiki/Activation_function
    switch(this._type) {
      case ActivationType.Linear:
        return value;
      case ActivationType.BinaryStep:
        return value < 0 ? 0 : 1;
      case ActivationType.Sigmoid:
        if(value > 100) return 1;
        if(value < -100) return 0;
        return 1/(1+Math.exp(-value));
      case ActivationType.TanH:
        if(value > 100) return 1;
        if(value < -100) return -1;
        return (Math.exp(value) - Math.exp(-value))/(Math.exp(value) + Math.exp(-value));
      case ActivationType.ReLU:
        return value < 0 ? 0 : value;
      case ActivationType.SoftPlus:
        if(value > 100) return value;
        return Math.log(1+Math.exp(value));
      case ActivationType.LeakyReLU:
        if(value > 100) return value;
        return value < 0 ? 0.1*value : value;
      case ActivationType.Gaussian:
        if(value > 100 || value < -100) return 0;
        return Math.exp(-value*value);
      default:
        throw new Error('Unsupported activation type: ' + this._type);
    }
  }

}
