<template>
  <div>
    <b-container v-if="!isJudge">
      <b-jumbotron header="Judge Section" lead="Please log in..." />
    </b-container>
    <div v-if="isJudge && state !== null">
      <b-container v-if="state === 'waiting'">
        <b-jumbotron header="Judging Panel" lead="Please wait for heat to start...">
          <hr>
          <img src="/static/img/JudgingPanelWaiting.png" style="width: 80%; max-width: 600px; margin-left: auto; margin-right: auto; display: block;">
        </b-jumbotron>
      </b-container>
      <b-container class="checkJudge" v-if="state === 'checkJudge'">
        <b-row class="justify-content-center">
          <b-col cols="6">
            <b-jumbotron header="Heat is over.">
              <hr>
              <br>
              <span>{{ judgeCheckMessage }}</span>
              <br><br><br>
              <b-button @click="setWaiting" variant="success" size="lg"><b-icon-check />Yes</b-button>
              <b-button @click="logout" variant="danger" size="lg" class="float-right"><b-icon-x />No</b-button>
            </b-jumbotron>
          </b-col>
        </b-row>
      </b-container>
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
import { mapGetters } from 'vuex'

import { lightenDarkenColor } from '../utils/lighten_darken_color'
import Socket from '../utils/Socket.js'
import EditScore from '../components/EditScore.vue'

export default {
  components: {
    EditScore
  },
  props: {
    tournament: { type: Object, default: null },
    checkJudge: { type: Boolean, default: true },
    nBestWaves: { type: Number, default: 1, validator: (val) => [1, 2].includes(val) }
  },
  data () {
    return {
      activeHeats: [],
      heatData: null,
      scoresData: null,
      participationsData: null,
      state: 'uninitialized',
      editScore: null,
      showModal: false,
      judgingRequestsInterval: null
    }
  },
  computed: {
    judgingRequestsUrl () { return `${this.judgingApiUrl}/judging_requests` },
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
        // annotate best waves
        s.sort((a, b) => b.score - a.score)
        if (s.length > 1) s[0].best_wave = true
        if (this.nBestWaves > 1 && s.length > 2) s[1].best_wave = true
        // order by wave number
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
              return s.score.toFixed(1)
            },
            tdClass: (value) => value.best_wave ? 'scoreElem bestWave' : 'scoreElem'
          }
        })
      ]
    },
    judgeCheckMessage () {
      if (!this.isJudge) return ''
      let name = this.authenticatedUser.username
      if (this.authenticatedUser.firstName || this.authenticatedUser.lastName) {
        name = `${this.authenticatedUser.firstName} ${this.authenticatedUser.lastName}`
      }
      return `Are you ${name}?`
    },
    ...mapGetters(['isJudge', 'authenticatedUser', 'publicApiUrl', 'judgingApiUrl'])
  },
  watch: {
    isJudge () {
      this.activeHeats = []
      this.heatData = null
      this.scoresData = null
      this.participationsData = null
      this.state = 'uninitialized'
      this.editScore = null
      this.showModal = false
      this.unregisterJudgingRequests()
      this.registerJudgingRequests()

      this.refreshActiveAssignments()
    }
  },
  created () {
    this.registerJudgingRequests()
    this.initWebSocket()
    this.refreshActiveAssignments()
  },
  beforeDestroy () {
    this.unregisterJudgingRequests()
    this.deinitWebSocket()
  },
  methods: {
    heatsUrl (heatId) { return `${this.publicApiUrl}/heats/${heatId}` },
    scoresUrl (heatId) { return `${this.judgingApiUrl}/heats/${heatId}/judges/${this.authenticatedUser.id}/scores` },
    participationsUrl (heatId) { return `${this.publicApiUrl}/participations/${heatId}` },
    initWebSocket () {
      Socket.$on('active-heats', this.refreshActiveAssignments)
      Socket.$on('scores', this.onScores)
      Socket.$on('heats', this.refreshHeat)
      Socket.$on('participants', this.refreshParticipations)
    },
    deinitWebSocket () {
      Socket.$off('active-heats', this.refreshActiveAssignments)
      Socket.$off('scores', this.onScores)
      Socket.$off('heats', this.refreshHeat)
      Socket.$off('participants', this.refreshParticipations)
    },
    onScores (msg) {
      if (this.authenticatedUser.id === msg.judge_id) this.refreshScores()
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
      if (!this.isJudge) return
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
            if (this.state === 'judging' && this.checkJudge) {
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
        // style: `background-color:  ${lightenDarkenColor(item.lycra_color.hex, 220)};`
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
    },
    setWaiting () {
      this.state = 'waiting'
    },
    logout () {
      this.$store.commit('requestLogout')
    },
    registerJudgingRequests () {
      this.judgingRequestsInterval = setInterval(() => {
        if (!this.isJudge) return
        fetch(this.judgingRequestsUrl, {
          method: 'POST',
          credentials: 'include'
        })
      }, 5000)
    },
    unregisterJudgingRequests () {
      clearInterval(this.judgingRequestsInterval)
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

table >>> tr > td.bestWave
  font-weight bold
  background-color #0000ff22

.checkJudge >>> button
  height 100px
  width 150px
  font-size 1.5em
.checkJudge >>> span
  font-size 2em
</style>
