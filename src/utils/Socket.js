import Vue from 'vue'
import WebSocketClient from '../utils/websocket_client.js'

const emitter = new Vue({})

const channelNames = ['active_heats', 'results', 'participants']

const channels = {}
channelNames.forEach(channel => {
  channels[channel] = (jsonMsg) => {
    const msg = JSON.parse(jsonMsg)
    emitter.$emit(channel.replace('_', '-'), msg)
  }
})

const socket = new WebSocketClient({
  url: this.websocketUrl,
  channels: channels,
  name: 'App'
})

export default emitter
