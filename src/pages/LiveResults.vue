<template>
  <div>
    <dropdown-menu url="/rest/tournaments" />
    <dropdown-menu url="/rest/categories" />
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
  }
}
</script>
