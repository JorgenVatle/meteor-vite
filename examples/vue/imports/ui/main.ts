import './main.css';
import { check } from 'meteor/check';

import { Meteor } from 'meteor/meteor';
import { MEOWMEOW } from 'meteor/test:lazy';
import { createApp } from 'vue';
import { WrapConsole } from '../api/logger';
import App from './App.vue';
import { router } from './router';
import { VueMeteor } from './v-meteor';
import './tests/ts-modules.test';

console.log('lazy meteor package:', MEOWMEOW)
console.log(check)

Meteor.startup(() => {
  const app = createApp(App);
  app.use(router)
  app.use(VueMeteor)
  app.mount('#app');
  
  WrapConsole();
  Promise.all([
    import('./tests/ts-modules.test'),
    import('./tests/meteor.test'),
    import('./tests/stub-validation'),
    import('./tests/duplicate-npm-dependencies'),
  ]).catch((error) => {
    console.error('Error importing test module!', error);
    return [];
  }).then((tests) => {
    return tests.map((test) => test.default());
  });
})
