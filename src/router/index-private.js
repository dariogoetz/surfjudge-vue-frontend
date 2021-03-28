import Vue from 'vue'
import VueRouter from 'vue-router'
import Index from '../pages-private/Index.vue'

// import routes lazily
// const Results = () => import('../pages/Results.vue')
// const LiveResults = () => import('../pages/LiveResults.vue')
// const Heatcharts = () => import('../pages/Heatcharts.vue')
import Results from '../pages-private/Results.vue'
import LiveResults from '../pages-private/LiveResults.vue'
import Heatcharts from '../pages-private/Heatcharts.vue'
import Admin from '../pages-private/Admin.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Index,
    props: { baseUrl: __API_PATH__ }, // is defined in webpack config
    children: [
      { path: '', component: LiveResults },
      { path: 'live_results', component: LiveResults },
      { path: 'heatcharts', component: Heatcharts },
      { path: 'results', component: Results },
      { path: 'admin', component: Admin }
    ]
  }
]

export default new VueRouter({
  routes
})
