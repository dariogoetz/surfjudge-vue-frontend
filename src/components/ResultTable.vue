<template>
  <div>
    <b-table
      :items="rows"
      :fields="fields"
      :tbody-tr-attr="row_attr"
      borderless
    >
      <template #cell(surfer)="data">
        {{ data.value.first_name }} <br v-if="lastNameOnNewline"><b>{{ data.value.last_name.toUpperCase() }}</b>
      </template>
    </b-table>
  </div>
</template>

<script>
import { lighten } from '../utils/lighten_darken_color'
import Socket from '../utils/Socket'
import round from '../utils/round_decimals'
import { mapGetters } from 'vuex'

export default {
  props: {
    heatId: { type: Number, required: true },
    decimals: { type: Number, default: 2 },
    showNeeds: { type: Boolean, default: true },
    showNeedsSecond: { type: Boolean, default: true },
    lastNameOnNewline: { type: Boolean, default: true },
    initialData: { type: Object, default: null },
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
    needsVisible () {
      return (this.showNeeds && this.heat_type !== 'call') || false
    },
    resultsUrl () {
      return `${this.publicApiUrl}/heats/${this.heatId}/results`
    },
    heatUrl () {
      return `${this.publicApiUrl}/heats/${this.heatId}`
    },
    participationsUrl () {
      return `${this.publicApiUrl}/heats/${this.heatId}/participations`
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
          formatter: (p) => p === null ? '-' : `${p}.`,
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
          formatter: (s) => s === null ? '-' : round(s, this.roundDecimals).toFixed(this.roundDecimals),
          tdClass: 'total_score_cell',
          thClass: 'total_score_header'
        },
        ...(this.needsVisible ? [{
          key: 'needs',
          label: this.showNeedsSecond ? 'Needs 1./2.' : 'Needs',
          formatter: (needs) => {
            let res = `${needs[0] > 0 ? needs[0].toFixed(this.roundDecimals) : '-'}`
            if (this.showNeedsSecond) {
              res += ` / ${needs[1] > 0 ? needs[1].toFixed(this.roundDecimals) : '-'}`
            }
            return res
          },
          tdClass: 'needs_cell',
          thClass: 'needs_header'
        }] : []),
        ...[...Array(this.nWaves).keys()].map((v, i) => {
          return {
            key: `wave_${i}`,
            formatter: (s) => s ? round(s.score, this.roundDecimals).toFixed(this.roundDecimals) : '',
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
      if (this.heat === null) return []

      const resultMap = new Map() // map surfer_id -> scores
      if (this.heat.heat_type === 'call') {
        this.annotate_best_waves_call(this.results).forEach((v, i) => {
          resultMap.set(v.surfer_id, v)
        })
      } else {
        this.annotate_best_waves_standard(this.results).forEach((v, i) => {
          resultMap.set(v.surfer_id, v)
        })
      }

      const res = this.participations.map((part, i) => {
        // add column data that are available for every participant
        const row = {
          lycra_color: part.lycra_color,
          surfer: part.surfer
        }

        if (this.needsVisible) {
          Object.assign(row, {
            needs: this.needs.get(part.surfer_id) || []
          })
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
            place: null,
            score: null
          })
        }
        return row
      })
      return res.sort((a, b) => (a.place === '-' ? a.seed : a.place) - (b.place === '-' ? b.seed : b.place))
    },
    nWaves () {
      // parse all wave scores and find maximum wave number
      if (this.results.length === 0) return 0
      const m = Math.max(0, ...this.results.map((res) =>
        Math.max(...res.wave_scores.map((v) => v.wave)
        )))
      return m + 1
    },
    roundDecimals () {
      if (this.heat === null) return this.decimals
      if (this.heat.heat_type === 'call') return 0
      return this.decimals
    },
    needs () {
      const sortedTotalScores = this.results.map((result) => {
        return parseFloat(result.total_score)
      }).sort((a, b) => b - a)

      // initialize needs with target_total_score
      // also for participants, that do not appear in this.results, yet
      const needs = new Map()
      this.results.forEach((result) => {
        const waveScores = result.wave_scores.concat() || []

        // sort waves for surfer by score
        const sortedWS = waveScores.sort((a, b) => b.score - a.score)

        // get best wave of surfer
        const bw = sortedWS[0] || { score: 0, wave: -1 }
        const surferNeeds = sortedTotalScores.map((targetScore) => {
          if (result.total_score >= targetScore) {
            return -1
          } else {
            return round(targetScore - bw.score, this.roundDecimals)
          }
        })
        needs.set(result.surfer_id, surferNeeds)
      })
      return needs
    },
    ...mapGetters(['publicApiUrl'])
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
    this.initWebSocket()
  },
  beforeDestroy () {
    this.deinitWebSocket()
  },
  methods: {
    initWebSocket () {
      Socket.$on('results', this.onResults)
      Socket.$on('participants', this.onParticipants)
      Socket.$on('heats', this.onHeats)
    },
    deinitWebSocket () {
      Socket.$off('results', this.onResults)
      Socket.$off('participants', this.onParticipants)
      Socket.$off('heats', this.onHeats)
    },
    onResults (msg) {
      if (!('heat_id' in msg)) return
      const heatId = parseInt(msg.heat_id)
      if (this.heat.id === heatId) {
        this.fetchResults()
      }
    },
    onParticipants (msg) {
      if (!('heat_id' in msg)) return
      const heatId = parseInt(msg.heat_id)
      if (this.heat.id === heatId) {
        this.fetchParticipations()
      }
    },
    onHeats (msg) {
      if (!('heat_id' in msg)) return
      const heatId = parseInt(msg.heat_id)
      if (this.heat.id === heatId) {
        this.fetchHeat()
      }
    },
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
    row_attr (item, type) {
      return {
        style: `background-color:  ${lighten(item.lycra_color.hex)};`
      }
    },
    annotate_best_waves_standard (results) {
      // annotate best two scores by surfer in place
      results.forEach((surferResults) => {
        const s = Object.assign({}, surferResults)
        s.wave_scores = s.wave_scores.slice().sort((a, b) => b.score - a.score)
        if (s.wave_scores.length > 1) s.wave_scores[0].best_wave = true
        if (s.wave_scores.length > 2) s.wave_scores[1].best_wave = true
      })
      return results
    },
    annotate_best_waves_call (results) {
      const scoresByWave = new Map()
      // group scores by wave
      results.forEach((surferResults) => {
        surferResults.wave_scores.forEach((score) => {
          if (!scoresByWave.has(score.wave)) {
            scoresByWave.set(score.wave, [])
          }
          scoresByWave.get(score.wave).push(score)
        })
      })
      // for each wave, determine best score and annotate in place
      scoresByWave.forEach((scores, wave) => {
        const m = Math.max(...scores.map((s) => s.score))
        scores.forEach((s) => {
          if (s.score === m) s.best_wave = true
        })
      })
      return results
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
  text-align center

table >>> thead > tr > th.color_header
  background-color #FFFFFF

table >>> thead > tr > th.surfer_header
  text-align left

table >>> tr
  font-size 1.5em
  text-align center

table >>> tr > td
  vertical-align middle

table >>> tr > td.place_cell
  background-color rgba(0, 0, 0, 0.1)

table >>> tr > td.surfer_cell
  text-align left
  background-color rgba(0, 0, 0, 0.1)

table >>> tr > td.needs_cell
  text-align center
  background-color rgba(0, 0, 0, 0.1)

table >>> tr > td.total_score_cell
  font-weight bold

table >>> td.best_wave
  font-weight bold
</style>
