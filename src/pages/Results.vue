<template>
  <div>
    <dropdown-menu
      :url="tournaments_url"
      default-label="Select Tournament"
      @selected="select_tournament"
    />
    <dropdown-menu
      :url="categories_url"
      default-label="Select Category"
      @selected="select_category"
    />
    <b-card-group deck>
      <b-row
        v-for="[round, round_heats] in heats_by_round"
        :key="round[0]"
      >
        <b-col
          v-for="h in round_heats"
          :key="h.id"
        >
          <b-card
            header-bg-variant="secondary"
            header-text-variant="white"
          >
            <template #header>
              {{ h.name }}
            </template>
            <result-table url="results_url(heat.id)" />
          </b-card>
        </b-col>
      </b-row>
    </b-card-group>
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
  data () {
    return {
      tournament: null,
      category: null,
      heats: []
    }
  },
  computed: {
    tournaments_url () {
      return 'http://localhost:8081/rest/tournaments'
    },
    categories_url () {
      return this.tournament === null ? null : `http://localhost:8081/rest/tournaments/${this.tournament.id}/categories`
    },
    heats_url () {
      return this.category === null ? null : `http://localhost:8081/rest/categories/${this.category.id}/heats`
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
  methods: {
    select_tournament (tournament) {
      console.debug('Results: selected tournament', tournament)
      this.tournament = tournament
    },
    select_category (category) {
      console.debug('Results: selected category', category)
      this.category = category
      this.fetch_heats()
    },
    results_url (heatId) {
      return heatId === null ? null : `http://localhost:8081/rest/heats/${heatId}/results`
    },
    fetch_heats (category) {
      console.debug('Fetching heats from', this.heats_url)
      fetch(this.heats_url)
        .then(response => response.json())
        .then(data => { console.debug('Fetched heats', data); this.heats = data })
    }
  }
}
</script>
