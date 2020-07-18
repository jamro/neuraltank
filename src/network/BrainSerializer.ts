export enum BrainFieldType {
  ConnectionWeight,
  Bias,
  ActivationType
}

export default interface BrainSerializer {

  allocate(fieldCount: number): void;
  write(value: number, index: number, type: BrainFieldType): void;
  read(index: number, type: BrainFieldType): number;
  serialize():any;
  deserialize(data:any):void;

}
