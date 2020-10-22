<template>
  <div>
    <b-container>
      <b-card
        v-for="heat in active_heats"
        :key="heat.id"
        no-body
        header-bg-variant="secondary"
        header-text-variant="white"
      >
        <template #header>
          {{ heat.name }}
        </template>
        <result-table
          :results-url="results_url(heat.id)"
          :heat-url="heat_url(heat.id)"
          :participations-url="participations_url(heat.id)"
        />
      </b-card>
    </b-container>
  </div>
</template>

<script>
import ResultTable from '../components/ResultTable.vue'

export default {
  components: {
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
      active_heats: []
    }
  },
  computed: {
    active_heats_url () {
      return this.tournament === null ? null : `http://localhost:8081/rest/active_heats/${this.tournament.id}`
    }
  },
  watch: {
    tournament () {
      this.refresh()
    }
  },
  created () {
    this.refresh()
  },
  methods: {
    results_url (heatId) {
      return heatId === null ? null : `http://localhost:8081/rest/heats/${heatId}/results`
    },
    heat_url (heatId) {
      return heatId === null ? null : `http://localhost:8081/rest/heats/${heatId}`
    },
    participations_url (heatId) {
      return heatId === null ? null : `http://localhost:8081/rest/heats/${heatId}/participations`
    },
    refresh () {
      if (this.tournament === null) return
      fetch(this.active_heats_url)
        .then((response) => response.json())
        .then((data) => { this.active_heats = data })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em
</style>
