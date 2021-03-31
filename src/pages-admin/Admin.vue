<template>
  <div>
    <b-container v-if="authenticated !== null">
      <b-row
        v-for="[round, round_heats] in guiData"
        :key="round[0]"
        cols="3"
        class="mb-sm-3"
      >
        <b-col
          v-for="heat in round_heats"
          :key="heat.id"
          class="mb-sm-3"
        >
          <b-card
            no-body
            header-bg-variant="secondary"
            header-text-variant="white"
          >
            {{ heat.category_id }} <br> {{ heat.name }}
            <heat-state
              :heat-id="heat.id"
              :public-api-url="publicApiUrl"
              :admin-api-url="adminApiUrl"
            />
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import HeatState from '../components/HeatState.vue'

export default {
  components: {
    HeatState
  },
  props: {
    authenticated: { type: Object, default: null },
    tournament: { type: Object, default: null },
    publicApiUrl: { type: String, default: '' },
    adminApiUrl: { type: String, default: '' }
  },
  data () {
    return {
      heats: []
    }
  },
  computed: {
    heatsUrl () {
      return this.tournament === null ? null : `${this.publicApiUrl}/heats`
    },
    guiData () {
      const c2h = new Map()
      this.heats.forEach((heat) => {
        if (!c2h.has(heat.category_id)) {
          c2h.set(heat.category_id, [])
        }
        c2h.get(heat.category_id).push(heat)
      })
      // sort heats in each round
      c2h.forEach((heats) => {
        heats.sort((a, b) => {
          if (a.round === b.round) {
            return a.number_in_round - b.number_in_round
          }
          return b.round - a.round
        })
      })

      // map into sorted list of round and heats
      const roundsHeats = Array.from(c2h)
      roundsHeats.sort((a, b) => a[0] - b[0])
      return roundsHeats
    }
  },
  watch: {
    tournament (val) {
      this.refresh()
    }
  },
  created () {
    this.refresh()
  },
  methods: {
    refresh () {
      this.fetchHeats()
    },
    fetchHeats () {
      if (this.tournament === null) return
      return fetch(this.heatsUrl)
        .then(response => response.json())
        .then(data => {
          this.heats = data.reduce(function (m, d) {
            m.set(d.id, d)
            return m
          }, new Map())
        })
    }
  }
}
</script>

<style lang="stylus" scoped>
.card-header
  font-size 2em
</style>
