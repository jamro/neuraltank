export class LocalStorageClient {

  constructor(messageBus) {
    this.messageBus = messageBus
  }

  async getItem(key) {
    const data = await this.messageBus.request('localStorage.getItem', {key})
    console.log(`localStorage.getItem(${key})=${data.value}`)
    return data.value
  }

  async setItem(key, value) {
    this.messageBus.postMessage({action: 'localStorage.setItem', key, value })
  }

  async removeItem(key) {
    this.messageBus.postMessage({action: 'localStorage.removeItem', key })
  }

}

export class LocalStorageServer {

  constructor(messageBus) {
    this.messageBus = messageBus

    this.messageBus.addEventListener('localStorage.getItem', (e) => this.handleGetItem(e.data))
    this.messageBus.addEventListener('localStorage.setItem', (e) => this.handleSetItem(e.data))
    this.messageBus.addEventListener('localStorage.removeItem', (e) => this.handleRemoveItem(e.data))
  }

  handleGetItem({key, ref, callbackId}) {
    const value = localStorage.getItem(key)

    this.messageBus.response(callbackId, {value})
  }

  handleSetItem({key, value}) {
    localStorage.setItem(key, value)
  }

  handleRemoveItem({key}) {
    localStorage.removeItem(key)
  }

}