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
            <span class="fa fa-align-left" />
            Live Results
          </b-nav-item>
          <b-nav-item to="/heatcharts">
            <span class="fa fa-project-diagram" />
            Heatcharts
          </b-nav-item>
          <b-nav-item to="/results">
            <span class="fa fa-list" />
            Results
          </b-nav-item>
        </b-navbar-nav>
      </b-collapse>

      <b-navbar-nav class="ml-auto">
        <dropdown-menu
          :url="tournaments_url"
          default-label="Select Tournament"
          select-first
          right
          @selected="select_tournament"
        />
      </b-navbar-nav>
    </b-navbar>

    <router-view :tournament="tournament" />
  </div>
</template>

<script>
import DropdownMenu from '../components/DropdownMenu.vue'

export default {
  components: {
    DropdownMenu
  },
  data () {
    return {
      tournament: null
    }
  },
  computed: {
    tournaments_url () {
      return 'http://localhost:8081/rest/tournaments'
      // return 'https://www.surfjudge.de/rest/tournaments'
    }
  },
  methods: {
    select_tournament (tournament) {
      this.tournament = tournament
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
