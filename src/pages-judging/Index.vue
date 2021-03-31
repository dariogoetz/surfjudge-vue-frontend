<template>
  <div>
    <div v-if="apiReady">
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
          </b-navbar-nav>
        </b-collapse>

        <b-navbar-nav class="ml-auto">
          <login @authenticated="setAuthenticated" :api-url="authApiUrl" />
        </b-navbar-nav>

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
        :authenticated="authenticated"
        :public-api-url="publicApiUrl"
        :auth-api-url="authApiUrl"
        :judging-api-url="judgingApiUrl"
      />
    </div>
  </div>
</template>

<script>
import Socket from '../utils/Socket.js'
import DropdownMenu from '../components/DropdownMenu.vue'
import Login from '../components/Login.vue'

export default {
  components: {
    DropdownMenu,
    Login
  },
  props: {
    baseUrl: { type: String, default: '' }
  },
  data () {
    return {
      authenticated: null,
      tournament: null,
      config: {
        websocket_url: null,
        auth_path: null,
        judging_path: null
      }
    }
  },
  computed: {
    apiReady () {
      return this.config.public_path !== null
    },
    configUrl () {
      return `${this.baseUrl}/config`
    },
    publicApiUrl () {
      return this.config.public_path === null ? '' : `${this.baseUrl}${this.config.public_path}`
    },
    authApiUrl () {
      return this.config.auth_path === null ? '' : `${this.baseUrl}${this.config.auth_path}`
    },
    judgingApiUrl () {
      return this.config.judging_path === null ? '' : `${this.baseUrl}${this.config.judging_path}`
    },
    tournamentsUrl () {
      return this.config.public_path === null ? '' : `${this.baseUrl}${this.config.public_path}/tournaments`
    }
  },
  created () {
    this.fetchConfig()
  },
  methods: {
    setAuthenticated (data) {
      this.authenticated = data
    },
    selectTournament (tournament) {
      this.tournament = tournament
    },
    fetchConfig () {
      fetch(this.configUrl)
        .then((response) => response.json())
        .then((data) => {
          this.config = data
          Socket.init(data.websocket_url)
        })
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
