import { Meteor } from 'meteor/meteor';
import { createRouter, createWebHistory } from 'vue-router';
import Home from './Home.vue';

const { pathname } = new URL(Meteor.absoluteUrl(''));


export const router = createRouter({
  history: createWebHistory(pathname),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/links-composition',
      name: 'links-composition',
      component: () => import('./LinksComposition.vue'),
    },
    {
      path: '/links-option',
      name: 'links-option',
      component: () => import('./LinksOption.vue'),
    },
  ],
})
