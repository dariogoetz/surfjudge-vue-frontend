<template>
  <div>
    <div v-if="authenticated !== null">
      <b-container v-if="state === 'waiting'">
        Waiting
      </b-container>
      <div v-if="state === 'checkJudge'">
        Check Judge
      </div>
      <div v-if="state === 'judging'">
        <b-card
          no-body
          header-bg-variant="secondary"
          header-text-variant="white"
        >
          <template #header>
            {{ heatData === null ? "" : heatData.name }}
          </template>
          <b-table
            :items="rows"
            :fields="fields"
            :tbody-tr-attr="rowAttr"
            bordered
            @row-clicked="rowClicked"
          />
          <b-modal
            id="enter-score-modal"
            v-model="showModal"
            size="lg"
            hide-header
            hide-footer
          >
            <edit-score
              :api-url="judgingApiUrl"
              :authenticated="authenticated"
              :edit-score="editScore"
              @close="cancelEdit"
              @error="showError"
            />
          </b-modal>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import { lighten, lightenDarkenColor } from '../utils/lighten_darken_color'
import Socket from '../utils/Socket.js'
import EditScore from '../components/EditScore.vue'

export default {
  components: {
    EditScore
  },
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
      participationsData: null,
      state: 'waiting',
      editScore: null,
      showModal: false
    }
  },
  computed: {
    activeAssignementsUrl () { return `${this.judgingApiUrl}/active_judge_assignments` },
    active () { return this.activeHeats.length === 0 },
    rows () {
      if (this.participationsData === null) return []
      const data = new Map()
      this.participationsData.forEach((part, i) => {
        data.set(part.surfer_id, Object.assign({}, part))
      })
      const scores = (this.scoresData || [])
      const scoresBySurfer = new Map()
      scores.forEach((score, i) => {
        const sid = score.surfer_id
        const val = data.get(sid)
        val[`wave_${score.wave}`] = score

        if (!scoresBySurfer.has(sid)) scoresBySurfer.set(sid, [])
        scoresBySurfer.get(sid).push(score)
      })
      scoresBySurfer.forEach((s, sid) => {
        const val = data.get(sid)
        s.sort((a, b) => a.wave - b.wave)
        val.scores = s
      })
      const res = [...data.values()]
      res.sort((a, b) => a.seed - b.seed)
      return res
    },
    fields () {
      if (this.heatData === null) return []
      return [
        {
          key: 'lycra_color',
          label: 'Wave',
          formatter: (c) => c.name.charAt(0).toUpperCase() + c.name.slice(1),
          tdAttr: (value, key, item) => { return { style: `background-color: ${lightenDarkenColor(value.hex, 90)};` } }, // lycra hex color as background
          tdClass: 'colorElem'
        },
        ...[...Array(this.heatData.number_of_waves).keys()].map((v, i) => {
          return {
            key: `wave_${i}`,
            label: `${i + 1}`,
            formatter: (s) => {
              if (s === null) return ''
              if (s.interference) return 'I'
              if (s.missed) return 'M'
              return s.score
            },
            tdClass: 'scoreElem'
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
    // TODO: send judging requests
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
    uniqueAssignment () {
      if (this.activeHeats.length !== 1) {
        if (this.activeHeats.length > 1) console.error('More than one heat active for me.')
        this.heatData = null
        this.scores = null
        return false
      }
      return true
    },
    refreshActiveAssignments () {
      if (this.authenticated === null) return
      fetch(this.activeAssignementsUrl, {
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => {
          if (!response.ok) {
            this.state = 'waiting'
            return []
          }
          return response.json()
        })
        .then(data => {
          this.activeHeats = data
          if (this.uniqueAssignment()) {
            this.state = 'judging'
            this.refreshHeat()
            this.refreshScores()
            this.refreshParticipations()
          } else {
            if (this.state === 'judging') {
              this.state = 'checkJudge'
            } else {
              this.state = 'waiting'
            }
          }
        })
    },
    refreshHeat () {
      if (!this.uniqueAssignment()) return

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
      if (!this.uniqueAssignment()) return

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
      if (!this.uniqueAssignment()) return

      const heatId = this.activeHeats[0].id
      fetch(this.participationsUrl(heatId), {
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => response.json())
        .then(data => {
          this.participationsData = data
        })
    },
    rowAttr (item, type) {
      return {
        style: `background-color:  ${lighten(item.lycra_color.hex)};`
      }
    },
    rowClicked (item, index, event) {
      const colIndex = event.target.cellIndex
      const maxWave = Math.max(...item.scores.map(score => score.wave))

      const scoresMap = new Map(item.scores.map(v => [v.wave, v]))
      // determine which wave is to be edited
      if (colIndex > maxWave + 2) return
      let wave = null
      if (colIndex === 0) {
        wave = maxWave + 1
      } else {
        wave = colIndex - 1
      }
      const oldScore = scoresMap.get(wave) || null
      this.editScore = {
        wave,
        surfer_id: item.surfer.id,
        score: oldScore,
        heat_id: this.heatData.id,
        hex: item.lycra_color.hex
      }
      this.showModal = true
    },
    cancelEdit () {
      this.editScore = null
      this.showModal = false
    },
    showError (msg) {
      this.cancelEdit()
      this.$bvToast.toast(msg, {
        title: 'Error',
        autoHideDelay: 2000,
        appendToast: true,
        variant: 'danger',
        solid: true
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em

table >>> tr > td
  vertical-align middle
  font-size 1.5em
  text-align center
  height 70px

table >>> tr > td.colorElem
  font-weight bold
</style>
