<template>
  <div>
    <b-table
      :items="rows"
      :fields="fields"
      :tbody-tr-class="row_class"
      class="table judging_requests_table"
      borderless
      no-select-on-click
    >
      
      <template #cell(action)="data">
        <b-button v-if="data.item.status==='pending'" @click="confirmJudge(data.item.judgeId)" variant="success" ><b-icon-check-circle-fill /></b-button>
        <b-button v-if="data.item.status==='confirmed'" @click="unassignJudge(data.item.judgeId)" variant="secondary" ><b-icon-x-circle-fill /></b-button>
        <b-button v-if="data.item.status==='missing'" @click="unassignJudge(data.item.judgeId)" variant="danger" ><b-icon-x-circle-fill /></b-button>
      </template>

    </b-table>
    <b-button variant="secondary" class="add_judges_btn"><b-icon-plus />&nbsp;Add Judges</b-button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Socket from '../utils/Socket'

export default {
  props: {
    heatId: { type: Number, required: true },
  },
  data () {
    return {
      judgingRequests: null,
      judgingAssignments: null,
    }
  },
  computed: {
    getJudgingRequestsUrl () { return `${this.adminApiUrl}/judging_requests` },
    getJudgingAssignmentsUrl () { return `${this.adminApiUrl}/heats/${this.heatId}/assigned_judges` },
    rows() {
      let res = []
      if (this.judgingRequests === null) return res
      if (this.judgingAssignments === null) return res
      let requests = new Set(this.judgingRequests.map(r => r.judge_id))
      let assignments = new Set(this.judgingAssignments.map(r => r.id))
      let confirmed = this.judgingRequests.filter(r => assignments.has(r.judge_id))
      let pending = this.judgingRequests.filter(r => !assignments.has(r.judge_id))
      let missing = this.judgingAssignments.filter(a => !requests.has(a.id))
      confirmed.sort((a, b) => a.judge_id - b.judge_id)
      missing.sort((a, b) => a.id - b.id)
      pending.sort((a, b) => a.judge_id - b.judge_id)
      confirmed.forEach(req => {
        res.push({
          judgeId: req.judge_id,
          name: `${req.judge.first_name} ${req.judge.last_name}`,
          expires: req.expire_date,
          status: 'confirmed',
          actions: 'tbd'
        })
      })
      missing.forEach(assignment => {
        res.push({
          judgeId: assignment.id,
          name: `${assignment.first_name} ${assignment.last_name}`,
          expires: '-',
          status: 'missing',
          actions: 'tbd'
        })
      })
      pending.forEach(req => {
        res.push({
          judgeId: req.judge_id,
          name: `${req.judge.first_name} ${req.judge.last_name}`,
          expires: req.expire_date,
          status: 'pending',
          actions: 'tbd'
        })
      })
      return res
    },
    fields() {
      return [
        {
          key: 'judgeId',
          label: 'Judge ID'
        },
        {
          key: 'name',
          label: 'Judge Name'
        },
        {
          key: 'expires',
          label: 'Expires'
        },
        {
          key: 'status',
          label: 'Status'
        },
        {
          key: 'action',
          label: 'Action'
        },
      ]
    },
  ...mapGetters(['adminApiUrl'])
  },
  created () {
    this.initWebSocket()
    this.refresh()
  },
  beforeDestroy () {
    this.deinitWebSocket()
  },
  methods: {
    putJudgingAssignmentUrl (judgeId) { return `${this.adminApiUrl}/heats/${this.heatId}/judges/${judgeId}` },
    deleteJudgingAssignmentUrl (judgeId) { return `${this.adminApiUrl}/heats/${this.heatId}/judges/${judgeId}` },
    initWebSocket () {
      Socket.$on('judging-requests', this.onJudgingRequests)
      Socket.$on('judging-assignments', this.onJudgingAssignments)
    },
    deinitWebSocket () {
      Socket.$off('judging-requests', this.onJudgingRequests)
      Socket.$off('judging-assignments', this.onJudgingAssignments)
    },
    onJudgingRequests () {
      this.fetchJudgingRequests()
    },
    onJudgingAssignments () {
      this.fetchJudgingAssignments()
    },
    fetchJudgingRequests () {
      fetch(this.getJudgingRequestsUrl, {
        credentials: 'include'
      })
        .then(response => response.json())
        .then(data => {
          this.judgingRequests = data
        })
    },
    fetchJudgingAssignments () {
      fetch(this.getJudgingAssignmentsUrl, {
        credentials: 'include'
      })
        .then(response => response.json())
        .then(data => {
          this.judgingAssignments = data
        })
    },
    refresh () {
      this.fetchJudgingRequests()
      this.fetchJudgingAssignments()
    },
    row_class (item, type) {
      return item.status
    },
    unassignJudge (judgeId) {
      fetch(this.deleteJudgingAssignmentUrl(judgeId), {
        method: 'DELETE',
        credentials: 'include'
      })
    },
    confirmJudge (judgeId) {
      fetch(this.putJudgingAssignmentUrl(judgeId), {
        method: 'PUT',
        body: JSON.stringify({'heat_id': this.heatId, 'judge_id': judgeId}),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
    }
  }
}
</script>

<style lang="stylus" scoped>

table >>> tr.missing
  background-color #FF8888

table >>> tr.confirmed
  background-color #88FF88

table >>> tr > td
  vertical-align middle

</style>
