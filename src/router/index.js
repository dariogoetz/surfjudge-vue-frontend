import Vue from 'vue'
import VueRouter from 'vue-router'
import Index from '../pages/Index.vue'

// import routes lazily
// const Results = () => import('../pages/Results.vue')
// const LiveResults = () => import('../pages/LiveResults.vue')
// const Heatcharts = () => import('../pages/Heatcharts.vue')
import Results from '../pages/Results.vue'
import LiveResults from '../pages/LiveResults.vue'
import Heatcharts from '../pages/Heatcharts.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Index,
    props: { apiUrl: __API_PATH__ }, // is defined in webpack config
    children: [
      { path: '', component: LiveResults },
      { path: 'live_results', component: LiveResults },
      { path: 'heatcharts', component: Heatcharts },
      { path: 'results', component: Results }
    ]
  }
]

export default new VueRouter({
  routes
})
