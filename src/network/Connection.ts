export default class Connection {

  public input: number = 0;
  public weight: number = 1;

  public process():number {
    return this.input * this.weight;
  }
}
