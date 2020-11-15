<template>
  <div>
    <b-table
      :items="rows"
      :fields="fields"
      :tbody-tr-attr="row_attr"
      borderless
    >
      <template #cell(surfer)="data">
        {{ data.value.first_name }} <b>{{ data.value.last_name.toUpperCase() }}</b>
      </template>
    </b-table>
  </div>
</template>

<script>
import { lighten } from '../utils/lighten_darken_color'
import WebSocketClient from '../utils/websocket_client.js'

export default {
  props: {
    heatId: { type: Number, required: true },
    decimals: { type: Number, default: 2 },
    initialData: { type: Object, default: null },
    websocketUrl: { type: String, default: null }
  },
  data () {
    return {
      results: null,
      heat: null,
      participations: null,
      ws: null
    }
  },
  computed: {
    resultsUrl () {
      return `http://localhost:8081/rest/heats/${this.heatId}/results`
      // return https://www.surfjudge.de/rest/results/${this.heatId}`
    },
    heatUrl () {
      return `http://localhost:8081/rest/heats/${this.heatId}`
      // return `https://www.surfjudge.de/rest/heats/${this.heatId}`
    },
    participationsUrl () {
      return `http://localhost:8081/rest/heats/${this.heatId}/participations`
      // return `https://www.surfjudge.de/rest/participants/${this.heatId}`
    },
    fields () {
      if (this.results === null) return []
      if (this.participations === null) return []
      return [
        {
          key: 'lycra_color',
          label: '', // don't show header
          formatter: () => '', // don't show any text in cell
          tdAttr: (value, key, item) => { return { style: `background-color: ${value.hex};` } }, // lycra hex color as background
          tdClass: 'color_cell',
          thClass: 'color_header'
        },
        {
          key: 'place',
          label: '',
          formatter: (p) => `${p}.`,
          tdClass: 'place_cell',
          thClass: 'place_header'
        },
        {
          key: 'surfer',
          tdClass: 'surfer_cell',
          thClass: 'surfer_header'
        },
        {
          key: 'total_score',
          label: 'Score',
          formatter: (s) => this.round(s, this.roundDecimals).toFixed(this.roundDecimals),
          tdClass: 'total_score_cell',
          thClass: 'total_score_header'
        },
        ...[...Array(this.nWaves).keys()].map((v, i) => {
          return {
            key: `wave_${i}`,
            formatter: (s) => this.round(s.score, this.roundDecimals).toFixed(this.roundDecimals),
            label: `Wave ${i + 1}`,
            tdClass: (value, key, item) => value.best_wave ? 'best_wave wave_score_cell' : 'wave_score_cell',
            thClass: 'wave_score_header'
          }
        })
      ]
    },
    rows () {
      if (this.results === null) return []
      if (this.participations === null) return []

      const resultMap = new Map() // map surfer_id -> scores
      this.annotate_best_waves_standard(this.results).forEach((v, i) => {
        resultMap.set(v.surfer_id, v)
      })

      const res = this.participations.map((part, i) => {
        // add column data that are available for every participant
        const row = {
          lycra_color: part.lycra_color,
          surfer: part.surfer
        }

        if (resultMap.has(part.surfer_id)) {
          // add place and formatted total score to row
          const r = resultMap.get(part.surfer_id)
          Object.assign(row, {
            place: r.place + 1,
            total_score: r.total_score
          })

          // extract wave scores into row
          r.wave_scores.forEach((v, i) => {
            row[`wave_${v.wave}`] = v
          })
        } else {
          // place and score not available
          Object.assign(row, {
            place: '-',
            score: '-'
          })
        }
        return row
      })
      return res.sort((a, b) => (a.place === '-' ? a.seed : a.place) - (b.place === '-' ? b.seed : b.place))
    },
    nWaves () {
      // parse all wave scores and find maximum wave number
      const m = Math.max(0, ...this.results.map((res) =>
        Math.max(...res.wave_scores.map((v) => v.wave)
        )))
      return m
    },
    roundDecimals () {
      if (this.heat === null) return this.decimals
      if (this.heat.heat_type === 'call') return 0
      return this.decimals
    }
  },
  watch: {
    initialData (val) {
      if (val.heat) this.heat = val.heat
      if (val.results) this.results = val.results
      if (val.participations) this.participations = val.participations
    }
  },
  created () {
    if (this.initialData === null) {
      this.fetchResults()
      this.fetchParticipations()
      this.fetchHeat()
    } else {
      this.results = this.initialData.results || []
      this.heat = this.initialData.heat || {}
      this.participations = this.initialData.participations || []
    }

    if (this.websocketUrl) {
      this.ws = new WebSocketClient({
        url: this.websocketUrl,
        channels: {
          results: (jsonMsg) => {
            const msg = JSON.parse(jsonMsg)
            if (!('heat_id' in msg)) return
            const heatId = parseInt(msg.heat_id)
            if (this.heat.id === heatId) {
              this.fetchResults()
            }
          }
        },
        name: 'ResultsTable'
      })
    }
  },
  methods: {
    fetchResults () {
      return fetch(this.resultsUrl)
        .then(response => response.json())
        .then(data => { this.results = data })
    },
    fetchHeat () {
      return fetch(this.heatUrl)
        .then(response => response.json())
        .then(data => { this.heat = data })
    },
    fetchParticipations () {
      return fetch(this.participationsUrl)
        .then(response => response.json())
        .then(data => { this.participations = data })
    },
    round (number, decimals) {
      return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals)
    },
    row_attr (item, type) {
      return {
        style: `background-color:  ${lighten(item.lycra_color.hex)};`
      }
    },
    annotate_best_waves_standard (results) {
      const res = []
      results.forEach((surferResults) => {
        const s = Object.assign({}, surferResults)
        s.wave_scores = s.wave_scores.slice().sort((a, b) => b.score - a.score)
        if (s.wave_scores.length > 1) s.wave_scores[0].best_wave = true
        if (s.wave_scores.length > 2) s.wave_scores[1].best_wave = true
        res.push(s)
      })
      return res
    },
    annotate_best_waves_call (results) {
      // TODO
    }
  }
}
</script>

<style lang="stylus" scoped>
table >>> thead > tr
  font-weight bold
  font-size 1.5em
  font-align center
  background-color #CCCCCC

table >>> thead > tr > th.color_header
  background-color #FFFFFF

table >>> tr
  font-size 1.5em

table >>> td.best_wave
  font-weight bold
</style>
