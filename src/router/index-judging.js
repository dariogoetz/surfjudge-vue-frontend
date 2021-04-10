import Vue from 'vue'
import VueRouter from 'vue-router'
import Index from '../pages-judging/Index.vue'
import JudgePanel from '../pages-judging/JudgePanel.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Index,
    children: [
      { path: '', component: JudgePanel }
    ]
  }
]

export default new VueRouter({
  routes
})
