<template>
  <div>
    <span>Heatcharts</span>
    <heatchart
      :category-id="1"
    />
  </div>
</template>

<script>
import Heatchart from '../components/Heatchart.vue'

export default {
  components: {
    Heatchart
  },
  props: {
    tournament: {
      type: Object,
      default: null
    }
  }
}
</script>
