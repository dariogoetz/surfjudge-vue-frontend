<template>
  <div>
    <button
      class="btn btn-secondary dropdown-toggle"
      type="button"
      data-toggle="dropdown"
      aria-haspopup="true"
      aria-expanded="false"
    >
      {{ label }}
    </button>
    <div class="dropdown-menu">
      <a
        v-for="elem in elems"
        :key="elem.id"
        class="dropdown-item"
        href="#"
        @click="selected(elem)"
      >
        {{ elem.name }}
      </a>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    url: {
      type: String,
      default: null
    },
    defaultLabel: {
      type: String,
      default: 'Select'
    },
    labelKey: {
      type: String,
      default: 'name'
    }
  },
  data () {
    return {
      elems: [],
      current_elem: null
    }
  },
  computed: {
    label: function () { return this.current_elem === null ? this.defaultLabel : this.current_elem[this.labelKey] }
  },
  watch: {
    url () {
      this.refresh()
    }
  },
  created () {
    this.refresh()
  },
  methods: {
    refresh () {
      if (this.url === null) {
        return
      }
      console.log('Fetching from', this.url)
      fetch(this.url)
        .then(response => response.json())
        .then(data => {
          this.elems = data
          console.log('Dropdown menu fetched', data)
        })
    },
    selected (elem) {
      console.log('Dropdown menu: selected', elem)
      this.current_elem = elem
      this.$emit('selected', elem)
    }
  }
}
</script>

<style lang="stylus" scoped>
h1
  color green
</style>
