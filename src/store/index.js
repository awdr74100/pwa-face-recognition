import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: process.env.NODE_ENV === 'development',
  state: {
    isLoading: false,
    loadingStatus: '',
  },
  mutations: {
    ISLOADING(state, status) {
      state.isLoading = status;
    },
    SETLOADINGSTATUS(state, status) {
      state.loadingStatus = status;
    },
  },
});
