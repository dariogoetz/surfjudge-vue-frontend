<template>
  <div>
    <b-table :items="rows" />
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
      results: [],
      heat: {},
      participations: []
    }
  },
  computed: {
    rows () {
      // TODO: use participations
      const resultMap = new Map() // surfer_id -> scores
      this.results.forEach((v, i) => {
        resultMap.set(v.surfer_id, v)
      })
      const res = []
      this.participations.forEach((part, i) => {
        const row = {
          lycra_color: part.lycra_color.name,
          surfer: part.surfer.first_name + ' ' + part.surfer.last_name
        }
        if (resultMap.has(part.surfer_id)) {
          const r = resultMap.get(part.surfer_id)
          Object.assign(row, {
            place: r.place,
            score: this.round(r.total_score, this.decimals).toFixed(this.decimals)
          })
          r.wave_scores
            .slice()
            .sort((a, b) => a.wave - b.wave)
            .forEach((v, i) => {
              row['wave_' + (v.wave + 1)] = this.round(v.score, this.decimals).toFixed(this.decimals)
            })
        } else {
          Object.assign(row, {
            place: '-',
            score: '-'
          })
        }
        res.push(row)
      })

      return res
    }
  },
  created () {
    this.fetch_results()
    this.fetch_heat()
    this.fetch_participations()
  },
  methods: {
    fetch_results () {
      if (this.resultsUrl === null) {
        return
      }
      fetch(this.resultsUrl)
        .then(response => response.json())
        .then(data => { this.results = data })
    },
    fetch_heat () {
      if (this.heatUrl === null) {
        return
      }
      fetch(this.heatUrl)
        .then(response => response.json())
        .then(data => { this.heat = data })
    },
    fetch_participations () {
      if (this.participationsUrl === null) {
        return
      }
      fetch(this.participationsUrl)
        .then(response => response.json())
        .then(data => { this.participations = data.sort((a, b) => b.seed - a.seed) })
    },
    round (number, decimals) {
      return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals)
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
