<template>
  <div>
    <b-container>
      <dropdown-menu
        :url="categoriesUrl"
        default-label="Select Category"
        select-first
        @selected="select_category"
      />
      <b-row
        v-for="[round, round_data] in guiData"
        :key="round[0]"
        cols-md="1"
        cols-xl="1"
        class="mb-sm-3"
      >
        <b-col
          v-for="data in round_data"
          :key="data.heat.id"
          class="mb-sm-3"
        >
          <b-card
            no-body
            header-bg-variant="secondary"
            header-text-variant="white"
          >
            <template #header>
              {{ data.heat.name }}
            </template>
            <result-table
              :heat-id="data.heat.id"
              :initial-data="data"
            />
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import DropdownMenu from '../components/DropdownMenu.vue'
import ResultTable from '../components/ResultTable.vue'
import WebSocketClient from '../utils/websocket_client.js'

export default {
  components: {
    DropdownMenu,
    ResultTable
  },
  props: {
    tournament: { type: Object, default: null },
    websocketUrl: { type: String, default: 'wss://websocket.surfjudge.de' }
  },
  data () {
    return {
      category: null,
      heats: null,
      results: null,
      participations: null,
      combined: new Map(),
      ws: null
    }
  },
  computed: {
    categoriesUrl () {
      return this.tournament === null ? null : `http://localhost:8081/rest/tournaments/${this.tournament.id}/categories`
      // return this.tournament === null ? null : `https://www.surfjudge.de/rest/categories?tournament_id=${this.tournament.id}`
    },
    categoryHeatsUrl () {
      return this.category === null ? null : `http://localhost:8081/rest/categories/${this.category.id}/heats`
      // return this.category === null ? null : `https://www.surfjudge.de/rest/heats?category_id=${this.category.id}`
    },
    categoryResultsUrl () {
      return this.category === null ? null : `http://localhost:8081/rest/categories/${this.category.id}/results`
    },
    categoryParticipationsUrl () {
      return this.category === null ? null : `http://localhost:8081/rest/categories/${this.category.id}/participations`
    },
    guiData () {
      const r2h = new Map()
      this.combined.forEach((d) => {
        // TODO: check if no participants and exclude in that case
        if (!r2h.has(d.heat.round)) {
          r2h.set(d.heat.round, [])
        }
        r2h.get(d.heat.round).push(d)
      })
      // sort heats in each round
      r2h.forEach((heats, round) => {
        heats.sort((a, b) => a.heat.number_in_round - b.heat.number_in_round)
      })

      // map into sorted list of round and heats
      const roundsHeats = Array.from(r2h)
      roundsHeats.sort((a, b) => a[0] - b[0])
      return roundsHeats
    }
  },
  watch: {
    tournament (val) {
      this.category = null
    }
  },
  created () {
    this.ws = new WebSocketClient({
      url: this.websocketUrl,
      channels: {
        results: (jsonMsg) => {
          const msg = JSON.parse(jsonMsg)
          if (!('heat_id' in msg)) return
          const heatId = parseInt(msg.heat_id)
          if (this.heats.get(heatId)) {
            this.fetchResultsForHeat(heatId)
          }
        }
      },
      name: 'ResultsPage'
    })
  },
  methods: {
    refresh () {
      if ((this.results === null) || (this.participations === null) || (this.heats === null)) return
      const comb = new Map()
      this.heats.forEach((heat) => {
        comb.set(heat.id, {
          heat,
          participations: this.participations.get(heat.id),
          results: this.results.get(heat.id)
        })
      })
      this.combined = comb
    },
    select_category (category) {
      this.category = category
      this.heats = null
      this.results = null
      this.participations = null

      // fetch data for all heats in category once and distribute data directly
      this.fetchHeats()
      this.fetchParticipations()
      this.fetchResults()
    },
    heatResultsUrl (heatId) {
      return `http://localhost:8081/rest/heats/${heatId}/results`
    },
    fetchHeats (category) {
      return fetch(this.categoryHeatsUrl)
        .then(response => response.json())
        .then(data => {
          this.heats = data.reduce(function (m, d) {
            m.set(d.id, d)
            return m
          }, new Map())
          this.refresh()
        })
    },
    fetchResults (category) {
      return fetch(this.categoryResultsUrl)
        .then(response => response.json())
        .then(data => {
          this.results = new Map()
          data.forEach((d) => {
            if (!this.results.has(d.heat_id)) this.results.set(d.heat_id, [])
            this.results.get(d.heat_id).push(d)
          })
          this.refresh()
        })
    },
    fetchResultsForHeat (heatId) {
      return fetch(this.heatResultsUrl(heatId))
        .then(response => response.json())
        .then(data => {
          this.results.set(heatId, data)
          this.refresh()
        })
    },
    fetchParticipations (category) {
      return fetch(this.categoryParticipationsUrl)
        .then(response => response.json())
        .then(data => {
          this.participations = new Map()
          data.forEach((d) => {
            if (!this.participations.has(d.heat_id)) this.participations.set(d.heat_id, [])
            this.participations.get(d.heat_id).push(d)
          })
          this.refresh()
        })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em
</style>
