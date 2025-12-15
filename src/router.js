import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import Dashboard from '../vue-pages/Dashboard.vue';
import Accounts from './views/Accounts.vue';
import Transactions from './views/Transactions.vue';
import Analytics from '../vue-pages/Analytics.vue';
import Calendar from '../vue-pages/Calendar.vue';
import investments from '../vue-examples/investments.vue';
// import expenses from '../vue-examples/expenses.vue';
// import income from '../vue-examples/income.vue';
import reports from '../vue-examples/reports.vue';
import Admins from './views/Admins.vue';
import Achievements from './views/Achievements.vue';
import Settings from './views/Settings.vue';
import Register from './views/Register.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/accounts', component: Accounts },
  { path: '/transactions', component: Transactions },
  { path: '/analytics', component: Analytics },
  { path: '/calendar', component: Calendar },
  { path: '/investments', component: investments },
  { path: '/reports', component: reports },
  { path: '/admins', component: Admins },
  { path: '/achievements', component: Achievements },
  { path: '/settings', component: Settings },
  { path: '/register', component: Register }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
