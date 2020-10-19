<template>
  <div>
    <dropdown-menu
      :url="tournament_dropdown_url"
      default-label="Select Tournament"
      @selected="select_tournament"
    />
    <dropdown-menu
      :url="category_dropdown_url"
      default-label="Select Category"
      @selected="select_category"
    />
    <result-table />
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
      tournament_id: null
    }
  },
  computed: {
    tournament_dropdown_url () {
      return 'http://localhost:8081/rest/tournaments'
    },
    category_dropdown_url () {
      return this.tournament_id === null ? null : `http://localhost:8081/rest/tournaments/${this.tournament_id}/categories`
    }
  },
  methods: {
    select_tournament (tournament) {
      console.log('Results: selected', tournament)
      this.tournament_id = tournament.id
    },
    select_category (category) {
      console.log('Results: selected', category)
    }
  }
}
</script>
