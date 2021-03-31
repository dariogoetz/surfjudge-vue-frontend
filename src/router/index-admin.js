import Vue from 'vue'
import VueRouter from 'vue-router'

import Index from '../pages-admin/Index.vue'
import Results from '../pages/Results.vue'
import LiveResults from '../pages/LiveResults.vue'
import Heatcharts from '../pages/Heatcharts.vue'
import Admin from '../pages-admin/Admin.vue'
import JudgePanel from '../pages-judging/JudgePanel.vue'

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
      { path: 'admin', component: Admin },
      { path: 'judge_panel', component: JudgePanel }
    ]
  }
]

export default new VueRouter({
  routes
})
