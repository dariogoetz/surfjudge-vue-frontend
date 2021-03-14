<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="dark">
      <b-navbar-brand href="#">
        <b-link to="/" class="navbar-brand">
          <img src="/static/img/SurfjudgeLogo.png">
        </b-link>
        <b-link to="/" class="navbar-brand">
          <img src="/static/img/DWV_Logo_weiß_small.png">
        </b-link>
      </b-navbar-brand>
      <b-navbar-toggle target="nav-collapse" />

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/live_results">
            <b-icon-filter-left />
            Live Results
          </b-nav-item>
          <b-nav-item to="/heatcharts">
            <b-icon-diagram3 />
            Heatcharts
          </b-nav-item>
          <b-nav-item to="/results">
            <b-icon-list-ul />
            Results
          </b-nav-item>
          <b-nav-item to="/admin">
            <b-icon-filter-left />
            Admin
          </b-nav-item>
        </b-navbar-nav>
      </b-collapse>

      <b-navbar-nav class="ml-auto">
        <dropdown-menu
          :url="tournamentsUrl"
          default-label="Select Tournament"
          variant="dark"
          select-first
          right
          @selected="selectTournament"
        />
      </b-navbar-nav>
    </b-navbar>

    <router-view
      :tournament="tournament"
      :websocket-url="config.websocket_url"
      :api-url="apiUrl"
    />
  </div>
</template>

<script>
import DropdownMenu from '../components/DropdownMenu.vue'

export default {
  components: {
    DropdownMenu
  },
  props: {
    apiUrl: { type: String, default: '' }
  },
  data () {
    return {
      tournament: null,
      config: {
        websocket_url: null,
        base_url: ''
      }
    }
  },
  computed: {
    configUrl () {
      return `${this.apiUrl}/config`
    },
    tournamentsUrl () {
      return `${this.apiUrl}/tournaments`
    }
  },
  created () {
    this.fetchConfig()
  },
  methods: {
    selectTournament (tournament) {
      this.tournament = tournament
    },
    fetchConfig () {
      fetch(this.configUrl)
        .then((response) => response.json())
        .then((data) => { this.config = data })
    }
  }
}
</script>

<style lang="stylus" scoped>
  nav
    padding 0

  a.navbar-brand
    padding 0

  img
    width auto
    height 45px
</style>
