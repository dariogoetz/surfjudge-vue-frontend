<template>
  <div>
    <b-container v-if="active">
      Waiting
    </b-container>
    <div v-else>
      It is on!
    </div>
  </div>
</template>

<script>
export default {
  props: {
    authenticated: { type: Object, default: null },
    tournament: { type: Object, default: null },
    publicApiUrl: { type: String, default: '' },
    judgingApiUrl: { type: String, default: '' }
  },
  data () {
    return {
      activeHeats: []
    }
  },
  computed: {
    activeAssignementsUrl () { return `${this.judgingApiUrl}/active_judge_assignments` },
    active () { return this.activeHeats.length === 0 }
  },
  created () {
    fetch(this.activeAssignementsUrl, {
      credentials: 'include' // for CORS in dev setup
    })
      .then(response => response.json())
      .then(data => {
        this.activeHeats = data
      })
  },
  methods: {}
}
</script>
