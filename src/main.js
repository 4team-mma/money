
import { createApp } from 'vue'
import { setupCalendar } from 'v-calendar';
import {createPinia} from 'pinia';
import App from './App.vue'
import router from './router'
import './assets/css/main.css'
import 'element-plus/dist/index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

const pinia = createPinia();



//createApp(App).mount('#app')
createApp(App)
.use(pinia)
.use(router)
.use(setupCalendar, {
    locale: 'zh-TW',
})

.mount('#app')