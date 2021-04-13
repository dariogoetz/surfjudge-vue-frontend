<template>
  <div>
    <b-overlay :show="showOverlay" variant="dark">
      <div v-if="loggedIn">
        <b-avatar /><span class="mr-auto">&nbsp;{{ user.username }}</span>
        <b-button @click="logout" variant="secondary">Logout</b-button>
      </div>
      <b-form
        v-if="!loggedIn && initialized"
        inline
        @submit="login">
        <b-input-group class="mb-2 mr-sm-2 mb-sm-0">
          <b-input-group-prepend is-text><b-icon-person /></b-input-group-prepend>
          <b-form-input v-model="username" placeholder="Username" />
          <b-input-group-prepend is-text><b-icon-key /></b-input-group-prepend>
          <b-form-input v-model="password" type="password" placeholder="Password" />
          <b-input-group-append><b-button type="submit" variant="secondary">Login</b-button></b-input-group-append>
        </b-input-group>
      </b-form>
    </b-overlay>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
  },
  data () {
    return {
      initialized: false,
      user: null,
      username: '',
      password: '',
      showOverlay: false
    }
  },
  computed: {
    meUrl () { return `${this.authApiUrl}/me` },
    loginUrl () { return `${this.authApiUrl}/login` },
    logoutUrl () { return `${this.authApiUrl}/logout` },
    loggedIn () { return this.user !== null },
    ...mapGetters(['authApiUrl', 'requestLogout'])
  },
  watch: {
    requestLogout (newVal) {
      if (!newVal) return
      this.logout()
      this.$store.commit('resetLogoutRequest')
    }
  },
  created () {
    // fetch meUrl into this.user
    fetch(this.meUrl, {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        this.$store.commit('setAuthentication', data)
        this.user = data
        this.initialized = true
      })
  },
  methods: {
    login (event) {
      event.preventDefault()
      this.showOverlay = true
      fetch(this.loginUrl, {
        method: 'POST',
        body: JSON.stringify({ username: this.username, password: this.password }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
        .then(response => {
          this.showOverlay = false
          if (!response.ok) {
            this.$bvToast.toast('Login failed', {
              title: 'Message',
              autoHideDelay: 2000,
              appendToast: true,
              variant: 'danger',
              solid: true
            })
          }
          return response.json()
        })
        .then(data => {
          this.$store.commit('setAuthentication', data)
          this.user = data
          this.username = ''
          this.password = ''
        })
    },
    logout () {
      this.showOverlay = true
      fetch(this.logoutUrl, {
        method: 'POST',
        credentials: 'include'
      })
        .then(response => {
          this.showOverlay = false
          if (!response.ok) {
            this.$bvToast.toast('Logout failed', {
              title: 'Message',
              autoHideDelay: 2000,
              appendToast: true,
              variant: 'danger',
              solid: true
            })
          }
          return response.json()
        })
        .then(data => {
          this.$store.commit('setAuthentication', null)
          this.user = null
          this.username = ''
          this.password = ''
        })
    }
  }
}
</script>
