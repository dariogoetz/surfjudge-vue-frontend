<template>
  <div>
    <nav
      class="navbar navbar-expand-lg navbar-dark bg-dark"
      role="navigation"
    >
      <div class="navbar-header">
        <button
          type="button"
          class="navbar-toggler"
          data-toggle="collapse"
          data-target=".navbar-collapse"
        >
          <span class="navbar-toggler-icon" />
        </button>
        <router-link
          to="/"
          class="navbar-brand"
          style="padding:0;"
        >
          <img
            src="/static/img/SurfjudgeLogo.png"
          >
        </router-link>
        <router-link
          to="/"
          class="navbar-brand"
          style="padding:0;"
        >
          <img
            src="/static/img/DWV_Logo_weiß_small.png"
          >
        </router-link>
      </div>

      <div class="collapse navbar-collapse">
        <ul class="navbar-nav mr-auto">
          <li id='nav_item_live_results' class="nav-item">
            <router-link to="/live_results" class="nav-link"><span class="fa fa-align-left" />&nbsp;Live Results</router-link>
          </li>
          <li id='nav_item_heatcharts' class="nav-item">
            <router-link to="/heatcharts" class="nav-link"><span class="fa fa-project-diagram" />&nbsp;Heatcharts</router-link>
          </li>
          <li id='nav_item_results' class="nav-item">
            <router-link to="/results" class="nav-link"><span class="fa fa-list" />&nbsp;Results</router-link>
          </li>
        </ul>
      </div>
    </nav>
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
