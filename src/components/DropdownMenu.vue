<template>
  <div>
    <b-dropdown :text="label">
      <b-dropdown-item
        v-for="elem in elems"
        :key="elem.id"
        @click="selected(elem)"
      >
        {{ elem[labelKey] }}
      </b-dropdown-item>
    </b-dropdown>
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
    },
    selectFirst: {
      type: Boolean,
      default: false
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
      console.debug('Fetching from', this.url)
      fetch(this.url)
        .then(response => response.json())
        .then(data => {
          this.elems = data
          if (this.selectFirst && this.elems.length > 0) {
            console.debug('selected first')
            this.selected(this.elems[0])
          }
          console.debug('Dropdown menu fetched', data)
        })
    },
    selected (elem) {
      console.debug('Dropdown menu: selected', elem)
      this.current_elem = elem
      this.$emit('selected', elem)
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
