<template>
  <div>
    <dropdown-menu
      url="http://localhost:8081/rest/tournaments"
      select-first
    />
    <b-container>
      <b-card
        no-body
        header-bg-variant="secondary"
        header-text-variant="white"
      >
        <template #header>
          Heat
        </template>
        <result-table
          results-url="http://localhost:8081/rest/heats/8/results"
          heat-url="http://localhost:8081/rest/heats/8"
          participations-url="http://localhost:8081/rest/heats/8/participations"
        />
      </b-card>
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
  }
}
</script>
