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
        v-for="[round, round_heats] in heatsByRound"
        :key="round[0]"
        cols-md="1"
        cols-xl="1"
        class="mb-sm-3"
      >
        <b-col
          v-for="heat in round_heats"
          :key="heat.id"
          class="mb-sm-3"
        >
          <b-card
            no-body
            header-bg-variant="secondary"
            header-text-variant="white"
          >
            <template #header>
              {{ heat.name }}
            </template>
            <result-table
              :heat-id="heat.id"
              :initial-data="combined.get(heat.id)"
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

export default {
  components: {
    DropdownMenu,
    ResultTable
  },
  props: {
    tournament: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      category: null,
      heats: new Map(),
      results: new Map(),
      participations: new Map(),
      combined: new Map()
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

    heatsByRound () {
      const r2h = new Map()
      this.combined.forEach((d) => {
        // TODO: check if no participants and exclude in that case
        if (!r2h.has(d.heat.round)) {
          r2h.set(d.heat.round, [])
        }
        r2h.get(d.heat.round).push(d.heat)
      })
      // sort heats in each round
      r2h.forEach((heats, round) => {
        heats.sort((a, b) => a.number_in_round - b.number_in_round)
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
  methods: {
    select_category (category) {
      this.category = category
      Promise.all([
        this.fetchHeats(),
        this.fetchParticipations(),
        this.fetchResults()
      ]).then(() => {
        const comb = new Map()
        this.heats.forEach((heat) => {
          comb.set(heat.id, {
            heat,
            participations: this.participations.get(heat.id),
            results: this.results.get(heat.id)
          })
        })
        this.combined = comb
      })
    },
    fetchHeats (category) {
      return fetch(this.categoryHeatsUrl)
        .then(response => response.json())
        .then(data => {
          this.heats = data.reduce(function (m, d) {
            m.set(d.id, d)
            return m
          }, new Map())
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
        })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em
</style>
