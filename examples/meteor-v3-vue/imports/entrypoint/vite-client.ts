import { createApp } from 'vue';
import AppComponent from '../ui/App.vue';
import '../ui/App.css';

const App = createApp(AppComponent);

App.mount('#vue-app');