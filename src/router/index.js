import { createRouter, createWebHistory } from "vue-router";

import Home from "../view/Home.vue";
import Book from "../view/Book.vue";
import Account from "../view/Account.vue";
import Add from "../view/Add.vue";
import Chart from "../view/Chart.vue";
import AddIncome from "@/view/AddIncome.vue";
import AddTrans from "@/view/AddTrans.vue";
import Achievements from "@/view/Achievements.vue";
import Dashboard from "@/view/Dashboard.vue";
import Settings from "../view/Settings.vue";
import Admins from "@/view/Admins.vue";
import Register from "@/view/Register.vue";
import ChartFirstNetWorth from "../view/ChartFirstNetworth.vue"
import ChartSecondBalance from "../view/ChartSecondBalance.vue"
import ChartThirdExpense from "../view/ChartThirdExpense.vue"
import ChartForthIncome from "../view/ChartForthIncome.vue"
import ForgetPassword from "@/view/ForgetPassword.vue";



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
    path: "/AddIncome",
    component: AddIncome,
    name: AddIncome,
  },
  {
    path: "/AddTrans",
    component: AddTrans,
    name: AddTrans,
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
    path: "/ChartFirstNetWorth",
    component: ChartFirstNetWorth,
    name: "ChartFirstNetWorth",
  },
    {
    path: "/ChartSecondBalance",
    component: ChartSecondBalance,
    name: "ChartSecondBalance",
  },
    {
    path: "/ChartThirdExpense",
    component: ChartThirdExpense,
    name: "ChartThirdExpense",
  },
    {
    path: "/ChartForthIncome",
    component: ChartForthIncome,
    name: "ChartForthIncome",
  },
    {
    path: "/ForgetPassword",
    component: ForgetPassword,
    name: "ForgetPassword",
  }

];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
