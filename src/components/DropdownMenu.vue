<template>
  <div>
    <b-dropdown :text="label" :right="right">
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
    },
    right: {
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
      fetch(this.url)
        .then(response => response.json())
        .then(data => {
          this.elems = data
          if (this.selectFirst && this.elems.length > 0) {
            this.selected(this.elems[0])
          }
        })
    },
    selected (elem) {
      this.current_elem = elem
      this.$emit('selected', elem)
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
