<template>
  <div>
    Edit Score {{ editScore }}
    <table class="outer_table table borderless">
      <tr>
        <td class="wave_label_td">
          <div class="wave_label">Wave <span class="wave_number">{{ editScore.wave + 1 }}</span></div>
          <br>
        </td>

        <td class="number_pad_td" rowspan="3">
          <table class="number_pad table table-bordered">
            <tbody>
              <tr class="number_btn_row">
                <td class="text-center number_btn" data-value="1">1</td>
                <td class="text-center number_btn" data-value="2">2</td>
                <td class="text-center number_btn" data-value="3">3</td>
              </tr>
              <tr class="number_btn_row">
                <td class="text-center number_btn" data-value="4">4</td>
                <td class="text-center number_btn" data-value="5">5</td>
                <td class="text-center number_btn" data-value="6">6</td>
              </tr>
              <tr class="number_btn_row">
                <td class="text-center number_btn" data-value="7">7</td>
                <td class="text-center number_btn" data-value="8">8</td>
                <td class="text-center number_btn" data-value="9">9</td>
              </tr>
              <tr class="number_btn_row">
                <td></td>
                <td class="text-center number_btn" data-value="0">0</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </td>

        <td class="cancel_btn_td">
          <button class="btn btn-secondary btn-lg cancel_btn">Cancel</button>
        </td>
      </tr>
      <tr>
        <td class="score_td">
          <h4 v-if="editScore.score !== null" align="center">
            <span class="old_score_label">Old:</span>
            <span class="old_score">{{ editScore.score.score || '--' }}</span>
          </h4>
          <span class="score" align="center"></span>
        </td>

        <td class="clear_btn_td">
          <button class="btn btn-info btn-lg clear_btn">Clear</button>
        </td>
      </tr>
      <tr>
        <td class="missed_btn_td" align="center">
          <button class="btn btn-standard btn-lg missed_btn">Missed</button>
        </td>
        <td class="submit_btn_td">
          <button class="btn btn-success btn-lg submit_btn">Enter</button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
  props: {
    editScore: { type: Object, required: true },
    authenticated: { type: Object, default: null }
  }
}
</script>
