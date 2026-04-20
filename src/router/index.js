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
import AdminModel from "@/view/AdminModel.vue";
import LoadingView from "@/view/LoadingView.vue";
import Notifications from "@/view/Notifications.vue";
import AdminData from "@/view/AdminData.vue";
import AdminSetting from "@/view/AdminSetting.vue";
import TestAI from "@/view/Lab/TestAI.vue";
import AdminAiConfig from "@/view/AdminAiConfig.vue";
import AdminAiDevTools from "@/view/AdminAiDevTools.vue";
import LabDashboard from "@/view/LabDashboard.vue";
import SpeechCorrectionLab from "@/view/Lab/SpeechCorrectionLab.vue";
import RagSandbox from "@/view/Lab/RagSandbox.vue";


const routes = [
  {
    path: "/",
    component: Home,
    name: "Home",
    meta: { requiresAuth: false, hideNav: true }
  },
  {
    path: '/loading',
    component: LoadingView,
    name: 'Loading',
    meta: { requiresAuth: true, hideNav: true }

  }, 
  {
    path: "/dashboard",
    component: Dashboard,
    name: "Dashboard",
    meta: { requiresAuth: true}
  },

  {
    path: "/book",
    component: Book,
    name: "Book",
    meta: { requiresAuth: true}
  },
  {
    path: "/Account",
    component: Account,
    name: "Account",
    meta: { requiresAuth: true}
  },
  {
    path: "/Add",
    component: Add,
    //   children:[
    //     { path:"Inn", component:Inn, name:"Inn"},
    //     { path:"Trans", component:Trans, name:"Trans"}
    //   ]
    meta: { requiresAuth: true }
  },
  {
    path: "/chart",
    component: Chart,
    name: "Chart",
    meta: { requiresAuth: true }
  },
  {
    path: "/Achievements",
    component: Achievements,
    name: "Achievements",
    meta: { requiresAuth: true }
  },
  {
    path: "/AddIncome",
    component: AddIncome,
    name: "AddIncome",
    meta: { requiresAuth: true}
  },
  {
    path: "/AddTrans",
    component: AddTrans,
    name: "AddTrans",
    meta: { requiresAuth: true}
  },
  {
    path: "/Feedback",
    component: Feedback,
    name: "Feedback",
    meta: { requiresAuth: true}
  },
  {
    path: "/Settings",
    component: Settings,
    name: "Settings",
    meta: { requiresAuth: true }
  },
  {
    path: "/Notifications",
    component: Notifications,
    name: "Notifications",
    meta: { requiresAuth: true }
  },
  {
    path: "/Admins",
    component: Admins,
    name: "Admins",
    meta: { requiresAuth: true, hideNav: true }
  },
  {
    path: "/Register",
    component: Register,
    name: "Register",
    meta: { requiresAuth: false, hideNav: true }
  },
    {
    path: "/ChartSecondBalance",
    component: ChartSecondBalance,
    name: "ChartSecondBalance",
    meta: { requiresAuth: true }
  },
    {
    path: "/ChartThirdExpense",
    component: ChartThirdExpense,
    name: "ChartThirdExpense",
    meta: { requiresAuth: true}
  },
    {
    path: "/ChartForthIncome",
    component: ChartForthIncome,
    name: "ChartForthIncome",
    meta: { requiresAuth: true }
  },
    {
    path: "/ForgetPassword",
    component: ForgetPassword,
    name: "ForgetPassword",
    meta: { requiresAuth: false, hideNav: true }
  }
  ,
    {
    path: "/AdminsComments",
    component: AdminsComments,
    name: "AdminsComments",
    meta: { requiresAuth: true, hideNav: true }
  } ,
    {
    path: "/AdminMain",
    component: AdminMain,
    name: "AdminMain",
    meta: { requiresAuth: true, hideNav: true }
  },
    {
    path: "/ConsumerAnalysis",
    component: ConsumerAnalysis,
    name: "ConsumerAnalysis",
    meta: { requiresAuth: true}
  },
    {
    path: "/SalaryAnalysis",
    component: SalaryAnalysis,
    name: "SalaryAnalysis",
    meta: { requiresAuth: true }
  },
    {
    path: "/SettingAccount",
    component: SettingAccount,
    name: "SettingAccount",
    meta: { requiresAuth: true }
  }
  ,
    {
    path: "/SettingOutput",
    component: SettingOutput,
    name: "SettingOutput",
    meta: { requiresAuth: true }
  }
  ,
    {
    path: "/SettingAlert",
    component: SettingAlert,
    name: "SettingAlert",
    meta: { requiresAuth: true }
  }
  ,
    {
    path: "/SettingBudgetConfig",
    component: SettingBudgetConfig,
    name: "SettingBudgetConfig",
    meta: { requiresAuth: true }
  }
  ,
    {
    path: "/SettingUserProfile",
    component: SettingUserProfile,
    name: "SettingUserProfile",
    meta: { requiresAuth: true }
  }
  ,
    {
    path: "/BudgetManager",
    component: BudgetManager,
    name: "BudgetManager",
    meta: { requiresAuth: true }
  } 
  ,
    {
    path: "/AdminModel",
    component: AdminModel,
    name: "AdminModel",
    meta: { requiresAuth: true, hideNav: true }
  },
    {
    path: "/AdminData",
    component: AdminData,
    name: "AdminData",
    meta: { requiresAuth: true, hideNav: true }
  } ,
    {
    path: "/AdminSetting",
    component: AdminSetting,
    name: "AdminSetting",
    meta: { requiresAuth: true, hideNav: true }
  } ,
    {
    path: "/TestAI",
    component: TestAI,
    name: "TestAI",
    meta: { requiresAuth: true, hideNav: true }
  },
    {
    path: "/AdminAiConfig",
    component: AdminAiConfig,
    name: "AdminAiConfig",
    meta: { requiresAuth: true, hideNav: true }
  },
    {
    path: "/AdminAiDevTools",
    component: AdminAiDevTools,
    name: "AdminAiDevTools",
    meta: { requiresAuth: true, hideNav: true }
  },
  {
    path: '/lab',
    name: 'Lab',
    component: LabDashboard,
    meta: { requiresAuth: true, hideNav: true }
  },
  // 🌟 新增：註冊語音測試頁面的路由
  {
    path: '/SpeechCorrectionLab',
    name: 'SpeechCorrectionLab',
    component: SpeechCorrectionLab,
    meta: { requiresAuth: true, hideNav: true }
  },
    {
    path: "/RagSandbox",
    name: "RagSandbox",
    component: RagSandbox,
    meta: { requiresAuth: true, hideNav: true }
  },


];


