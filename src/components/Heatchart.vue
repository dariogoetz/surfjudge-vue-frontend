<template>
  <div id="heatchart" />
</template>

<script>
import * as d3 from 'd3'
import parseISOLocal from '../utils/parse_local_date'

export default {
  props: {
    category: { type: Object, default: null },

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
      d3GroupEnters: {}
    }
  },
  computed: {
    width () {
      if (this.targetWidth === null) return this.scalingFactor * this.internalWidth
      else return Math.floor(Math.min(this.targetWidth, this.scalingFactor * this.internalWidth)) - 5
    },
    internalWidth () {
      const nRounds = Array.from(this.roundHeats.keys()).length
      const res = this.addSymbolOffset + nRounds * (this.heatWidth + this.heatHorizontalSpacing) + this.heatHorizontalSpacing
      console.debug(res)
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
      console.debug(res)
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
          let slots = 0
          const verticalPadding = (this.internalHeight - this.roundRows.get(round) * this.rowHeight) /
            (this.roundHeats.get(round).length + 1)
          this.roundHeats.get(round)
            .sort((a, b) => a.number_in_round - b.number_in_round)
            .forEach((heat, heatIdx) => {
              const x = this.addSymbolOffset + (nRounds - roundIdx - 1) * (this.heatHorizontalSpacing + this.heatWidth)
              const y = heatIdx * verticalPadding + slots * this.rowHeight + verticalPadding
              res.set(heat.id, {
                roundIndex: roundIdx,
                numberInRoundIndex: heatIdx,
                rowsAbove: slots,
                targetX: x,
                targetY: y,
                x,
                y
              })
              // real coordinates can be computed with
              // x: x-offset(round) + (total_rounds - roundIndex - 1) * (x-spacing + heatWidth)
              // y: y-offset(round) + numberInRoundIndex * y-spacing + rowsAbove * slotHeight
              slots += this.nParticipants.get(heat.id) || 0
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
      console.debug('compute processedLinks')
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
          t.coordinates.targetX + this.heatWidth,
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
    },
    processedToAdvancementsMap () {
      console.debug('compute processedToAdvancementsMap')
      const res = new Map()
      this.processedAdvancements.forEach((adv) => {
        if (!res.has(adv.to_heat_id)) res.set(adv.to_heat_id, [])
        res.get(adv.to_heat_id).push(adv)
      })
      res.forEach((advs) => advs.sort(
        (a, b) => a.seed - b.seed
      ))
      return res
    },
    processedFromAdvancementsMap () {
      console.debug('compute processedFromAdvancementsMap')
      const res = new Map()
      this.processedAdvancements.forEach((adv) => {
        if (!res.has(adv.from_heat_id)) res.set(adv.from_heat_id, [])
        res.get(adv.from_heat_id).push(adv)
      })
      res.forEach((advs) => advs.sort(
        (a, b) => a.seed - b.seed
      ))
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
      console.debug('fetched all')
      console.debug(this.processedHeats)
      console.debug(this.processedAdvancements)
      console.debug(this.processedToAdvancementsMap)
      this.initSvg()
      this.drawHeats()
      this.positionDraggables()
    })
  },
  methods: {
    initSvg () {
      this.d3Svg = d3
        .select('#heatchart')
        .append('svg')
        .attr('viewBox', this.viewBox)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('width', this.width)
        .attr('height', this.width * (this.internalHeight / this.internalWidth) || 0)
        .attr('class', 'heatchart')
    },
    fetchHeats () {
      return fetch('http://localhost:8081/rest/categories/1/heats')
        .then(response => response.json())
        .then(data => { this.heats = data })
    },
    fetchAdvancements () {
      return fetch('http://localhost:8081/rest/categories/1/advancements')
        .then(response => response.json())
        .then(data => { this.advancements = data })
    },
    fetchResults () {
      return fetch('http://localhost:8081/rest/categories/1/results')
        .then(response => response.json())
        .then(data => { this.results = data })
    },
    fetchParticipations () {
      return fetch('http://localhost:8081/rest/categories/1/participations')
        .then(response => response.json())
        .then(data => { this.participations = data })
    },
    drawHeats () {
      this.d3Heats = this.d3Svg
        .append('g')
        .attr('class', 'svg_heats')

      // TODO: focus heat elem
      this.genD3GroupEnters()
      this.genHeatBoxes()
      this.genHeatSeeds()
    },
    drawLinks () {},
    positionDraggables () {
      this.d3Heats
        .selectAll('.heat_node')
        .attr('transform', (d) => `translate(${d.coordinates.x + d.dragX}, ${d.coordinates.y + d.dragY})`)

      // update ALL seed nodes (enter and existing)
      this.d3Heats
        .selectAll('.heat_seed')
        .attr('transform', (d) => `translate(${d.x + d.dragX} ${d.y + d.dragY})`)
    },
    genD3GroupEnters () {
      const heats = this.d3Heats
        .selectAll('.heat_node')
        .data(Array.from(this.processedHeats.values()), (d) => d.id)
        .enter()
        .append('g')
        .attr('class', 'heat_node')
        .attr('data-heatid', (node) => node.id)
        .each((heatNode) => {
          heatNode.dragX = 0
          heatNode.dragY = 0
        })

      const seeds = heats
        .selectAll('.heat_seed')
        .data((d) => d3.range(d.nParticipants)
          .map((seed) => ({
            node: d,
            seed: seed,
            participant: d.participations.find((p) => p.seed === seed) || null
          }))
        )
        .enter()
        .append('g')
        .each((seedNode) => {
          // initialize new seed groups with correct position
          // these might be changed later upon drag
          // TODO: why not in selection data?
          seedNode.x = 0
          seedNode.y = seedNode.seed * this.rowHeight
          seedNode.dragX = 0
          seedNode.dragY = 0
        })
        .attr('class', (d) => d.participant ? 'heat_seed with_participant' : 'heat_seed')

      this.d3GroupEnters = {
        heats,
        seeds
      }
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
      this.d3GroupEnters.seeds
        .append('rect')
        .attr('width', this.heatWidth) // TODO: seed_width_factor
        .attr('height', this.rowHeight)
    }
  }
}
</script>

<style lang="stylus" scoped>
div >>> .heat_node > rect
  fill grey

div >>> .heat_seed > rect
  fill None
  stroke black
</style>
