<template>
  <div>
    <b-container v-if="active">
      Waiting
    </b-container>
    <div v-else>
      <b-table
        :items="rows"
        :fields="fields"
        :tbody-tr-attr="row_attr"
      />
      It is on!
      {{ scoresData }}
      <br>
      {{ heatData }}
      <br>
      {{ participationsData }}
    </div>
  </div>
</template>

<script>
import { lighten } from '../utils/lighten_darken_color'
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
      scoresData: null,
      participationsData: null
    }
  },
  computed: {
    activeAssignementsUrl () { return `${this.judgingApiUrl}/active_judge_assignments` },
    active () { return this.activeHeats.length === 0 },
    rows () {
      if (this.participationsData === null) return []
      const data = new Map()
      this.participationsData.forEach((part, i) => {
        const val = {
          lycraColor: part.lycra_color
        }
        data.set(part.surfer_id, val)
      })
      const scores = (this.scoresData || [])
      scores.forEach((score, i) => {
        const val = data.get(score.surfer_id)
        val[`wave_${score.wave}`] = score
      })
      const res = [...data.values()]
      res.sort((a, b) => a.seed - b.seed)
      return res
    },
    fields () {
      if (this.heatData === null) return []
      return [
        {
          key: 'lycraColor',
          formatter: (c) => c.name,
          tdAttr: (value, key, item) => { return { style: `background-color: ${value.hex};` } } // lycra hex color as background
        },
        ...[...Array(this.heatData.number_of_waves).keys()].map((v, i) => {
          return {
            key: `wave_${i}`,
            label: `Wave ${i + 1}`,
            formatter: (s) => {
              if (s.interference) return 'I'
              if (s.missed) return 'M'
              return s.score
            }
          }
        })
      ]
    }
  },
  watch: {
    authenticated () {
      this.refreshActiveAssignments()
    }
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
    participationsUrl (heatId) { return `${this.publicApiUrl}/participations/${heatId}` },
    initWebSocket () {
      Socket.$on('active-heats', this.refreshActiveAssignments)
      Socket.$on('scores', this.refreshScores)
      Socket.$on('heats', this.refreshHeat)
      Socket.$on('participants', this.refreshParticipations)
    },
    deinitWebSocket () {
      Socket.$off('active-heats', this.refreshActiveAssignments)
      Socket.$off('scores', this.refreshScores)
      Socket.$off('heats', this.refreshHeat)
      Socket.$off('participants', this.refreshParticipations)
    },
    refreshActiveAssignments () {
      fetch(this.activeAssignementsUrl, {
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => {
          if (!response.ok) {
            return []
          }
          return response.json()
        })
        .then(data => {
          this.activeHeats = data
          this.refreshHeat()
          this.refreshScores()
          this.refreshParticipations()
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
    },
    refreshParticipations () {
      if (this.activeHeats.length !== 1) {
        if (this.activeHeats.length > 1) console.error('More than one heat active for me.')
        this.heatData = null
        this.scores = null
        return
      }

      const heatId = this.activeHeats[0].id
      fetch(this.participationsUrl(heatId), {
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => response.json())
        .then(data => {
          this.participationsData = data
        })
    },
    row_attr (item, type) {
      console.log(item)
      return {
        style: `background-color:  ${lighten(item.lycraColor.hex)};`
      }
    }
  }
}
</script>
