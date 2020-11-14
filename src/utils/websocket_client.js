export default class WebSocketClient {
  constructor (options) {
    var defaults = {
      url: 'ws://localhost:6544',
      channels: {},
      name: ''
    }
    this.options = Object.assign(defaults, options)

    this.websocket = null

    this.init()
  }

  init () {
    if (this.options.url == null || this.options.url === 'null' || this.options.url === '') {
      const loc = window.location
      let newUri = 'ws:'
      if (loc.protocol === 'https:') {
        newUri = 'wss:'
      }
      newUri += '//' + loc.host
      newUri += this.options.url_postfix
      this.options.url = newUri
    }

    // generate websocket
    this.websocket = new WebSocket(this.options.url)

    // register dispatcher with websocket
    this.websocket.onmessage = (event) => {
      this.dispatch(JSON.parse(event.data))
    }

    this.websocket.onopen = () => {
      // subscribe to all channels specified in options
      Object.keys(this.options.channels).forEach((key) => {
        this.subscribe(key)
      })
    }

    this.websocket.onclose = (event) => {
      if (event.code === 3001 || event.type === 'close') {
        console.log('Websocket connection was closed: ' + this.options.name)
      } else {
        console.log('Websocket connection error: ' + this.options.name)
      }
    }

    this.websocket.onerror = () => {
      console.log('Error in websocket connection: ' + this.options.name)
    }
  }

  subscribe (channel) {
    console.log('Subscribing to websocket channel ' + channel + ': ' + this.options.name)
    this.websocket.send(JSON.stringify({ action: 'subscribe', channel: channel }))
  }

  dispatch (data) {
    var channel = data.channel
    var consumer = this.options.channels[channel]
    if (consumer) {
      consumer(data.message)
    }
  }

  close (code, reason) {
    this.websocket.close(code, reason)
  }
}
