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
import Socket from '../utils/Socket.js'

export default {
  props: {
    heatId: {
      type: Number,
      default: null
    },
    publicApiUrl: { type: String, default: '' },
    adminApiUrl: { type: String, default: '' }
  },
  data () {
    return {
      elems: [],
      heatState: null
    }
  },
  computed: {
    getHeatStateUrl () { return `${this.publicApiUrl}/heats/${this.heatId}/state` },
    startHeatUrl () { return `${this.adminApiUrl}/heats/${this.heatId}/start` },
    stopHeatUrl () { return `${this.adminApiUrl}/heats/${this.heatId}/stop` },
    togglePauseHeatUrl () { return `${this.adminApiUrl}/heats/${this.heatId}/toggle_pause` },
    resetHeatTimeUrl () { return `${this.adminApiUrl}/heats/${this.heatId}/reset_heat_time` },
    active () { return this.heatState === null ? false : this.heatState.state === 'active' },
    paused () { return this.heatState === null ? false : this.heatState.state === 'paused' },
    inactive () { return this.heatState === null ? true : this.heatState.state === 'inactive' }
  },
  watch: {
    heatId () {
      this.refresh()
    }
  },
  created () {
    this.initWebSocket()
    this.refresh()
  },
  beforeDestroy () {
    this.deinitWebSocket()
  },
  methods: {
    initWebSocket () {
      Socket.$on('active-heats', this.onActiveHeats)
    },
    deinitWebSocket () {
      Socket.$off('active-heats', this.onActiveHeats)
    },
    onActiveHeats (msg) {
      if (!('heat_id' in msg)) return
      const heatId = parseInt(msg.heat_id)
      if (this.heatId === heatId) {
        this.refresh()
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
