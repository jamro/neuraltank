import Popup from "./Popup";

export default class ImportPopup extends Popup {

    private _fileSelector:HTMLInputElement;
    private _loadCallbacks: ((json:any) => void)[] = [];

    constructor(container: HTMLDivElement) {
      super(container, 'import');

      this._fileSelector = this.popupContainer.querySelector('#import-file') as HTMLInputElement;
      this._fileSelector.addEventListener('change', (event:Event) => {
        const fileList:FileList = (event.target as HTMLInputElement).files;

        const reader:FileReader = new FileReader();
        reader.addEventListener('load', (event:Event):void => {
          try {
            this.onFileLoad(event);
          } catch(err) {
            this.closePopup();
            alert(err.toString());
          }
        });
        this._fileSelector.style.display = 'none';
        reader.readAsText(fileList[0]);
      });
    }

    private onFileLoad(event:Event):void {
      const data:string = (event.target as FileReader).result as string;
      const json:any = JSON.parse(data);
      this._loadCallbacks.forEach((c) => c(json));
      this.closePopup();
    }

    showPopup():void {
      this._fileSelector.style.display = 'inline';
      this._fileSelector.value = null;
      super.showPopup();
    }

    public onLoad(callback: (json:any) => void):void {
      this._loadCallbacks.push(callback);
    }

}
