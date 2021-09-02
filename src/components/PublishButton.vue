<template>
  <div>
      <b-button-group>
        <b-button @click="publish" :disabled="!hasUnpublishedData" variant="secondary" >{{ buttonText }}</b-button>
        <b-button @click="unpublish" :disabled="!hasResultsData" variant="danger" ><b-icon-x-circle-fill /></b-button>
      </b-button-group>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Socket from '../utils/Socket.js'

export default {
  props: {
    heatId: {
      type: Number,
      default: null
    }
  },
  data () {
    return {
      preliminaryResults: [],
      results: []
    }
  },
  computed: {
    getPreliminaryResultsUrl () { return `${this.adminApiUrl}/heats/${this.heatId}/preliminary_results` },
    getResultsUrl () { return `${this.publicApiUrl}/heats/${this.heatId}/results` },
    hasResultsData () { return this.results.length > 0 },
    hasUnpublishedData () {
      let hasUnpublished = false
      this.preliminaryResults.forEach(v => {
        if (!v.published) hasUnpublished = true
        v.wave_scores.forEach(s => {
          if (!s.published) hasUnpublished = true
        })
      })
      return hasUnpublished
    },
    buttonText () {
      if (this.hasResultsData) return 'Re-Publish'
      return 'Publish'
    },
    ...mapGetters(['publicApiUrl', 'adminApiUrl'])
  },
  watch: {
    heatId () {
      this.refreshResults()
      this.refreshPreliminaryResults()
    }
  },
  created () {
    this.initWebSocket()
    this.refreshResults()
    this.refreshPreliminaryResults()
  },
  beforeDestroy () {
    this.deinitWebSocket()
  },
  methods: {
    initWebSocket () {
      Socket.$on('results', this.onResults)
      Socket.$on('scores', this.onScores)
    },
    deinitWebSocket () {
      Socket.$off('results', this.onResults)
      Socket.$off('scores', this.onScores)
    },
    onScores (msg) {
      if (!('heat_id' in msg)) return
      const heatId = parseInt(msg.heat_id)
      if (this.heatId === heatId) {
        this.refreshPreliminaryResults()
      }
    },
    onResults (msg) {
      if (!('heat_id' in msg)) return
      const heatId = parseInt(msg.heat_id)
      if (this.heatId === heatId) {
        this.refreshResults()
      }
    },
    refreshResults () {
      if (this.heatId === null) {
        return
      }
      fetch(this.getResultsUrl)
        .then(response => response.json())
        .then(data => {
          this.results = data
        })
    },
    refreshPreliminaryResults () {
      if (this.heatId === null) {
        return
      }
      fetch(this.getPreliminaryResultsUrl, {
        'credentials': 'include'
      })
        .then(response => response.json())
        .then(data => {
          this.preliminaryResults = data
        })
    },
    publish () {
      console.log(`publish ${this.heatId}`)
    },
    unpublish () {
      console.log(`unpublish ${this.heatId}`)
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
