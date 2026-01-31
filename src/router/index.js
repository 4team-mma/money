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
import ChartSecondBalance from "../view/ChartSecondBalance.vue"
import ChartThirdExpense from "../view/ChartThirdExpense.vue"
import ChartForthIncome from "../view/ChartForthIncome.vue"
import ForgetPassword from "@/view/ForgetPassword.vue";
import AdminsComments from "@/view/AdminsComments.vue"
import Feedback from "@/view/Feedback.vue";
import AdminMain from "@/view/AdminMain.vue";
import ConsumerAnalysis from "@/view/ConsumerAnalysis.vue";
import SalaryAnalysis from "@/view/SalaryAnalysis.vue";
import SettingAccount from "@/view/SettingAccount.vue";
import SettingOutput from "@/view/SettingOutput.vue";
import SettingAlert from "@/view/SettingAlert.vue";
import SettingBudgetConfig from "@/view/SettingBudgetConfig.vue";
import SettingUserProfile from "@/view/SettingUserProfile.vue";
import BudgetManager from "@/view/BudgetManager.vue";


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
    path: "/Feedback",
    component: Feedback,
    name: "Feedback",
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
  ,
    {
    path: "/AdminsComments",
    component: AdminsComments,
    name: "AdminsComments",
  } ,
    {
    path: "/AdminMain",
    component: AdminMain,
    name: "AdminMain",
  },
    {
    path: "/ConsumerAnalysis",
    component: ConsumerAnalysis,
    name: "ConsumerAnalysis",
  },
    {
    path: "/SalaryAnalysis",
    component: SalaryAnalysis,
    name: "SalaryAnalysis",
  },
    {
    path: "/SettingAccount",
    component: SettingAccount,
    name: "SettingAccount",
  }
  ,
    {
    path: "/SettingOutput",
    component: SettingOutput,
    name: "SettingOutput",
  }
  ,
    {
    path: "/SettingAlert",
    component: SettingAlert,
    name: "SettingAlert",
  }
  ,
    {
    path: "/SettingBudgetConfig",
    component: SettingBudgetConfig,
    name: "SettingBudgetConfig",
  }
  ,
    {
    path: "/SettingUserProfile",
    component: SettingUserProfile,
    name: "SettingUserProfile",
  }
  ,
    {
    path: "/BudgetManager",
    component: BudgetManager,
    name: "BudgetManager",
  }

];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
