import ControlPanel from "./ControlPanel";

export default class SimControl extends ControlPanel {

  private _preview: HTMLButtonElement;
  private _settings: HTMLButtonElement;
  private _export: HTMLButtonElement;
  private _import: HTMLButtonElement;
  private _clear: HTMLButtonElement;

  public get preview(): HTMLButtonElement {
    return this._preview;
  }

  public get settings(): HTMLButtonElement {
    return this._settings;
  }

  public get export(): HTMLButtonElement {
    return this._export;
  }

  public get import(): HTMLButtonElement {
    return this._import;
  }

  public get clear(): HTMLButtonElement {
    return this._clear;
  }

  constructor() {
    super();

    this._preview = this.createButton('preview', 'Preview');
    this._export = this.createButton('export', 'Export');
    this._import = this.createButton('import', 'Import');
    this._clear = this.createButton('clear', 'Clear');
    this._settings = this.createButton('settings', 'Settings');

  }

}
