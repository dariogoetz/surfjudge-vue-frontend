<template>
  <div>
    <b-container>
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
          :websocket-url="websocketUrl"
          :api-url="apiUrl"
        />
      </b-card>
    </b-container>
  </div>
</template>

<script>
import ResultTable from '../components/ResultTable.vue'
import WebSocketClient from '../utils/websocket_client.js'

export default {
  components: {
    ResultTable
  },
  props: {
    tournament: { type: Object, default: null },
    websocketUrl: { type: String, default: null },
    apiUrl: { type: String, default: null }
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
      return this.tournament === null ? null : `${this.apiUrl}/tournaments/${this.tournament.id}/active_heats`
    },
    categoriesUrl () {
      return `${this.apiUrl}/tournaments/${this.tournament.id}/categories`
    },
    guiData () {
      if ((this.activeHeats === null) || (this.categories === null)) return []
      const res = []
      this.activeHeats.forEach((h) => {
        const heat = Object.assign({}, h)
        heat.category = this.categories.get(h.category_id) || {}
        res.push(heat)
      })
      return res
    }
  },
  watch: {
    tournament () {
      this.refresh()
    },
    websocketUrl () {
      this.initWebsocket()
    }
  },
  created () {
    this.initWebsocket()
    this.refresh()
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
    initWebsocket () {
      if (this.websocketUrl === null) return
      this.ws = new WebSocketClient({
        url: this.websocketUrl,
        channels: {
          active_heats: (jsonMsg) => {
            this.refresh()
          }
        },
        name: 'LiveResultsPage'
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em
</style>
