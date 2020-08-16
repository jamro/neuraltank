export default class Popup {

  private _domContainer: HTMLDivElement;
  private _popupContainer: HTMLDivElement;

  protected get domContainer():HTMLDivElement {
    return this._domContainer;
  }

  protected get popupContainer():HTMLDivElement {
    return this._popupContainer;
  }

  constructor(container: HTMLDivElement, popupId:string) {
    this._domContainer = container;
    this._popupContainer = document.getElementById(popupId) as HTMLDivElement;
    this._domContainer.appendChild(this._popupContainer);
    this.closePopup();

    let closeButtons:HTMLCollectionOf<Element> = this._popupContainer.getElementsByClassName('close-button');
    for(let i:number=0; i < closeButtons.length; i++) {
      (closeButtons[i] as HTMLElement).onclick = () => this.closePopup();
    }
  }

  public showPopup():void {
    this._popupContainer.style.display = 'block';
  }

  public closePopup():void {
    this._popupContainer.style.display = 'none';
  }

}
