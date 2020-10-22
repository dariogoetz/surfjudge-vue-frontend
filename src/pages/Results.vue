<template>
  <div>
    <b-container>
      <dropdown-menu
        :url="categories_url"
        default-label="Select Category"
        select-first
        @selected="select_category"
      />
      <b-row
        v-for="[round, round_heats] in heats_by_round"
        :key="round[0]"
        cols-md="1"
        cols-xl="1"
        class="mb-sm-3"
      >
        <b-col
          v-for="h in round_heats"
          :key="h.id"
          class="mb-sm-3"
        >
          <b-card
            no-body
            header-bg-variant="secondary"
            header-text-variant="white"
          >
            <template #header>
              {{ h.name }}
            </template>
            <result-table
              :results-url="results_url(h.id)"
              :heat-url="heat_url(h.id)"
              :participations-url="participations_url(h.id)"
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
      heats: []
    }
  },
  computed: {
    tournaments_url () {
      return 'http://localhost:8081/rest/tournaments'
      // return 'https://www.surfjudge.de/rest/tournaments'
    },
    categories_url () {
      return this.tournament === null ? null : `http://localhost:8081/rest/tournaments/${this.tournament.id}/categories`
      // return this.tournament === null ? null : `https://www.surfjudge.de/rest/categories?tournament_id=${this.tournament.id}`
    },
    category_heats_url () {
      return this.category === null ? null : `http://localhost:8081/rest/categories/${this.category.id}/heats`
      // return this.category === null ? null : `https://www.surfjudge.de/rest/heats?category_id=${this.category.id}`
    },
    heats_by_round () {
      const r2h = new Map()
      this.heats.forEach(heat => {
        // TODO: check if no participants
        if (!r2h.has(heat.round)) {
          r2h.set(heat.round, [])
        }
        r2h.get(heat.round).push(heat)
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
      this.fetch_heats()
    },
    results_url (heatId) {
      return heatId === null ? null : `http://localhost:8081/rest/heats/${heatId}/results`
      // return heatId === null ? null : `https://www.surfjudge.de/rest/results/${heatId}`
    },
    heat_url (heatId) {
      return heatId === null ? null : `http://localhost:8081/rest/heats/${heatId}`
      // return heatId === null ? null : `https://www.surfjudge.de/rest/heats/${heatId}`
    },
    participations_url (heatId) {
      return heatId === null ? null : `http://localhost:8081/rest/heats/${heatId}/participations`
      // return heatId === null ? null : `https://www.surfjudge.de/rest/participants/${heatId}`
    },
    fetch_heats (category) {
      fetch(this.category_heats_url)
        .then(response => response.json())
        .then(data => { this.heats = data })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em
</style>
