import Vue from 'vue'
import WebSocketClient from '../utils/websocket_client.js'

const emitter = new Vue({
  data () {
    return {
      socket: null
    }
  },
  methods: {
    init (websocketUrl) {
      const channelNames = ['active_heats', 'results', 'participants', 'advancements', 'heats', 'scores', 'judging_requests']

      const channels = {}
      channelNames.forEach(channel => {
        channels[channel] = (jsonMsg) => {
          this.$emit(
            channel.replace('_', '-'),
            JSON.parse(jsonMsg)
          )
        }
      })
      this.socket = new WebSocketClient({
        url: websocketUrl,
        channels: channels,
        name: 'App'
      })
    }
  }
})

export default emitter
