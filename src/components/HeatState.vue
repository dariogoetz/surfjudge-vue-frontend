<template>
  <div>
    <b-button-group>
      <b-button v-if="inactive" @click="start_heat" variant="success" ><b-icon-play /></b-button>

      <b-button v-if="active || paused" @click="stop_heat" variant="danger" ><b-icon-stop /></b-button>
      <b-button v-if="active" @click="toggle_pause_heat" ><b-icon-pause /></b-button>
      <b-button v-if="paused" @click="toggle_pause_heat" variant="success"><b-icon-play /></b-button>
      <b-button v-if="active || paused" @click="reset_heat_time" variant="outline-secondary" ><b-icon-arrow-clockwise /></b-button>
    </b-button-group>
  </div>
</template>

<script>
import WebSocketClient from '../utils/websocket_client.js'

export default {
  props: {
    heatId: {
      type: Number,
      default: null
    },
    apiUrl: { type: String, default: '' },
    websocketUrl: { type: String, default: null }
  },
  data () {
    return {
      elems: [],
      heatState: null
    }
  },
  computed: {
    getHeatStateUrl: function () { return `${this.apiUrl}/heats/${this.heatId}/state` },
    startHeatUrl: function () { return `${this.apiUrl}/heats/${this.heatId}/start` },
    stopHeatUrl: function () { return `${this.apiUrl}/heats/${this.heatId}/stop` },
    togglePauseHeatUrl: function () { return `${this.apiUrl}/heats/${this.heatId}/toggle_pause` },
    resetHeatTimeUrl: function () { return `${this.apiUrl}/heats/${this.heatId}/reset_heat_time` },
    active: function () { return this.heatState === null ? false : this.heatState.state === 'active' },
    paused: function () { return this.heatState === null ? false : this.heatState.state === 'paused' },
    inactive: function () { return this.heatState === null ? true : this.heatState.state === 'inactive' }
  },
  watch: {
    heatId () {
      this.refresh()
    },
    websocketUrl () {
      this.initWebSocket()
    }
  },
  created () {
    this.initWebSocket()
    this.refresh()
  },
  methods: {
    initWebSocket () {
      if (this.websocketUrl) {
        this.ws = new WebSocketClient({
          url: this.websocketUrl,
          channels: {
            active_heats: (jsonMsg) => {
              const msg = JSON.parse(jsonMsg)
              if (!('heat_id' in msg)) return
              const heatId = parseInt(msg.heat_id)
              if (this.heatId === heatId) {
                this.refresh()
              }
            }
          },
          name: 'HeatState'
        })
      }
    },
    refresh () {
      if (this.heatId === null) {
        return
      }
      fetch(this.getHeatStateUrl)
        .then(response => response.json())
        .then(data => {
          this.heatState = data
        })
    },
    start_heat () {
      fetch(this.startHeatUrl, {
        method: 'POST',
        credentials: 'include' // for CORS in dev setup
      })
        .then(res => this.refresh())
    },
    stop_heat () {
      fetch(this.stopHeatUrl, {
        method: 'POST',
        credentials: 'include' // for CORS in dev setup
      })
        .then(res => this.refresh())
    },
    toggle_pause_heat () {
      fetch(this.togglePauseHeatUrl, {
        method: 'POST',
        credentials: 'include' // for CORS in dev setup
      })
        .then(res => this.refresh())
    },
    reset_heat_time () {
      fetch(this.resetHeatTimeUrl, {
        method: 'POST',
        credentials: 'include' // for CORS in dev setup
      })
        .then(res => this.refresh())
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
