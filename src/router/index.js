import { createRouter,createWebHistory } from "vue-router";

import Home from "../view/Home.vue";
import Book from "../view/Book.vue";
import Account from "../view/Account.vue";
import Add from "../view/Add.vue";
import Chart from "../view/Chart.vue";
const routes =[{
    path:'/',
    component:Home
},
{
    path:'/book',
    component:Book
},
{
    path:'/Account',
    component:Account
},
{
    path:'/Add',
    component:Add
},
{
    path:'/chart',
    component:Chart
}
]

const router = createRouter({
    history:createWebHistory(),
    routes
})

export default router