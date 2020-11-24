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
      activeHeats: [],
      ws: null
    }
  },
  computed: {
    activeHeatsUrl () {
      return this.tournament === null ? null : `${this.apiUrl}/active_heats/${this.tournament.id}`
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
        .then((data) => { this.activeHeats = data })
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
