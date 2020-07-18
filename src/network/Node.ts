import Connection from "./Connection";
import Activation, { ActivationType } from "./Activation";

export default class Node {
  private _inputs: Connection[] = [];
  private _outputs: Connection[] = [];
  private _value: number = 0;
  private _activation: Activation = new Activation(ActivationType.Linear);
  public bias: number = 0;
  private _inputCount: number = 0;
  private _outputCount: number = 0;

  get inputCount(): number {
    return this._inputCount;
  }

  get outputCount(): number {
    return this._outputCount;
  }

  public get activationType() : ActivationType {
    return this._activation.type;
  }

  public set activationType(type: ActivationType) {
    this._activation = new Activation(type);
  }

  public getInput(index: number): Connection {
    if(!this._inputs[index]) {
      this._inputs[index] = new Connection();
    }
    this._inputCount = Math.max(this._inputCount, index+1);
    return this._inputs[index];
  }

  public setInput(index: number, connection: Connection): void {
    this._inputs[index] = connection;
  }

  public getOutput(index: number): Connection {
    if(!this._outputs[index]) {
      this._outputs[index] = new Connection();
      this._outputs[index].input = this._value;
    }
    this._outputCount = Math.max(this._outputCount, index+1);
    return this._outputs[index];
  }

  public configure(inputWeights: number[], outputWeights: number[], bias: number, activationType: ActivationType) {
    let i: number;
    for(i=0; i < inputWeights.length; i++) {
      this.getInput(i).weight = inputWeights[i];
    }
    for(i=0; i < outputWeights.length; i++) {
      this.getOutput(i).weight = outputWeights[i];
    }
    this.bias = bias;
    this.activationType = activationType;
  }

  public randomize(): void {
    for(let input of this._inputs) {
      input.weight = Math.random()*2-1;
    }
    for(let output of this._outputs) {
      output.weight = Math.random()*2-1;
    }
    this.bias = Math.random()*2-1;

    const activationValues = Object.keys(ActivationType)
      .map((n) => Number.parseInt(n))
      .filter((n) => !Number.isNaN(n));
    this.activationType = activationValues[Math.floor(Math.random()*activationValues.length)];
  }

  public process(): void {
    let value: number = 0;
    for(let input of this._inputs) {
      value += input.process();
    }
    value += this.bias;
    value = this._activation.process(value);
    this._value = value;
    for(let output of this._outputs) {
      output.input = value;
    }
  }
}
