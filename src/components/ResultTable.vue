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
const utils = require('../utils/lighten_darken_color')

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
        'score',
        ...[...Array(this.nWaves).keys()].map((v) => `wave_${v + 1}`)
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
          // add place and formatted total score to row array
          const r = resultMap.get(part.surfer_id)
          Object.assign(row, {
            place: r.place + 1,
            score: this.round(r.total_score, this.roundDecimals).toFixed(this.roundDecimals)
          })

          // sort wave scores, format and put to row array
          r.wave_scores
            .slice()
            .sort((a, b) => a.wave - b.wave)
            .forEach((v, i) => {
              row['wave_' + (v.wave + 1)] = this.round(v.score, this.roundDecimals).toFixed(this.roundDecimals)
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
        style: `background-color:  ${utils.lighten(item.lycra_color.hex)};`
      }
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
