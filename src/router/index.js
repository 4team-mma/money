import { createRouter, createWebHistory } from "vue-router";

import Home from "../view/Home.vue";
import Book from "../view/Book.vue";
import Account from "../view/Account.vue";
import Add from "../view/Add.vue";
import Chart from "../view/Chart.vue";
import Inn from "@/view/Inn.vue";
import Trans from "@/view/Trans.vue";
import Achievements from "@/view/Achievements.vue";
import Dashboard from "@/view/Dashboard.vue";
import Settings from "../view/Settings.vue";
import Admins from "@/view/Admins.vue";
import Register from "@/view/Register.vue";
import NetWorth from "../view/Chart_1_NetWorth.vue"
import Balance from "../view/Chart_2_Balance.vue"
import Expense from "../view/Chart_3_Expense.vue"
import Income from "../view/Chart_4_Income.vue"



const routes = [
  {
    path: "/",
    component: Home,
    name: "Home",
  }, 
  {
    path: "/dashboard",
    component: Dashboard,
    name: "Dashboard",
  },

  {
    path: "/book",
    component: Book,
    name: Book,
  },
  {
    path: "/Account",
    component: Account,
    name: Account,
  },
  {
    path: "/Add",
    component: Add,
    //   children:[
    //     { path:"Inn", component:Inn, name:"Inn"},
    //     { path:"Trans", component:Trans, name:"Trans"}
    //   ]
  },
  {
    path: "/chart",
    component: Chart,
    name: Chart,
  },
  ,
  {
    path: "/Achievements",
    component: Achievements,
    name: Achievements,
  },
  {
    path: "/Inn",
    component: Inn,
    name: Inn,
  },
  {
    path: "/Trans",
    component: Trans,
    name: Trans,
  },
  {
    path: "/Settings",
    component: Settings,
    name: "Settings",
  },
  {
    path: "/Admins",
    component: Admins,
    name: "Admins",
  },
  {
    path: "/Register",
    component: Register,
    name: "Register",
  },
    {
    path: "/NetWorth",
    component: NetWorth,
    name: "NetWorth",
  },
    {
    path: "/Balance",
    component: Balance,
    name: "Balance",
  },
    {
    path: "/Expense",
    component: Expense,
    name: "Expense",
  },
    {
    path: "/Income",
    component: Income,
    name: "Income",
  }

];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
