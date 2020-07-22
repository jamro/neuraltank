export default class Settings {

  private _settingsButton: HTMLButtonElement;
  private _saveButton: HTMLButtonElement;
  private _domContainer: HTMLDivElement;
  private _popupContainer: HTMLDivElement;
  private _concurrency: number = 3;
  private _simSpeed: number = 2;
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

  constructor(container: HTMLDivElement) {
    this._domContainer = container;

    this._settingsButton = document.createElement('button') as HTMLButtonElement;
    this._settingsButton.classList.add('settings');
    this._settingsButton.innerText = "Settings";
    this._domContainer.appendChild(this._settingsButton);
    this._settingsButton.onclick = ():void => this.showPopup();

    this._popupContainer = document.getElementById('popup') as HTMLDivElement;
    this._domContainer.appendChild(this._popupContainer);
    this.closePopup();

    document.getElementById('close-button').onclick = () => this.closePopup();
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
    this.load();
  }

  public onSave(callback: () => void):void {
    this._saveCallbacks.push(callback);
  }

  public showPopup():void {
    this._popupContainer.style.display = 'block';
  }

  public closePopup():void {
    this._popupContainer.style.display = 'none';
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
  }

  private save():void {
    this._saveCallbacks.forEach((c) => c());
    this.closePopup();

    let data:any = {
      concurrency: this._concurrency,
      battleDuration: this._battleDuration,
      simSpeed: this._simSpeed,
    }
    localStorage.setItem('nn-sim-settings', JSON.stringify(data));
  }

}
