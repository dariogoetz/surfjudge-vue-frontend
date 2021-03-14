<template>
  <div>
    <b-button-group>
      <b-button v-if="inactive" variant="success" ><b-icon-play /></b-button>

      <b-button v-if="active || paused" variant="danger" ><b-icon-stop /></b-button>
      <b-button v-if="active"><b-icon-pause /></b-button>
      <b-button v-if="paused" variant="success"><b-icon-play /></b-button>
      <b-button v-if="active || paused" variant="outline-secondary" ><b-icon-arrow-clockwise /></b-button>
    </b-button-group>
  </div>
</template>

<script>
export default {
  props: {
    heatId: {
      type: Number,
      default: null
    },
    apiUrl: { type: String, default: '' }
  },
  data () {
    return {
      elems: [],
      heatState: null
    }
  },
  computed: {
    getHeatStateUrl: function () { return `${this.apiUrl}/heats/${this.heatId}/state` },
    active: function () { return this.heatState === null ? false : this.heatState.state === 'active' },
    paused: function () { return this.heatState === null ? false : this.heatState.state === 'paused' },
    inactive: function () { return this.heatState === null ? true : this.heatState.state === 'inactive' }
  },
  watch: {
    heatId () {
      this.refresh()
    }
  },
  created () {
    this.refresh()
  },
  methods: {
    refresh () {
      if (this.heatId === null) {
        return
      }
      fetch(this.getHeatStateUrl)
        .then(response => response.json())
        .then(data => {
          this.heatState = data
        })
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
