<template>
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
      <a
        class="navbar-brand"
        href="/"
        style="padding:0;"
      >
        <img
          src="/static/img/SurfjudgeLogo.png"
        >
      </a>
      <a
        class="navbar-brand"
        href="/"
        style="padding:0;"
      >
        <img
          src="/static/img/DWV_Logo_weiß_small.png"
        >
      </a>
    </div>

    <div class="collapse navbar-collapse">
      <ul class="navbar-nav mr-auto">
        <li id='nav_item_live_results' class="nav-item"><a class="nav-link" href="/live_results"><span class="fa fa-align-left" />&nbsp;Live Results</a></li>
        <li id='nav_item_heatcharts' class="nav-item"><a class="nav-link" href="/heatcharts"><span class="fa fa-project-diagram" />&nbsp;Heatcharts</a></li>
        <li id='nav_item_results' class="nav-item"><a class="nav-link" href="/results"><span class="fa fa-list" />&nbsp;Results</a></li>
      </ul>
    </div>
  </nav>
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
