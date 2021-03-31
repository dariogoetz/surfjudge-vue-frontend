<template>
  <div>
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
  </div>
</template>

<script>
export default {
  props: {
    apiUrl: { type: String, default: '' }
  },
  data () {
    return {
      initialized: false,
      user: null,
      username: '',
      password: ''
    }
  },
  computed: {
    meUrl () { return `${this.apiUrl}/me` },
    loginUrl () { return `${this.apiUrl}/login` },
    logoutUrl () { return `${this.apiUrl}/logout` },
    loggedIn () { return this.user !== null }
  },
  watch: {
  },
  created () {
    // fetch meUrl into this.user
    fetch(this.meUrl, {
      credentials: 'include' // for CORS in dev setup
    })
      .then(response => response.json())
      .then(data => {
        this.$emit('authenticated', data)
        this.user = data
        this.initialized = true
      })
  },
  methods: {
    login (event) {
      event.preventDefault()
      fetch(this.loginUrl, {
        method: 'POST',
        body: JSON.stringify({ username: this.username, password: this.password }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => {
          if (!response.ok) {
            console.log(response.statusText)
          }
          return response.json()
        })
        .then(data => {
          this.$emit('authenticated', data)
          this.user = data
          this.username = ''
          this.password = ''
        })
    },
    logout () {
      fetch(this.logoutUrl, {
        method: 'POST',
        credentials: 'include' // for CORS in dev setup
      })
        .then(response => {
          this.$emit('authenticated', null)
          this.user = null
          this.username = ''
          this.password = ''
          if (!response.ok) {
            console.log(response.statusText)
          }
          return response.json()
        })
    }
  }
}
</script>
