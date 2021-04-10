<template>
  <div>
    <table class="outer_table table borderless" :style="backgroundColor">
      <tr>
        <td class="wave_label_td">
          <div class="wave_label">{{ waveLabel }}</div>
          <br>
        </td>

        <td class="number_pad_td" rowspan="3">
          <table class="number_pad table table-bordered" :style="backgroundColor">
            <tbody>
              <tr>
                <td @click="enterDigit(1)">1</td>
                <td @click="enterDigit(2)">2</td>
                <td @click="enterDigit(3)">3</td>
              </tr>
              <tr>
                <td @click="enterDigit(4)">4</td>
                <td @click="enterDigit(5)">5</td>
                <td @click="enterDigit(6)">6</td>
              </tr>
              <tr>
                <td @click="enterDigit(7)">7</td>
                <td @click="enterDigit(8)">8</td>
                <td @click="enterDigit(9)">9</td>
              </tr>
              <tr>
                <td />
                <td @click="enterDigit(0)">0</td>
                <td />
              </tr>
            </tbody>
          </table>
        </td>

        <td class="cancel_btn_td">
          <b-button
            variant="secondary"
            size="lg"
            class="cancel_btn"
            @click="close"
          >
            Cancel
          </b-button>
        </td>
      </tr>
      <tr>
        <td class="score_td">
          <h4 v-if="editScore !== null && editScore.score !== null" align="center">
            <span class="old_score_label">Old:</span>
            <span class="old_score">{{ oldScore }}</span>
          </h4>
          <span class="score" align="center">{{ newScore }}</span>
        </td>

        <td class="clear_btn_td">
          <b-button
            variant="info"
            size="lg"
            class="clear_btn"
            @click="resetScore"
          >
            Clear
          </b-button>
        </td>
      </tr>
      <tr>
        <td class="missed_btn_td" align="center">
          <b-button
            variant="light"
            size="lg"
            class="missed_btn"
            @click="setMissed"
          >
            Missed
          </b-button>
        </td>
        <td class="submit_btn_td">
          <b-button
            v-if="allowDelete && score === null"
            :disabled="editScore === null || editScore.score === null"
            variant="danger"
            size="lg"
            class="submit_btn"
            @click="deleteScore"
          >
            Delete
          </b-button>
          <b-button
            v-else
            :disabled="score === null"
            variant="success"
            size="lg"
            class="submit_btn"
            @click="submitScore"
          >
            Enter
          </b-button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { lighten } from '../utils/lighten_darken_color'
import round from '../utils/round_decimals'
export default {
  props: {
    editScore: { type: Object, default: null },
    allowDelete: { type: Boolean, default: false }
  },
  data () {
    return {
      score: null
    }
  },
  computed: {
    putScoreUrl () { return `${this.judgingApiUrl}/scores` },
    waveLabel () {
      if (this.editScore === null) return 'Wave'
      return `Wave ${this.editScore.wave + 1}`
    },
    oldScore () {
      if (this.editScore === null) return '--'
      return round(this.editScore.score.score, 1).toFixed(1)
    },
    newScore () {
      if (this.score === null) return '--'
      else if (this.score.missed) return 'M'
      else if (this.score.interference) return 'I'
      else return round(this.score.score, 1).toFixed(1)
    },
    backgroundColor () { return this.editScore === null ? '#eeeeee' : `background-color: ${lighten(this.editScore.hex)};` },
    ...mapGetters(['judgingApiUrl', 'authenticatedUser'])
  },
  methods: {
    deleteScoreUrl (s) {
      return `${this.judgingApiUrl}/scores/${s.heat_id}/${s.judge_id}/${s.surfer_id}/${s.wave}`
    },
    close () { this.$emit('close') },
    error (msg) { this.$emit('error', msg) },
    setMissed () {
      this.score = {
        score: -1,
        missed: true,
        interference: false
      }
    },
    resetScore () { this.score = null },
    enterDigit (digit) {
      var newScore = this.score || {}

      // If score is already set to "missed" or "interference" don't react on key input
      if (this.score !== null && (this.score.missed || this.score.interference)) {
        return
      }

      // If no score exists yet, asign keypad input to score
      // the counter counts how many digits the user enters
      if (this.score === null) {
        newScore.score = digit
        this.score = {}
        this.score.counter = 1
      } else if (this.score.score === 1 && digit === 0) {
        // If last digits was a 1 and current digit is 0 then save a 10
        newScore.score = 10
      } else if (this.score.counter < 2) {
        // In all other cases append the digit as in a calculator if user is entering first or second digit.
        // If user enter third or more digit ignore input
        newScore.score = this.score.score + 0.1 * digit
        this.score.counter = this.score.counter + 1
      } else {
        return
      }

      // If user has entered 1 and 0 which gives 10 and tries to enter a third digit (to obtain 10.1 or so) reset input
      if (newScore.score > 10) {
        newScore.score = null
      }

      if (newScore.score !== null) {
        this.score = {
          counter: this.score.counter,
          score: newScore.score,
          missed: false,
          interference: false
        }
      } else {
        this.score = null
      }
    },
    submitScore () {
      if (this.score === null) {
        this.close()
        return
      }
      const data = {
        judge_id: this.authenticatedUser.id,
        surfer_id: this.editScore.surfer_id,
        heat_id: this.editScore.heat_id,
        wave: this.editScore.wave,
        score: this.score.score,
        missed: this.score.missed,
        interference: this.score.interference
      }
      fetch(this.putScoreUrl, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
        .then(response => {
          if (!response.ok) {
            this.error('Error sending score to server.')
          } else {
            this.close()
          }
        })
    },
    deleteScore () {
      const data = {
        judge_id: this.authenticatedUser.id,
        surfer_id: this.editScore.surfer_id,
        heat_id: this.editScore.heat_id,
        wave: this.editScore.wave
      }
      fetch(this.deleteScoreUrl(data), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
        .then(response => {
          if (!response.ok) {
            this.error('Error sending score deletion request to server.')
          } else {
            this.close()
          }
        })
    }
  }
}
</script>

<style lang="stylus" scoped>
  table >>> .wave_label_td
    width 25%
    text-align center
    vertical-align middle
  table >>> .wave_label
    font-size 2em
    font-weight bold

  table >>> .missed_btn_td
    vertical-align middle
  table >>> .missed_btn
    width 100px
    height 70px

  table >>> .score_td
    text-align center
    vertical-align middle
    background-color #eeeeee
  table >>> .score
    font-size 3em
  table >>> .old_score_label
    color red

  table >>> .number_pad_td
    background-color #eeeeee
  table.number_pad > tbody > tr
    height 100px
  table.number_pad > tbody > tr > td
    font-size 2em
    font-weight bold
    text-align center
    vertical-align middle
  table.number_pad > tbody > tr > td:hover
    background-color #eeeeee

  table >>> .cancel_btn_td
    background-color #eeeeee
    vertical-align middle
    width 15%
  table >>> .cancel_btn
    width 100%
    height 70px

  table >>> .clear_btn_td
    background-color #eeeeee
    vertical-align middle
    border-radius 0px 0px 0px 0px
    width 15%
  table >>> .clear_btn
    width 100%
    height 70px

  table >>> .submit_btn_td
    background-color #eeeeee
    vertical-align middle
    border-radius 0px 0px 0px 0px
    width 15%
  table >>> .submit_btn
    width 100%
    height 70px

</style>
