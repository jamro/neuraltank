export default class MessageBus extends EventTarget{

  constructor(context) {
    super()
    this.postMessage = (...args) => {
      //console.log("[worker message]", ...args)
      context.postMessage(...args)
    }
    context.onmessage = (e) => this.dispatchEvent(new MessageBusEvent(e.data.action, e.data))
  }

  async request(action, data={}) {
    const callbackId = 'callback-' + Math.round(Math.random()*0xffffffff).toString(16)

    return await new Promise(done => {
      this.addEventListener(callbackId, (response) => {
        done(response.data)
      })
      this.postMessage({...data, action, callbackId})
    })
  }

  response(callbackId, data={}) {
    this.send(callbackId, data)
  }

  send(action, data={}) {
    this.postMessage({ ...data, action })
  }

}


class MessageBusEvent extends Event {
  constructor(type, data) {
    super(type)
    this.data = data
  }

}