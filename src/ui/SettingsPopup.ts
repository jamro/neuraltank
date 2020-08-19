import Popup from "./Popup";

export default class SettingsPopup extends Popup {

  private _saveButton: HTMLButtonElement;
  private _concurrency: number = 1;
  private _simSpeed: number = 1;
  private _trainingUnits: number = 4;
  private _dummyUnits: number = 0;
  private _dummyType: string = 'crawler';
  private _renderer: string = 'debug';
  private _mutation: number = 0.01;
  private _battleDuration: number = 60000;
  private _saveCallbacks: (() => void)[] = [];

  public get concurrency():number {
    return this._concurrency;
  }

  public set concurrency(v:number) {
    this._concurrency = v;
    let input: HTMLSelectElement = document.getElementById('concurrency') as HTMLSelectElement;
    input.value = v.toString();
  }

  public get battleDuration():number {
    return this._battleDuration;
  }

  public set battleDuration(v:number) {
    this._battleDuration = v;
    let input: HTMLSelectElement = document.getElementById('sim-time') as HTMLSelectElement;
    input.value = v.toString();
  }

  public get simSpeed():number {
    return this._simSpeed;
  }

  public set simSpeed(v:number) {
    this._simSpeed = v;
    let input: HTMLSelectElement = document.getElementById('sim-speed') as HTMLSelectElement;
    input.value = v.toString();
  }

  public get dummyUnits():number {
    return this._dummyUnits;
  }

  public set dummyUnits(v:number) {
    this._dummyUnits = v;
    let input: HTMLSelectElement = document.getElementById('units-dummy') as HTMLSelectElement;
    input.value = v.toString();
  }

  public get trainingUnits():number {
    return this._trainingUnits;
  }

  public set trainingUnits(v:number) {
    this._trainingUnits = v;
    let input: HTMLSelectElement = document.getElementById('units-training') as HTMLSelectElement;
    input.value = v.toString();
  }

  public get mutation():number {
    return this._mutation;
  }

  public set mutation(v:number) {
    this._mutation = v;
    let input: HTMLSelectElement = document.getElementById('mutation') as HTMLSelectElement;
    input.value = v.toString();
  }

  public get dummyType():string {
    return this._dummyType;
  }

  public set dummyType(v:string) {
    this._dummyType = v;
    let input: HTMLSelectElement = document.getElementById('dummy-type') as HTMLSelectElement;
    input.value = v;
  }

  public get renderer():string {
    return this._renderer;
  }

  public set renderer(v:string) {
    this._renderer = v;
    let input: HTMLSelectElement = document.getElementById('renderer') as HTMLSelectElement;
    input.value = v;
  }

  constructor(container: HTMLDivElement) {
    super(container, 'settings');

    this._saveButton = document.getElementById('save-button') as HTMLButtonElement;
    this._saveButton.onclick = ():void => this.save();

    document.getElementById('concurrency').onchange = (e:Event): void => {
      let input: HTMLSelectElement = e.target as HTMLSelectElement;
      this._concurrency = Number(input.value);
    }
    this.concurrency = this._concurrency;
    document.getElementById('sim-time').onchange = (e:Event): void => {
      let input: HTMLSelectElement = e.target as HTMLSelectElement;
      this._battleDuration = Number(input.value);
    }
    this.battleDuration = this._battleDuration;
    document.getElementById('sim-speed').onchange = (e:Event): void => {
      let input: HTMLSelectElement = e.target as HTMLSelectElement;
      this._simSpeed = Number(input.value);
    }
    this.simSpeed = this._simSpeed;
    document.getElementById('units-dummy').onchange = (e:Event): void => {
      let input: HTMLSelectElement = e.target as HTMLSelectElement;
      this._dummyUnits = Number(input.value);
    }
    this.dummyUnits = this._dummyUnits;
    document.getElementById('units-training').onchange = (e:Event): void => {
      let input: HTMLSelectElement = e.target as HTMLSelectElement;
      this._trainingUnits = Number(input.value);
    }
    this.trainingUnits = this._trainingUnits;

    document.getElementById('dummy-type').onchange = (e:Event): void => {
      let input: HTMLSelectElement = e.target as HTMLSelectElement;
      this._dummyType = input.value;
    }
    this.dummyType = this._dummyType;

    document.getElementById('renderer').onchange = (e:Event): void => {
      let input: HTMLSelectElement = e.target as HTMLSelectElement;
      this._renderer = input.value;
    }
    this.renderer = this._renderer;

    document.getElementById('mutation').onchange = (e:Event): void => {
      let input: HTMLSelectElement = e.target as HTMLSelectElement;
      this._mutation = Number(input.value);
    }
    this.mutation = this._mutation;
    this.load();
  }

  public onSave(callback: () => void):void {
    this._saveCallbacks.push(callback);
  }

  private load():void {
    let dataText: string = localStorage.getItem('nn-sim-settings');
    if(!dataText) {
      return;
    }
    let data: any = JSON.parse(dataText);
    if(data.concurrency !== undefined) {
      this.concurrency = data.concurrency;
    }
    if(data.battleDuration !== undefined) {
      this.battleDuration = data.battleDuration;
    }
    if(data.simSpeed !== undefined) {
      this.simSpeed = data.simSpeed;
    }
    if(data.dummyUnits !== undefined) {
      this.dummyUnits = data.dummyUnits;
    }
    if(data.trainingUnits !== undefined) {
      this.trainingUnits = data.trainingUnits;
    }
    if(data.dummyType !== undefined) {
      this.dummyType = data.dummyType;
    }
    if(data.renderer !== undefined) {
      this.renderer = data.renderer;
    }
    if(data.mutation !== undefined) {
      this.mutation = data.mutation;
    }
  }

  private save():void {
    this._saveCallbacks.forEach((c) => c());
    this.closePopup();

    let data:any = {
      concurrency: this._concurrency,
      battleDuration: this._battleDuration,
      simSpeed: this._simSpeed,
      dummyUnits: this._dummyUnits,
      trainingUnits: this._trainingUnits,
      dummyType: this.dummyType,
      renderer: this.renderer,
      mutation: this.mutation,
    }
    localStorage.setItem('nn-sim-settings', JSON.stringify(data));
  }

}
