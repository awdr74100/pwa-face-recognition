import Vue from 'vue';
import VueRouter from 'vue-router';
import Camera from '../views/Camera.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Camera',
    component: Camera,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
