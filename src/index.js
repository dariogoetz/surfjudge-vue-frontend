import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import {
  LayoutPlugin,
  CardPlugin,
  DropdownPlugin,
  TablePlugin,
  NavbarPlugin,
  NavPlugin,
  LinkPlugin,
  IconsPlugin,
  ButtonPlugin,
  ButtonGroupPlugin,
  FormPlugin,
  FormGroupPlugin,
  FormInputPlugin,
  InputGroupPlugin,
  AvatarPlugin,
  JumbotronPlugin
} from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.min.css'
import '../assets/css/app.styl'

Vue.use(LayoutPlugin)
Vue.use(CardPlugin)
Vue.use(DropdownPlugin)
Vue.use(TablePlugin)
Vue.use(NavbarPlugin)
Vue.use(NavPlugin)
Vue.use(LinkPlugin)
Vue.use(ButtonPlugin)
Vue.use(ButtonGroupPlugin)
Vue.use(FormPlugin)
Vue.use(FormGroupPlugin)
Vue.use(FormInputPlugin)
Vue.use(InputGroupPlugin)
Vue.use(IconsPlugin)
Vue.use(AvatarPlugin)
Vue.use(JumbotronPlugin)

/* eslint-disable-next-line no-new */
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
