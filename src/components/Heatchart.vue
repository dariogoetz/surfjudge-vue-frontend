<template>
  <div />
</template>

<script>
import * as d3 from 'd3'
import parseISOLocal from '../utils/parse_local_date'
import { lighten } from '../utils/lighten_darken_color'
import WebSocketClient from '../utils/websocket_client.js'

export default {
  props: {
    categoryId: { type: Number, required: true },

    showIndividualScores: { type: Boolean, default: true },
    showTotalScores: { type: Boolean, default: true },

    targetWidth: { type: Number, default: null },
    scalingFactor: { type: Number, default: 1.25 },
    marginTop: { type: Number, default: 0 },
    marginBottom: { type: Number, default: 0 },
    marginLeft: { type: Number, default: 0 },
    marginRight: { type: Number, default: 0 },

    baseHeatWidth: { type: Number, default: 280 },
    heatMinVerticalSpacing: { type: Number, default: 50 },
    heatHorizontalSpacing: { type: Number, default: 100 },
    baseRowHeight: { type: Number, default: 18 },
    seedWidthFactor: { type: Number, default: 0.475 },
    placeWidthFactor: { type: Number, default: 0.475 },
    scoreWidthFactor: { type: Number, default: 0.1 },

    addSymbolOffset: { type: Number, default: 0 },

    websocketUrl: { type: String, default: 'wss://websocket.surfjudge.de' }

  },
  data () {
    return {
      heatsMap: null,
      advancements: null,
      participationsMap: null,
      resultsMap: null,
      combined: {
        heatsMap: new Map(),
        resultsMap: new Map(),
        participationsMap: new Map(),
        advancements: []
      },
      d3Svg: null,
      d3Heats: null,
      d3Links: null,
      d3GroupSelections: {},
      d3GroupEnters: {},
      ws: null
    }
  },
  computed: {
    heatsUrl () {
      return `http://localhost:8081/rest/categories/${this.categoryId}/heats`
    },
    advancementsUrl () {
      return `http://localhost:8081/rest/categories/${this.categoryId}/advancements`
    },
    resultsUrl () {
      return `http://localhost:8081/rest/categories/${this.categoryId}/results`
    },
    participationsUrl () {
      return `http://localhost:8081/rest/categories/${this.categoryId}/participations`
    },
    width () {
      if (this.targetWidth === null) return this.scalingFactor * this.internalWidth
      else return Math.floor(Math.min(this.targetWidth, this.scalingFactor * this.internalWidth)) - 5
    },
    height () {
      return this.width * (this.internalHeight / this.internalWidth) || 0
    },
    rowHeight () {
      return this.showIndividualScores ? 2 * this.baseRowHeight : this.baseRowHeight
    },
    heatWidth () {
      return this.showTotalScores ? 40 + this.baseHeatWidth : this.baseHeatWidth
    },
    internalWidth () {
      const nRounds = Array.from(this.roundHeats.keys()).length
      const res = this.addSymbolOffset + nRounds * (this.heatWidth + this.heatHorizontalSpacing) + this.heatHorizontalSpacing
      return res
    },
    internalHeight () {
      let res = 0
      this.roundHeats.forEach((heats, round) => {
        heats.forEach((heat) => {
          res = Math.max(
            res,
            this.roundRows.get(round) * this.rowHeight +
              (this.roundHeats.get(round).length + 1) * this.heatMinVerticalSpacing
          )
        })
      })
      return res
    },
    viewBox () {
      const ext2int = this.internalWidth / (this.width - this.marginLeft - this.marginRight)
      const ul = -this.marginLeft * ext2int
      const ur = -this.marginRight * ext2int
      const ll = this.internalWidth + (this.marginLeft + this.marginRight) * ext2int
      const lr = this.internalHeight + (this.marginTop + this.marginBottom) * ext2int
      return `${ul} ${ur} ${ll} ${lr}`
    },
    toAdvancementsMap () {
      const res = new Map()
      this.combined.advancements.forEach((adv) => {
        if (!res.has(adv.to_heat_id)) res.set(adv.to_heat_id, [])
        res.get(adv.to_heat_id).push(adv)
      })
      res.forEach((advs) => advs.sort(
        (a, b) => a.seed - b.seed
      ))
      return res
    },
    nParticipants () {
      // map: heat_id -> max(max_seed_in_link, max_seed_participations)
      const res = new Map()
      this.combined.heatsMap.forEach((heat) => {
        const advanced = (this.toAdvancementsMap.get(heat.id) || [])
        const maxAdv = Math.max(
          0,
          ...advanced.map((adv) => adv.seed + 1)
        )
        const part = (this.combined.participationsMap.get(heat.id) || [])
        const maxPart = Math.max(
          0,
          ...part.map((p) => p.seed + 1)
        )
        const nParticipants = Math.max(
          maxAdv,
          maxPart
        )
        res.set(heat.id, nParticipants)
      })
      return res
    },
    roundHeats () {
      const res = new Map()
      this.combined.heatsMap.forEach((heat) => {
        if (!res.has(heat.round)) res.set(heat.round, [])
        res.get(heat.round).push(heat)
      })
      // sort heats in round
      res.forEach(
        (heats) => heats.sort(
          (a, b) => a.number_in_round - b.number_in_round
        )
      )
      return res
    },
    roundRows () {
      // sum all numbers of participants for heats an each round
      const res = new Map()
      this.roundHeats.forEach((heats, round) => {
        res.set(round,
          heats
            .map((h) => this.nParticipants.get(h.id) || 0)
            .reduce((a, b) => a + b, 0)
        )
      })
      // collect heat data required for coordinate computation
      return res
    },
    heatCoordinates () {
      const nRounds = Array.from(this.roundHeats.keys()).length
      const res = new Map()
      Array.from(this.roundHeats.keys())
        .sort()
        .forEach((round, roundIdx) => {
          let rows = 0
          const verticalPadding = (this.internalHeight - this.roundRows.get(round) * this.rowHeight) /
            (this.roundHeats.get(round).length + 1)
          this.roundHeats.get(round)
            .sort((a, b) => a.number_in_round - b.number_in_round)
            .forEach((heat, heatIdx) => {
              const x = this.addSymbolOffset + this.heatHorizontalSpacing + (nRounds - roundIdx - 1) * (this.heatHorizontalSpacing + this.heatWidth)
              const y = heatIdx * verticalPadding + rows * this.rowHeight + verticalPadding
              res.set(heat.id, {
                roundIndex: roundIdx,
                numberInRoundIndex: heatIdx,
                rowsAbove: rows,
                targetX: x,
                targetY: y,
                x,
                y
              })
              // real coordinates can be computed with
              // x: x-offset(round) + (total_rounds - roundIndex - 1) * (x-spacing + heatWidth)
              // y: y-offset(round) + numberInRoundIndex * y-spacing + rowsAbove * slotHeight
              rows += this.nParticipants.get(heat.id) || 0
            })
        })
      return res
    },
    processedHeats () {
      // generate an map of heats consisting of
      // id, nParticipants, round, numberInRound
      const res = new Map()
      this.combined.heatsMap.forEach((heat) => {
        const procHeat = Object.assign({}, heat)
        procHeat.participations = this.combined.participationsMap.get(heat.id) || []
        procHeat.results = this.combined.resultsMap.get(heat.id) || []
        procHeat.nParticipants = this.nParticipants.get(heat.id) || 0
        procHeat.coordinates = this.heatCoordinates.get(heat.id)
        // out- and in-links to be fetched from processedTo/FromAdvancementsMap
        // because processedLinks depend on processedHeats for coordinates
        res.set(heat.id, procHeat)
      })
      return res
    },
    processedAdvancements () {
      // depends on processedHeats for coordinates

      // TODO: detect circles
      const _sourceCoords = (link) => {
        const s = this.processedHeats.get(link.from_heat_id)
        return [
          s.coordinates.targetX + this.heatWidth,
          s.coordinates.targetY + this.rowHeight * (0.5 + link.place)
        ]
      }
      const _targetCoords = (link) => {
        const t = this.processedHeats.get(link.to_heat_id)
        return [
          t.coordinates.targetX,
          t.coordinates.targetY + this.rowHeight * (0.5 + link.seed)
        ]
      }
      const res = []
      this.combined.advancements.forEach((adv) => {
        const link = Object.assign({}, adv)
        link.sourceCoordinates = _sourceCoords(adv)
        link.targetCoordinates = _targetCoords(adv)
        res.push(link)
      })
      return res
    }
  },
  mounted () {
    Promise.all([
      this.fetchHeats(),
      this.fetchResults(),
      this.fetchAdvancements(),
      this.fetchParticipations()
    ]).then(() => {
      this.initSvg()
      this.draw()
    })
    this.ws = new WebSocketClient({
      url: this.websocketUrl,
      channels: {
        results: (jsonMsg) => {
          const msg = JSON.parse(jsonMsg)
          if (!('heat_id' in msg)) return
          const heatId = parseInt(msg.heat_id)
          if (this.heatsMap.has(heatId)) {
            this.fetchResultsForHeat(heatId).then(() => {
              this.initSvg()
              this.draw()
            })
          }
        },
        advancements: () => {
          this.fetchAdvancements().then(() => {
            this.initSvg()
            this.draw()
          })
        },
        participants: (jsonMsg) => {
          const msg = JSON.parse(jsonMsg)
          if (!('heat_id' in msg)) return
          const heatId = parseInt(msg.heat_id)
          if (this.heatsMap.has(heatId)) {
            this.fetchParticipants().then(() => {
              this.initSvg()
              this.draw()
            })
          }
        }
      },
      name: 'HeatChart'
    })
  },
  methods: {
    initSvg () {
      if (this.d3Svg !== null) this.d3Svg.remove()
      this.d3Svg = d3
        .select(this.$el)
        .append('svg')
        .attr('viewBox', this.viewBox)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('class', 'heatchart')

      this.d3Heats = this.d3Svg
        .append('g')
        .attr('class', 'svg_heats')

      this.d3Links = this.d3Svg
        .append('g')
        .attr('class', 'svg_links')
    },
    refresh () {
      if ((this.heatsMap === null) || (this.resultsMap === null) || (this.participationsMap === null) || (this.advancements === null)) return
      this.combined = {
        heatsMap: this.heatsMap || new Map(),
        resultsMap: this.resultsMap || new Map(),
        participationsMap: this.participationsMap || new Map(),
        advancements: this.advancements || []
      }
    },
    fetchHeats () {
      return fetch(this.heatsUrl)
        .then(response => response.json())
        .then(data => {
          const res = new Map()
          data.forEach((heat) => res.set(heat.id, heat))
          this.heatsMap = res
          this.refresh()
        })
    },
    fetchAdvancements () {
      return fetch(this.advancementsUrl)
        .then(response => response.json())
        .then(data => {
          this.advancements = data
          this.refresh()
        })
    },
    fetchResults () {
      return fetch(this.resultsUrl)
        .then(response => response.json())
        .then(data => {
          const res = new Map()
          data.forEach((r) => {
            if (!res.has(r.heat_id)) res.set(r.heat_id, [])
            res.get(r.heat_id).push(r)
          })
          res.forEach((rs) => rs.sort(
            (a, b) => a.place - b.place
          ))
          this.resultsMap = res
          this.refresh()
        })
    },
    fetchParticipations () {
      return fetch(this.participationsUrl)
        .then(response => response.json())
        .then(data => {
          const res = new Map()
          data.forEach((part) => {
            if (!res.has(part.heat_id)) res.set(part.heat_id, [])
            res.get(part.heat_id).push(part)
          })
          res.forEach((parts) => parts.sort(
            (a, b) => a.seed - b.seed
          ))
          this.participationsMap = res
          this.refresh()
        })
    },
    fetchResultsForHeat (heatId) {
      return fetch(this.heatResultsUrl(heatId))
        .then(response => response.json())
        .then(data => {
          data.sort(
            (a, b) => a.place - b.place
          )
          this.resultsMap.set(heatId, data)
          this.refresh()
        })
    },
    heatResultsUrl (heatId) {
      return `http://localhost:8081/rest/heats/${heatId}/results`
    },
    draw () {
      // TODO: focus heat elem
      this.genD3GroupSelections()
      this.genD3GroupEnters()

      this.genHeatBoxes()
      this.genHeatSeeds()
      this.genHeatPlaces()
      this.genLinkPaths()

      this.initLinkHover()
    },
    genD3GroupSelections () {
      const heats = this.d3Heats
        .selectAll('.heat_node')
        .data(Array.from(this.processedHeats.values()), (d) => d.id)

      const links = this.d3Links
        .selectAll('.link')
        .data(Array.from(this.processedAdvancements.values()))

      this.d3GroupSelections = {
        heats,
        links
      }
    },
    genD3GroupEnters () {
      const heats = this.d3GroupSelections.heats
        .enter()
        .append('g')
        .attr('class', 'heat_node')
        .attr('data-heatid', (heat) => heat.id)
        .each((heatNode) => {
          heatNode.dragX = 0
          heatNode.dragY = 0
        })
        .attr('transform', (d) => `translate(${d.coordinates.x + d.dragX}, ${d.coordinates.y + d.dragY})`)

      const seeds = heats
        .selectAll('.heat_seed')
        .data((d) => d3.range(d.nParticipants)
          .map((seed) => ({
            heat: d,
            coordinates: {
              x: 0,
              y: seed * this.rowHeight
            },
            participant: d.participations.find((p) => p.seed === seed) || null,
            seed
          }))
        )
        .enter()
        .append('g')
        .attr('class', (d) => d.participant ? 'heat_seed with_participant' : 'heat_seed')
        .each((seedNode) => {
          // initialize new seed groups with correct position
          // these might be changed later upon drag
          seedNode.dragX = 0
          seedNode.dragY = 0
        })
        .attr('transform', (d) => `translate(${d.coordinates.x + d.dragX} ${d.coordinates.y + d.dragY})`)

      const scoreWidth = this.showTotalScores ? this.scoreWidthFactor * this.heatWidth : 0
      const places = heats
        .selectAll('.heat_place')
        .data((d) => d3.range(d.nParticipants)
          .map((place) => ({
            heat: d,
            coordinates: {
              x: (1.0 - this.placeWidthFactor) * this.heatWidth - scoreWidth,
              y: place * this.rowHeight
            },
            result: (d.results || []).find((r) => r.place === place) || null,
            place
          }))
        )
        .enter()
        .append('g')
        .attr('class', (d) => {
          const result = (d.heat.results || [])[d.place] || {}
          let place = d.place
          const showPlacing = true // TODO: false if this is a focus heat
          if (showPlacing && result.place) place = result.place // multiple surfers may have the same place
          switch (place) {
            case 0:
              return 'heat_place first'
            case 1:
              return 'heat_place second'
            case 2:
              return 'heat_place third'
            default:
              return 'heat_place'
          }
        })
        .attr('transform', (d) => `translate(${d.coordinates.x} ${d.coordinates.y})`)

      const links = this.d3GroupSelections.links
        .enter()
        .append('path')
        .attr('class', 'link')
        .each(function (d) {
          d.svg = this // this points to the svg path element (thus not using arrow notation)
        })

      this.d3GroupEnters = {
        heats,
        seeds,
        places,
        links
      }
    },
    genHeatBoxes () {
      this.d3GroupEnters.heats
        .append('rect')
        .attr('width', this.heatWidth)
        .attr('height', (heat) => this.rowHeight * heat.nParticipants)
        .lower() // place on top of group

      this.d3GroupEnters.heats
        .append('text')
        .attr('class', 'title')
        .attr('y', -5)
        .text((heat) => {
          let label = 'name' in heat ? heat.name : 'heat not available - deleted?'
          if (this.adminMode) label += `(number ${heat.number_in_round + 1})`
          if (heat.start_datetime) {
            const d = parseISOLocal(heat.start_datetime)
            label += ` (${d.toDateString().slice(0, 3)} ${d.toTimeString().slice(0, 5)})`
          }
          return label
        })
        .lower() // place on top of group
    },
    genHeatSeeds () {
      const seedWidthFactor = this.showTotalScores ? this.seedWidthFactor - this.scoreWidthFactor : this.seedWidthFactor
      const seedWidth = seedWidthFactor * this.heatWidth
      this.d3GroupEnters.seeds
        .append('rect')
        .attr('width', seedWidth)
        .attr('height', this.rowHeight)
        .attr('fill', (d) => {
          if (d.participant && d.participant.lycra_color.hex) {
            return lighten(d.participant.lycra_color.hex)
          } else {
            return 'white'
          }
        })

      this.d3GroupEnters.seeds
        .append('text')
        .attr('x', 0.5 * seedWidth)
        .attr('y', this.rowHeight * 2.0 / 3)
        .text((d) => {
          if (d.participant && d.participant.surfer) {
            const s = d.participant.surfer
            return `${s.first_name} ${s.last_name}`
          } else {
            return `Seed ${d.seed + 1}`
          }
        })
    },
    genHeatPlaces () {
      // names only half the total height to make space for individual scores, if applicable
      const rowHeight = this.showIndividualScores ? 0.5 * this.rowHeight : this.rowHeight
      const placeWidth = this.placeWidthFactor * this.heatWidth
      this.d3GroupEnters.places
        .append('rect')
        .attr('width', placeWidth)
        .attr('height', rowHeight)

      this.d3GroupEnters.places
        .append('text')
        .attr('x', 0.5 * placeWidth)
        .attr('y', rowHeight * 2.0 / 3)
        .text((d) => {
          // only show placings for not active heats (for an active heat, the placing is not fixed)
          const showPlacing = true // TODO: false if this is a focus heat
          if (d.result && showPlacing) {
            const s = d.result.surfer
            return `${s.first_name} ${s.last_name}`
          } else {
            return `${d.place + 1}. place`
          }
        })

      if (this.showTotalScores) {
        const scoreWidth = this.scoreWidthFactor * this.heatWidth
        const totalScoreGroup = this.d3GroupEnters.places
          .append('g')
          .attr('class', 'total_score')

        totalScoreGroup
          .append('rect')
          .attr('width', scoreWidth)
          .attr('height', this.rowHeight)
          .attr('x', placeWidth)

        totalScoreGroup
          .append('text')
          .attr('x', placeWidth + 0.5 * scoreWidth)
          .attr('y', this.rowHeight * 2.0 / 3)
          .text((d) => {
            let label = ''
            // only show placings for not active heats (for an active heat, the placing is not fixed)
            const showPlacing = true // _this.focus_heat_ids == null || typeof _this.focus_heat_ids === 'undefined' || _this.focus_heat_ids.indexOf(heat_id) < 0;
            if (d.result && showPlacing) {
              label = '' + d.result.total_score.toFixed(1)
            }
            return label
          })
      }

      if (this.showIndividualScores) {
        // individual scores
        const scoreGroup = this.d3GroupEnters.places
          .selectAll('.score')
          .data((d) => {
            const width = placeWidth / d.heat.number_of_waves

            // store the order of each wave score
            const waveScores = ((d.result || {}).wave_scores || [])
              .slice()
              .sort((a, b) => b.score - a.score)
            waveScores.forEach((d, i) => {
              d.scoreOrder = i
              d.hasVal = true
            })
            // reorder by wave number
            waveScores.sort((a, b) => a.wave - b.wave)

            const res = []
            for (var i = 0; i < d.heat.number_of_waves; i++) {
              let elem = {
                width: width,
                heatId: d.heat.id,
                coordinates: {
                  x: i * width,
                  y: rowHeight
                },
                hasVal: false
              }
              if (i < waveScores.length) elem = Object.assign(elem, waveScores[i])
              res.push(elem)
            }
            return res
          })
          .enter()
          .append('g')
          .attr('class', 'score')
          .attr('transform', (d) => `translate(${d.coordinates.x} ${d.coordinates.y})`)

        scoreGroup
          .append('rect')
          .attr('width', (d) => d.width)
          .attr('height', rowHeight)

        scoreGroup
          .append('text')
          .attr('x', (d) => 0.5 * d.width)
          .attr('y', rowHeight * 2.0 / 3)
          .attr('class', (d) => {
            if (d.scoreOrder < 2) {
              return 'best_score'
            } else {
              return ''
            }
          })
          .text((d) => {
            var showPlacing = true // _this.focus_heat_ids == null || typeof _this.focus_heat_ids === 'undefined' || _this.focus_heat_ids.indexOf(d["heat_id"]) < 0;
            if (showPlacing) {
              return d.hasVal ? d.score.toFixed(1) : ''
              // var val = d.score
              // if ('score' in d)
              //   val = val.toFixed(1)
              // else
              //   val = ''
              // return val;
            }
          })
      }
    },
    genLinkPaths () {
      this.d3GroupEnters.links
        .attr('d', (link) => this.linkPath(link.sourceCoordinates, link.targetCoordinates))
    },
    linkPath (p0, p1) {
      const curvature = 0.5
      const xi = d3.interpolateNumber(p0[0], p1[0])
      const x2 = xi(curvature)
      const x3 = xi(1 - curvature)
      return 'M' + p0[0] + ',' + p0[1] +
             'C' + x2 + ',' + p0[1] +
             ' ' + x3 + ',' + p1[1] +
             ' ' + p1[0] + ',' + p1[1]
    },
    initLinkHover () {
      this.d3Heats
        .selectAll('.heat_seed')
        .on('mouseover', (ev, d) => {
          this.d3Links.selectAll('.link')
            .filter((l) => ((d.heat.id === l.to_heat_id) && (d.seed === l.seed)))
            .classed('focus', true)
        })
        .on('mouseout', (ev, d) => {
          this.d3Links.selectAll('.link')
            .filter((l) => ((d.heat.id === l.to_heat_id) && (d.seed === l.seed)))
            .classed('focus', false)
        })
      this.d3Heats
        .selectAll('.heat_place')
        .on('mouseover', (ev, d) => {
          this.d3Links.selectAll('.link')
            .filter((l) => ((d.heat.id === l.from_heat_id) && (d.place === l.place)))
            .classed('focus', true)
        })
        .on('mouseout', (ev, d) => {
          this.d3Links.selectAll('.link')
            .filter((l) => ((d.heat.id === l.from_heat_id) && (d.place === l.place)))
            .classed('focus', false)
        })
    }
  }
}
</script>

<style lang="stylus" scoped>

div
  overflow auto

// heat boxes
div >>> .heat_node > rect
  fill grey

div >>> .heat_node text
  font 10px sans-serif

div >>> .heat_node text.title
  font-weight bold

// participant names
div >>> .heat_seed text
  text-anchor middle
  alignment-baseline middle

div >>> .heat_place rect
  fill white

div >>> .heat_place.first rect
  fill gold

div >>> .heat_place.second rect
  fill silver

div >>> .heat_place.third rect
  fill #cd7f32

div >>> .heat_place text
  text-anchor middle
  alignment-baseline middle

div >>> .heat_place > .score > rect
  stroke-width 1px
  stroke #cccccc

div >>> .heat_place > .score > text
    font-size 8px
    font-stretch ultra-condensed

div >>> .heat_place > .total_score > rect
  stroke-width 1px
  stroke #cccccc

div >>> .heat_place > .total_score > text
  font-weight bold

div >>> .heat_place > .score > text.best_score
  font-weight bold

div >>> .link
  fill none
  stroke #cccccc
  stroke-width 1px

div >>> .link.focus
  stroke #000000
  stroke-width 1.5px
</style>
