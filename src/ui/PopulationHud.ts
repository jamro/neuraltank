import Population from "../evolution/Population";
import SettingsPopup from "./SettingsPopup";
import SimControl from "./SimControl";
import ImportPopup from "./importPopup";

export default class PopulationHud {

  private _domContainer: HTMLDivElement;
  private _population: Population;
  private _canvas: HTMLCanvasElement;
  private _settings: SettingsPopup;
  private _import: ImportPopup;
  private _controls: SimControl;

  constructor(containerName: string, population: Population) {
    this._domContainer = document.getElementById(containerName) as HTMLDivElement;
    this._controls = new SimControl();

    this._canvas = document.createElement('canvas') as HTMLCanvasElement;
    this._canvas.width = 900;
    this._canvas.height = 600;
    this._domContainer.appendChild(this._canvas);

    this._domContainer.appendChild(this._controls.container);

    this._controls.preview.onclick = ():void => {
      window.location.replace('/#preview');
      window.location.reload();
    };

    this._settings = new SettingsPopup(this._domContainer);
    this._import = new ImportPopup(this._domContainer);
    this._controls.settings.onclick = ():void => this._settings.showPopup();
    this._controls.import.onclick = ():void => this._import.showPopup();

    this._controls.export.onclick = ():void => this.export();

    this._population = population;

    setInterval(() => {
      this.refresh();
    }, 50);
  }

  public get settingsPopup():SettingsPopup {
    return this._settings;
  }

  public get importPopup():ImportPopup {
    return this._import;
  }

  public export():void {
    let element: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(this._population.toJSON())));
    element.setAttribute('download', `neuraltank-gen${this._population.generation}-size${this._population.size}.json`);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  public import():void {

  }

  public refresh() {
    let completed:number = 0;
    let inProgress:number = 0;
    let i:number;
    for(i=0; i<this._population.size; i++) {
      if(this._population.units[i].completed) {
        completed++;
      } else if(this._population.units[i].inProgress) {
        inProgress++;
      }
    }

    var ctx:CanvasRenderingContext2D = this._canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 900, 600);
    ctx.fillStyle = "#0f0";
    ctx.font = "24px Courier";
    ctx.fillText(`Population progress: ${(100*completed/this._population.units.length).toFixed(1)}% (${completed}/${this._population.units.length})`, 10, 30);

    let completedWidth:number = Math.round(860*completed/this._population.units.length);
    let inProgressWidth:number = Math.round(860*inProgress/this._population.units.length);
    let restWidth:number = 860 - completedWidth - inProgressWidth;

    ctx.fillStyle = "#0f0";
    ctx.fillRect(20, 60, completedWidth, 20);

    ctx.fillStyle = "#0a0";
    ctx.fillRect(20+completedWidth, 60, inProgressWidth, 20);
    ctx.fillStyle = "#030";
    ctx.fillRect(20+completedWidth+inProgressWidth, 60, restWidth, 20);

    ctx.fillStyle = "#0f0";
    ctx.fillText(`Generation: ${this._population.generation}`, 10, 130);
    ctx.fillText(`Diversity: ${this._population.diversity}%`, 10, 180);
    ctx.fillText(`Scores: ${this._population.worstScore.toFixed(2)} - ${this._population.bestScore.toFixed(2)}`, 10, 330);
    let processRate:number = this._population.getUnitProcessingRate();
    ctx.fillText(`Processing Rate: ${processRate ? processRate.toFixed(2) : '???'} units / minute`, 10, 230);

    let topValue: number = this._population.scoreHistogram.reduce((max:number, val:number) => Math.max(max, val), 1);
    let barWidth: number = 860/this._population.scoreHistogram.length;
    let barHeights: number[] = this._population.scoreHistogram.map((v:number) => 120*v/topValue);
    ctx.fillStyle = "#0f0";
    for(i=0; i<this._population.scoreHistogram.length; i++) {
      ctx.fillRect(20+i*barWidth, 360+120- barHeights[i], barWidth-1, barHeights[i]);
    }

    this._controls.preview.style.display = this._population.bestGenome ? 'inline-block' : 'none';
  }

}
