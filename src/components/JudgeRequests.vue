<template>
  <div>
    <b-table
      :items="rows"
      :fields="fields"
      class="table table-striped judging_requests_table"
      data-toggle="table"
      data-sort-name="judge_id"
      date-sort-order="asc">
      <thead>
        <tr>
          <th data-field="judge_id">Judge ID</th>
          <th data-field="name" data-sortable="true">Judge Name</th>
          <th data-field="expires" data-sortable="true">Expires</th>
          <th data-field="status" data-sortable="true">Status</th>
          <th data-field="action">Action</th>
        </tr>
      </thead>
    </b-table>
    <b-button variant="secondary" class="add_judges_btn"><b-icon-plus />&nbsp;Add Judges</b-button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Socket from '../utils/Socket'

export default {
  props: {},
  data () {
    return {
      judgingRequests: null
    }
  },
  computed: {
    getJudgingRequestsUrl () { return `${this.adminApiUrl}/judging_requests` },
    rows() {
      let res = []
      if (this.judgingRequests === null) return res
      this.judgingRequests.forEach((req, i) => {
        res.push({
          judgeId: req.judge_id,
          name: `${req.judge.first_name} ${req.judge.last_name}`,
          expires: req.expire_date,
          status: "tbd",
          actions: "tbd"
        })
      })
      res.sort((a, b) => a.judgeId - b.judgeId)
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
    initWebSocket () {
      Socket.$on('judging-requests', this.onJudgingRequests)
    },
    deinitWebSocket () {
      Socket.$off('judging-requests', this.onJudgingRequests)
    },
    onJudgingRequests () {
      this.refresh()
    },
    refresh () {
      fetch(this.getJudgingRequestsUrl, {
        credentials: 'include'
      })
        .then(response => response.json())
        .then(data => {
          this.judgingRequests = data
        })
    }
  }
}
</script>