const router = createRouter({
  history: createWebHistory(),
  routes,
});


// 路由守衛 (Router Guard)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('user_token');
  const userJson = localStorage.getItem('currentUser');
  const user = userJson ? JSON.parse(userJson) : null;

  // 1. 定義頁面群組
  const publicPages = ['/', '/Register', '/ForgetPassword'];
  const isAdminPage = ['/Admins', '/AdminMain', '/AdminModel', '/AdminsComments', '/AdminData', '/AdminSetting'].some(path => to.path.startsWith(path));
  
  // 🌟 AI 測試員專屬頁面陣列
  const aiTestPages = ['/lab', '/TestAI', '/SpeechCorrectionLab','/RagSandbox'];
  
  // 一般使用者頁面
  const isUserPage = !publicPages.includes(to.path) && !isAdminPage && !aiTestPages.includes(to.path) && to.path !== '/loading';

  // 🛡️ 防護 A：未登入者存取私有頁面
  if (!publicPages.includes(to.path) && !token) {
    console.warn('🔒 未登入，攔截請求');
    return next('/');
  }

  // 🛡️ 防護 B：已登入者的分流邏輯
  if (token && user) {
    
    // 1. 如果是 AI 測試員 (ai_test)
    if (user.role === 'ai_test') {
      // 🌟 修正：把 isTestAIPage 換成 aiTestPages.includes(to.path)
      if (!aiTestPages.includes(to.path) && to.path !== '/loading' && !publicPages.includes(to.path)) {
        console.warn('🧪 測試員請回實驗室大廳');
        return next('/lab');
      }
    }
    
    // 2. 如果是管理員 (admin)
    else if (user.role === 'admin') {
      // ...
    }
    
    // 3. 如果是一般使用者 (user)
    else {
      if (isAdminPage) {
        console.warn('🚫 非管理員，拒絕存取');
        return next('/book');
      }
      // 🌟 修正：把 isTestAIPage 換成 aiTestPages.includes(to.path)
      if (aiTestPages.includes(to.path)) {
        console.warn('🚫 非測試員，拒絕存取');
        return next('/book');
      }
    }
  }

  // 🛡️ 防護 C：已登入者嘗試回首頁
  if (publicPages.includes(to.path) && token && to.path === '/') {
    return next('/loading');
  }

  next();
});

export default router;
