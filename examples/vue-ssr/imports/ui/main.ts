import { Meteor } from 'meteor/meteor';
import { createSSRApp } from 'vue';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';

import App from './App.vue';
import { routes } from './router';

export function createApp() {
  const { pathname } = new URL(Meteor.absoluteUrl(''));
  let history = createMemoryHistory(pathname);
  
  if (Meteor.isClient) {
    history = createWebHistory(pathname);
  }
  
  const app = createSSRApp(App);
  const router = createRouter({ history, routes });
  
  app.use(router);
  
  return { app, router };
}