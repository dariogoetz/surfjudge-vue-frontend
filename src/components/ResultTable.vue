<template>
  <div>
    <b-table :items="items" />
  </div>
</template>

<script>
export default {
  props: {
    url: {
      type: String,
      default: null
    }
  },
  data () {
    return {
      items: []
    }
  }
}
</script>

<style lang="stylus" scoped>
h1
  color red
</style>
