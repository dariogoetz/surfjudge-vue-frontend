<template>
  <div>
    <div v-if="initialized">
      <b-navbar toggleable="lg" type="dark" variant="dark">
        <b-navbar-brand href="#">
          <b-link to="/" class="navbar-brand">
            <img src="/static/img/Banner1.png">
          </b-link>
          <b-link to="/" class="navbar-brand">
            <img src="/static/img/Banner2.png">
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
            <b-nav-item to="/judge_panel">
              <b-icon-filter-left />
              Judge Panel
            </b-nav-item>
          </b-navbar-nav>
        </b-collapse>

        <b-navbar-nav class="ml-auto">
          <login />
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
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Socket from '../utils/Socket.js'
import DropdownMenu from '../components/DropdownMenu.vue'
import Login from '../components/Login.vue'

export default {
  components: {
    DropdownMenu,
    Login
  },
  props: {
  },
  data () {
    return {
      tournament: null
    }
  },
  computed: {
    tournamentsUrl () {
      return this.initialized ? `${this.publicApiUrl}/tournaments` : ''
    },
    ...mapGetters(['initialized', 'configUrl', 'publicApiUrl'])
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
        .then((data) => {
          this.$store.commit('setConfig', data)
          Socket.init(
            data.websocket_url,
            ['active_heats', 'results', 'participants', 'advancements', 'heats', 'scores', 'judging_requests', 'judging_assignments']
          )
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
