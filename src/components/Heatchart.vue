<template>
  <div />
</template>

<script>
import * as d3 from 'd3'
import parseISOLocal from '../utils/parse_local_date'
import { lighten } from '../utils/lighten_darken_color'

export default {
  props: {
    categoryId: { type: Number, required: true },

    showIndividualScores: { type: Boolean, default: false },
    showTotalScores: { type: Boolean, default: false },

    targetWidth: { type: Number, default: null },
    scalingFactor: { type: Number, default: 1.25 },
    marginTop: { type: Number, default: 0 },
    marginBottom: { type: Number, default: 0 },
    marginLeft: { type: Number, default: 0 },
    marginRight: { type: Number, default: 0 },

    heatWidth: { type: Number, default: 280 },
    heatMinVerticalSpacing: { type: Number, default: 50 },
    heatHorizontalSpacing: { type: Number, default: 100 },
    rowHeight: { type: Number, default: 18 },
    seedWidthFactor: { type: Number, default: 0.475 },
    placeWidthFactor: { type: Number, default: 0.475 },
    scoreWidthFactor: { type: Number, default: 0.1 },

    addSymbolOffset: { type: Number, default: 0 }

  },
  data () {
    return {
      heats: null, // array
      advancements: null, // array
      participations: null, // array
      results: null,
      d3Svg: null,
      d3Heats: null,
      d3Links: null,
      d3GroupSelections: {},
      d3GroupEnters: {}
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
    internalWidth () {
      console.debug('compute internalWidth')
      const nRounds = Array.from(this.roundHeats.keys()).length
      const res = this.addSymbolOffset + nRounds * (this.heatWidth + this.heatHorizontalSpacing) + this.heatHorizontalSpacing
      return res
    },
    internalHeight () {
      console.debug('compute internalHeight')
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
      console.debug('compute viewBox')
      const ext2int = this.internalWidth / (this.width - this.marginLeft - this.marginRight)
      const ul = -this.marginLeft * ext2int
      const ur = -this.marginRight * ext2int
      const ll = this.internalWidth + (this.marginLeft + this.marginRight) * ext2int
      const lr = this.internalHeight + (this.marginTop + this.marginBottom) * ext2int
      return `${ul} ${ur} ${ll} ${lr}`
    },
    heatsMap () {
      console.debug('compute heatsMap')
      if (this.heats === null) return new Map()
      const res = new Map()
      this.heats.forEach((heat) => res.set(heat.id, heat))
      return res
    },
    resultsMap () {
      console.debug('compute resultsMap')
      if (this.results === null) return new Map()
      const res = new Map()
      this.results.forEach((r) => {
        if (!res.has(r.heat_id)) res.set(r.heat_id, [])
        res.get(r.heat_id).push(r)
      })
      res.forEach((rs) => rs.sort(
        (a, b) => a.place - b.place
      ))
      return res
    },
    participationsMap () {
      console.debug('compute participationsMap')
      if (this.participations === null) return new Map()
      const res = new Map()
      this.participations.forEach((part) => {
        if (!res.has(part.heat_id)) res.set(part.heat_id, [])
        res.get(part.heat_id).push(part)
      })
      res.forEach((parts) => parts.sort(
        (a, b) => a.seed - b.seed
      ))
      return res
    },
    toAdvancementsMap () {
      console.debug('compute toAdvancementsMap')
      const res = new Map()
      this.advancements.forEach((adv) => {
        if (!res.has(adv.to_heat_id)) res.set(adv.to_heat_id, [])
        res.get(adv.to_heat_id).push(adv)
      })
      res.forEach((advs) => advs.sort(
        (a, b) => a.seed - b.seed
      ))
      return res
    },
    fromAdvancementsMap () {
      console.debug('compute fromAdvancementsMap')
      const res = new Map()
      this.advancements.forEach((adv) => {
        if (!res.has(adv.from_heat_id)) res.set(adv.from_heat_id, [])
        res.get(adv.from_heat_id).push(adv)
      })
      res.forEach((advs) => advs.sort(
        (a, b) => a.seed - b.seed
      ))
      return res
    },
    nParticipants () {
      if (this.heats === null) return new Map()
      if (this.participations === null) return new Map()
      if (this.advancements === null) return new Map()

      console.debug('compute nParticipants')
      // map: heat_id -> max(max_seed_in_link, max_seed_participations)
      const res = new Map()
      this.heats.forEach((heat) => {
        const advanced = (this.toAdvancementsMap.get(heat.id) || [])
        const maxAdv = Math.max(
          0,
          ...advanced.map((adv) => adv.seed + 1)
        )
        const part = (this.participationsMap.get(heat.id) || [])
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
      console.debug('compute round2Heats')
      if (this.heats === null) return new Map()
      const res = new Map()
      this.heats.forEach((heat) => {
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
      console.debug('compute round2Slots')
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
      console.debug('compute heatCoordinates')
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
      if (this.heats === null) return new Map()
      console.debug('compute processedHeats')
      // generate an map of heats consisting of
      // id, nParticipants, round, numberInRound
      const res = new Map()
      this.heats.forEach((heat) => {
        const procHeat = Object.assign({}, heat)
        procHeat.participations = this.participationsMap.get(heat.id) || []
        procHeat.results = this.resultsMap.get(heat.id) || []
        procHeat.nParticipants = this.nParticipants.get(heat.id) || 0
        procHeat.coordinates = this.heatCoordinates.get(heat.id)
        // out- and in-links to be fetched from processedTo/FromAdvancementsMap
        // because processedLinks depend on processedHeats for coordinates
        res.set(heat.id, procHeat)
      })
      return res
    },
    processedAdvancements () {
      if (this.advancements === null) return []
      console.debug('compute processedAdvancements')
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
      this.advancements.forEach((adv) => {
        const link = Object.assign({}, adv)
        link.sourceCoordinates = _sourceCoords(adv)
        link.targetCoordinates = _targetCoords(adv)
        res.push(link)
      })
      return res
    } // ,
    // processedToAdvancementsMap () {
    //   console.debug('compute processedToAdvancementsMap')
    //   const res = new Map()
    //   this.processedAdvancements.forEach((adv) => {
    //     if (!res.has(adv.to_heat_id)) res.set(adv.to_heat_id, [])
    //     res.get(adv.to_heat_id).push(adv)
    //   })
    //   res.forEach((advs) => advs.sort(
    //     (a, b) => a.seed - b.seed
    //   ))
    //   return res
    // },
    // processedFromAdvancementsMap () {
    //   console.debug('compute processedFromAdvancementsMap')
    //   const res = new Map()
    //   this.processedAdvancements.forEach((adv) => {
    //     if (!res.has(adv.from_heat_id)) res.set(adv.from_heat_id, [])
    //     res.get(adv.from_heat_id).push(adv)
    //   })
    //   res.forEach((advs) => advs.sort(
    //     (a, b) => a.seed - b.seed
    //   ))
    //   return res
    // }
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
  },
  methods: {
    initSvg () {
      this.d3Svg = d3
        .select(this.$el)
        .append('svg')
        .attr('viewBox', this.viewBox)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('width', this.width)
        .attr('height', this.width * (this.internalHeight / this.internalWidth) || 0)
        .attr('class', 'heatchart')

      this.d3Heats = this.d3Svg
        .append('g')
        .attr('class', 'svg_heats')

      this.d3Links = this.d3Svg
        .append('g')
        .attr('class', 'svg_links')
    },
    fetchHeats () {
      return fetch(this.heatsUrl)
        .then(response => response.json())
        .then(data => { this.heats = data })
    },
    fetchAdvancements () {
      return fetch(this.advancementsUrl)
        .then(response => response.json())
        .then(data => { this.advancements = data })
    },
    fetchResults () {
      return fetch(this.resultsUrl)
        .then(response => response.json())
        .then(data => { this.results = data })
    },
    fetchParticipations () {
      return fetch(this.participationsUrl)
        .then(response => response.json())
        .then(data => { this.participations = data })
    },
    draw () {
      // TODO: focus heat elem
      this.genD3GroupSelections()
      this.genD3GroupEnters()
      this.genD3GroupExits()

      this.genHeatBoxes()
      this.genHeatSeeds()
      this.genHeatPlaces()
      this.genLinkPaths()
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
        .attr('data-heatid', (node) => node.id)
        .each((heatNode) => {
          heatNode.dragX = 0
          heatNode.dragY = 0
        })
        .attr('transform', (d) => `translate(${d.coordinates.x + d.dragX}, ${d.coordinates.y + d.dragY})`)

      const seeds = heats
        .selectAll('.heat_seed')
        .data((d) => d3.range(d.nParticipants)
          .map((seed) => ({
            node: d,
            seed,
            participant: d.participations.find((p) => p.seed === seed) || null,
            x: 0,
            y: seed * this.rowHeight
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
        .attr('transform', (d) => `translate(${d.x + d.dragX} ${d.y + d.dragY})`)

      const scoreWidth = this.showTotalScores ? this.scoreWidthFactor * this.heatWidth : 0
      const places = heats
        .selectAll('.heat_place')
        .data((d) => d3.range(d.nParticipants)
          .map((place) => ({
            node: d,
            place
          }))
        )
        .enter()
        .append('g')
        .attr('class', (d) => {
          const result = (d.node.results || [])[d.place] || {}
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
        .attr('transform', (d) => `translate(${(1.0 - this.placeWidthFactor) * this.heatWidth - scoreWidth} ${d.place * this.rowHeight})`)

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
    genD3GroupExits () {
      this.d3GroupSelections.heats
        .exit()
        .remove()

      this.d3GroupSelections.links
        .exit()
        .remove()
    },
    genHeatBoxes () {
      this.d3GroupEnters.heats
        .append('rect')
        .attr('width', this.heatWidth)
        .attr('height', (node) => this.rowHeight * node.nParticipants)
        .lower() // place on top of group

      this.d3GroupEnters.heats
        .append('text')
        .attr('class', 'title')
        .attr('y', -5)
        .text((node) => {
          let label = 'name' in node ? node.name : 'heat not available - deleted?'
          if (this.adminMode) label += `(number ${node.number_in_round + 1})`
          if (node.start_datetime) {
            const d = parseISOLocal(node.start_datetime)
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
        .attr('y', this.rowHeight * 1.95 / 3)
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
        .attr('y', rowHeight * 1.95 / 3)
        .text((d) => {
          const result = (d.node.results || []).find((r) => r.place === d.place)
          // only show placings for not active heats (for an active heat, the placing is not fixed)
          const showPlacing = true // TODO: false if this is a focus heat
          if (result && showPlacing) {
            const s = result.surfer
            return `${s.first_name} ${s.last_name}`
          } else {
            return `${d.place + 1}. place`
          }
        })
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
div >>> .heat_seed > text
  text-anchor middle
  alignment-baseline middle

div >>> .heat_place > rect
  fill white

div >>> .heat_place.first > rect
  fill gold

div >>> .heat_place.second > rect
  fill silver

div >>> .heat_place.third > rect
  fill #cd7f32

div >>> .heat_place > text
  text-anchor middle
  alignment-baseline middle

div >>> .link
  fill none
  stroke #cccccc
  stroke-width 1px
</style>
