import Vue from 'vue';
import { rtdbPlugin } from 'vuefire';
import { WebCam } from 'vue-web-cam';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';

Vue.component('vue-web-cam', WebCam);
Vue.component('loading', Loading);

Vue.use(rtdbPlugin);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
