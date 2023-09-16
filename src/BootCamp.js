export default class BootCamp {
  constructor() {
    this._inProgress = false
    this.load()
  }

  get inProgress() {
    return this._inProgress
  }

  set inProgress(v) {
    this._inProgress = v
    this.save()
  }

  load() {
    const raw = localStorage.getItem('bootCamp') 
    if(raw) {
      const json = JSON.parse(raw)
      this._inProgress = json.inProgress
    }
  }

  save() {
    localStorage.setItem('bootCamp', JSON.stringify({
      inProgress: this._inProgress
    })) 
  }


}