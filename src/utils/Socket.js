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
          const msg = JSON.parse(jsonMsg)

          if (msg.channel === channel) {
            this.$emit(
              channel.replace('_', '-'),
              JSON.parse(msg.message)
            )
          }
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
