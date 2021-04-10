const state = () => ({
  authenticatedUser: null,
  requestLogout: false
})

const mutations = {
  setAuthentication (state, authenticatedUser) {
    state.authenticatedUser = authenticatedUser
  },
  requestLogout (state) {
    console.log('logout request received')
    state.requestLogout = true
  },
  resetLogoutRequest (state) {
    state.requestLogout = false
  }
}

const getters = {
  authenticated: state => state.authenticatedUser !== null,
  isAdmin: (state, getters) => getters.authenticated && state.authenticatedUser.permissions.includes('ac_admin'),
  authenticatedUser: state => state.authenticatedUser,
  requestLogout: state => state.requestLogout
}

export default {
  mutations,
  state,
  getters
}
