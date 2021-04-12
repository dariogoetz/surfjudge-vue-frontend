<template>
  <div>
    <div v-if="guiData === null" />
    <b-container v-else-if="guiData.length > 0">
      <b-card
        v-for="heat in guiData"
        :key="heat.id"
        no-body
        header-bg-variant="secondary"
        header-text-variant="white"
      >
        <template #header>
          {{ heat.category.name }}: {{ heat.name }}
        </template>
        <result-table
          :heat-id="heat.id"
          class="result-table"
        />
      </b-card>
    </b-container>
    <b-container v-else>
      <b-jumbotron header="Live Results" lead="Currently no heats are running" />
    </b-container>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import ResultTable from '../components/ResultTable.vue'
import Socket from '../utils/Socket.js'

export default {
  components: {
    ResultTable
  },
  props: {
    tournament: { type: Object, default: null }
  },
  data () {
    return {
      activeHeats: null,
      categories: null,
      ws: null
    }
  },
  computed: {
    activeHeatsUrl () {
      return this.tournament === null ? null : `${this.publicApiUrl}/tournaments/${this.tournament.id}/active_heats`
    },
    categoriesUrl () {
      return `${this.publicApiUrl}/tournaments/${this.tournament.id}/categories`
    },
    guiData () {
      if ((this.activeHeats === null) || (this.categories === null)) return null
      const res = []
      this.activeHeats.forEach((h) => {
        const heat = Object.assign({}, h)
        heat.category = this.categories.get(h.category_id) || {}
        res.push(heat)
      })
      return res
    },
    ...mapGetters(['publicApiUrl'])
  },
  watch: {
    tournament () {
      this.refresh()
    }
  },
  created () {
    this.initWebSocket()
    this.refresh()
  },
  beforeDestroy () {
    this.deinitWebSocket()
  },
  methods: {
    refresh () {
      if (this.tournament === null) return
      fetch(this.activeHeatsUrl)
        .then((response) => response.json())
        .then((data) => {
          this.activeHeats = data
        })

      fetch(this.categoriesUrl)
        .then((response) => response.json())
        .then((data) => {
          this.categories = new Map()
          data.forEach((c) => {
            this.categories.set(c.id, c)
          })
        })
    },
    initWebSocket () {
      Socket.$on('active-heats', this.onActiveHeats)
      Socket.$on('heats', this.onActiveHeats)
    },
    deinitWebSocket () {
      Socket.$off('heats', this.onActiveHeats)
      Socket.$off('active-heats', this.onActiveHeats)
    },
    onActiveHeats () {
      this.refresh()
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em

.result-table
  overflow auto
</style>
