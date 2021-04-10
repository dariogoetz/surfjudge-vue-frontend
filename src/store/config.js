const state = () => ({
  config: null
})

const mutations = {
  setConfig (state, config) {
    state.config = config
  }
}

const getters = {
  initialized: state => state.config !== null,
  publicApiUrl: (state, getters, rootState) => {
    if (state.config === null || state.config.public_path === null) return null
    return `${rootState.baseUrl}${state.config.public_path}`
  },
  authApiUrl: (state, getters, rootState) => {
    if (state.config === null || state.config.auth_path === null) return null
    return `${rootState.baseUrl}${state.config.auth_path}`
  },
  judgingApiUrl: (state, getters, rootState) => {
    if (state.config === null || state.config.judging_path === null) return null
    return `${rootState.baseUrl}${state.config.judging_path}`
  },
  adminApiUrl: (state, getters, rootState) => {
    if (state.config === null || state.config.admin_path === null) return null
    return `${rootState.baseUrl}${state.config.admin_path}`
  }
}

export default {
  mutations,
  state,
  getters
}
