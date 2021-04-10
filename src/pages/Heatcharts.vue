<template>
  <div>
    <b-container fluid>
      <b-card
        v-for="category in categories"
        :key="category.id"
        no-body
        header-bg-variant="secondary"
        header-text-variant="white"
      >
        <template #header>
          {{ category.name }}
        </template>
        <heatchart
          :category-id="category.id"
        />
      </b-card>
      <hr>
    </b-container>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Heatchart from '../components/Heatchart.vue'

export default {
  components: {
    Heatchart
  },
  props: {
    tournament: { type: Object, default: null }
  },
  data () {
    return {
      categories: []
    }
  },
  computed: {
    categoriesUrl () {
      return this.tournament === null ? null : `${this.publicApiUrl}/tournaments/${this.tournament.id}/categories`
    },
    ...mapGetters(['publicApiUrl'])
  },
  watch: {
    tournament () {
      this.refresh()
    },
    baseUrl () {
      this.refresh()
    }
  },
  created () {
    this.refresh()
  },
  methods: {
    refresh () {
      if (this.tournament === null) return
      fetch(this.categoriesUrl)
        .then((response) => response.json())
        .then((data) => { this.categories = data })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em
</style>
