import { Meteor } from 'meteor/meteor'
import { createSSRApp } from 'vue';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';

import App from './App.vue'
import { routes } from './router';

export function createApp() {
  let history = createMemoryHistory();
  
  if (Meteor.isClient) {
    history = createWebHistory();
  }
  
  const app = createSSRApp(App);
  const router = createRouter({ history, routes });
  
  app.use(router);
  
  return { app, router };
}