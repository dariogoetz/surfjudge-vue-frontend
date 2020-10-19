import Vue from 'vue'
import VueRouter from 'vue-router'
import IndexPage from '../pages/IndexPage.vue'

Vue.use(VueRouter)

const routes = [
  { path: '*', component: IndexPage }
]

export default new VueRouter({
  routes
})
