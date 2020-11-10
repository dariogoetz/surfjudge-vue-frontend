<template>
  <div>
    <b-container>
      <b-card
        v-for="heat in activeHeats"
        :key="heat.id"
        no-body
        header-bg-variant="secondary"
        header-text-variant="white"
      >
        <template #header>
          {{ heat.name }}
        </template>
        <result-table
          :heat-id="heat.id"
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
    tournament: { type: Object, default: null }
  },
  data () {
    return {
      activeHeats: []
    }
  },
  computed: {
    activeHeatsUrl () {
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
    refresh () {
      if (this.tournament === null) return
      fetch(this.activeHeatsUrl)
        .then((response) => response.json())
        .then((data) => { this.activeHeats = data })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em
</style>
