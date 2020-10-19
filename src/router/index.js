import Vue from 'vue'
import VueRouter from 'vue-router'
import Index from '../pages/Index.vue'
import HelloComponent from '../components/HelloComponent.vue'
import Results from '../pages/Results.vue'
import LiveResults from '../pages/LiveResults.vue'
import Heatcharts from '../pages/Heatcharts.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Index,
    children: [
      { path: '', component: HelloComponent },
      { path: 'live_results', component: LiveResults },
      { path: 'heatcharts', component: Heatcharts },
      { path: 'results', component: Results }
    ]
  }
]

export default new VueRouter({
  routes
})
