import { type RouteRecordRaw } from 'vue-router';
import Links from './pages/Links.vue';
import About from './pages/About.vue';
import Home from './pages/Home.vue';

export const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/about',
    name: 'about',
    component: About,
  },
  {
    path: '/links',
    name: 'links',
    component: Links,
  }
] satisfies RouteRecordRaw[];
