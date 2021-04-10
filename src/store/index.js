import Vue from 'vue'
import Vuex from 'vuex'

import Auth from './auth.js'
import Config from './config.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: () => ({
    baseUrl: __API_PATH__ // is defined in webpack config
  }),
  getters: {
    configUrl: state => `${state.baseUrl}/config`
  },
  modules: {
    auth: Auth,
    config: Config
  }
})
