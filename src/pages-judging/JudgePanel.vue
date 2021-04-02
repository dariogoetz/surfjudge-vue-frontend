<template>
  <div>
    <b-container v-if="active">
      Waiting
    </b-container>
    <div v-else>
      It is on!
      {{ scoresData }}
      <br>
      {{ heatData }}
    </div>
  </div>
</template>

<script>
import Socket from '../utils/Socket.js'

export default {
  props: {
    authenticated: { type: Object, default: null },
    tournament: { type: Object, default: null },
    publicApiUrl: { type: String, default: '' },
    judgingApiUrl: { type: String, default: '' }
  },
  data () {
    return {
      activeHeats: [],
      heatData: null,
      scoresData: null
    }
  },
  computed: {
    activeAssignementsUrl () { return `${this.judgingApiUrl}/active_judge_assignments` },
    active () { return this.activeHeats.length === 0 }
  },
  created () {
    this.initWebSocket()
    this.refreshActiveAssignments()
  },
  beforeDestroy () {
    this.deinitWebSocket()
  },
  methods: {
    heatsUrl (heatId) { return `${this.publicApiUrl}/heats/${heatId}` },
    scoresUrl (heatId) { return `${this.judgingApiUrl}/heats/${heatId}/judges/${this.authenticated.id}/scores` },
    initWebSocket () {
      Socket.$on('active-heats', this.refreshActiveAssignments)
      Socket.$on('scores', this.refreshScores)
      Socket.$on('heats', this.refreshHeat)
    },
    deinitWebSocket () {
      Socket.$off('active-heats', this.refreshActiveAssignments)
      Socket.$off('scores', this.refreshScores)
      Socket.$off('heats', this.refreshHeat)
    },
    refreshActiveAssignments () {
      fetch(this.activeAssignementsUrl, {
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => response.json())
        .then(data => {
          this.activeHeats = data
          this.refreshHeat()
          this.refreshScores()
        })
    },
    refreshHeat () {
      if (this.activeHeats.length !== 1) {
        if (this.activeHeats.length > 1) console.error('More than one heat active for me.')
        this.heatData = null
        this.scores = null
        return
      }

      const heatId = this.activeHeats[0].id
      fetch(this.heatsUrl(heatId), {
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => response.json())
        .then(data => {
          this.heatData = data
        })
    },
    refreshScores () {
      if (this.activeHeats.length !== 1) {
        if (this.activeHeats.length > 1) console.error('More than one heat active for me.')
        this.heatData = null
        this.scores = null
        return
      }

      const heatId = this.activeHeats[0].id
      fetch(this.scoresUrl(heatId), {
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => response.json())
        .then(data => {
          this.scoresData = data
        })
    }
  }
}
</script>
