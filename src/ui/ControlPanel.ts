export default class ControlPanel {

  private _container:HTMLDivElement;
  private _buttons: Map<string,HTMLButtonElement>;

  public get container():HTMLDivElement {
    return this._container;
  }

  constructor() {
    this._buttons = new Map<string,HTMLButtonElement>();
    this._container = document.createElement('div') as HTMLDivElement;
    this._container.classList.add('controls');
  }

  public createButton(id: string, label: string): HTMLButtonElement {
    if(this._buttons.has(id)) {
      throw new Error(`Button '${id}' already exists`);
    }
    let button: HTMLButtonElement;
    button = document.createElement('button') as HTMLButtonElement;
    button.innerText = label;
    this.container.appendChild(button);
    this._buttons.set(id, button);
    return button;
  }

  public getButton(id: string): HTMLButtonElement {
    if(!this._buttons.has(id)) {
      throw new Error(`Button '${id}' does not exist`);
    }
    return this._buttons.get(id);
  }

}
