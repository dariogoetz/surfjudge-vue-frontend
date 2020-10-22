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

export default {
  props: {
    resultsUrl: {
      type: String,
      default: null
    },
    heatUrl: {
      type: String,
      default: null
    },
    participationsUrl: {
      type: String,
      default: null
    },
    decimals: {
      type: Number,
      default: 1
    }
  },
  data () {
    return {
      results: null,
      heat: null,
      participations: null
    }
  },
  computed: {
    fields () {
      if (this.results === null) return []
      if (this.participations === null) return []
      return [
        {
          key: 'lycra_color',
          label: '', // don't show header
          formatter: () => '', // don't show any text in cell
          tdAttr: (value, key, item) => { return { style: `background-color: ${value.hex};` } } // lycra hex color as background
        },
        {
          key: 'place',
          label: '',
          formatter: (p) => `${p}.`
        },
        {
          key: 'surfer'
        },
        {
          key: 'total_score',
          label: 'Score',
          formatter: (s) => this.round(s, this.roundDecimals).toFixed(this.roundDecimals)
        },
        ...[...Array(this.nWaves).keys()].map((v, i) => {
          return {
            key: `wave_${i}`,
            formatter: (s) => this.round(s.score, this.roundDecimals).toFixed(this.roundDecimals),
            label: `Wave ${i + 1}`
          }
        })
      ]
    },
    rows () {
      if (this.results === null) return []
      if (this.participations === null) return []
      const resultMap = new Map() // map surfer_id -> scores
      this.results.forEach((v, i) => {
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
      return Math.max(...this.results.map((res) =>
        Math.max(...res.wave_scores.map((v) => v.wave)
        )))
    },
    roundDecimals () {
      if (this.heat === null) return this.decimals
      if (this.heat.heat_type === 'call') return 0
      return this.decimals
    }
  },
  created () {
    this.fetch_results()
    this.fetch_heat()
    this.fetch_participations()
  },
  methods: {
    fetch_results () {
      if (this.resultsUrl === null) return
      fetch(this.resultsUrl)
        .then(response => response.json())
        .then(data => { this.results = data })
    },
    fetch_heat () {
      if (this.heatUrl === null) return
      fetch(this.heatUrl)
        .then(response => response.json())
        .then(data => { this.heat = data })
    },
    fetch_participations () {
      if (this.participationsUrl === null) return
      fetch(this.participationsUrl)
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
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
