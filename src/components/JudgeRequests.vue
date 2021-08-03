<template>
  <div>
    <b-table
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
export default {
  props: {},
  data () {
    return {
    }
  }
}
</script>
