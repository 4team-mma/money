
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
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia();

pinia.use(piniaPluginPersistedstate) // 啟用持久化插件

//createApp(App).mount('#app')
createApp(App)
.use(pinia)
.use(router)
.use(setupCalendar, {
    locale: 'zh-TW',
})

.mount('#app')

// 檢測組件效能才使用這個
// import { createApp, getCurrentInstance } from 'vue' //
// import { setupCalendar } from 'v-calendar';
// import { createPinia } from 'pinia';
// import App from './App.vue'
// import router from './router'
// import './assets/css/main.css'
// import 'element-plus/dist/index.css'
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// import 'bootstrap-icons/font/bootstrap-icons.css';

// const pinia = createPinia();
// const app = createApp(App);

// // 🕵️‍♂️ 全域效能監控：找出瘋狂更新的組件
// app.mixin({
// updated() {
//     const instance = getCurrentInstance();
//     // 取得組件名稱（如果有定義的話）
//     const name = instance.type.__name || instance.type.name || '未知組件';
//     console.count(`🔥 [組件更新監控] -> ${name}`);
// }
// });

// app.use(pinia)
//     .use(router)
//     .use(setupCalendar, {
//         locale: 'zh-TW',
//     })
//     .mount('#app');