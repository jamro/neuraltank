import ControlPanel from "./ControlPanel";

export default class SimControl extends ControlPanel {

  private _preview: HTMLButtonElement;
  private _settings: HTMLButtonElement;

  public get preview(): HTMLButtonElement {
    return this._preview;
  }

  public get settings(): HTMLButtonElement {
    return this._settings;
  }

  constructor() {
    super();

    this._preview = this.createButton('preview', 'Preview');
    this._settings = this.createButton('settings', 'Settings');

  }

}
