import './assets/css/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { setupCalendar } from 'v-calendar';

import {createPinia} from 'pinia';
const pinia = createPinia();

//createApp(App).mount('#app')
createApp(App)
.use(pinia)
.use(router)
.use(setupCalendar, {
    locale: 'zh-TW',
})
.mount('#app')