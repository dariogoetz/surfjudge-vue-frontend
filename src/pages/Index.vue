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
            &nbsp;Live Results
          </b-nav-item>
          <b-nav-item to="/heatcharts">
            <span class="fa fa-project-diagram" />
            &nbsp;Heatcharts
          </b-nav-item>
          <b-nav-item to="/results">
            <span class="fa fa-list" />
            &nbsp;Results
          </b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <router-view />
  </div>
</template>

<script>
export default {}
</script>

<style lang="stylus" scoped>
  nav
    padding 0

  img
    width auto
    height 45px
</style>
