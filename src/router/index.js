import { createRouter,createWebHistory } from "vue-router";

import Home from "../view/Home.vue";
import Book from "../view/Book.vue";
import Account from "../view/Account.vue";
import Add from "../view/Add.vue";
import Chart from "../view/Chart.vue";
const routes =[{
    path:'/',
    component:Home,
    name:"Home"
},
{
    path:'/book',
    component:Book,
    name:Book
},
{
    path:'/Account',
    component:Account,
    name:Account
},
{
    path:'/Add',
    component:Add,
    name:Add
},
{
    path:'/chart',
    component:Chart,
    name:Chart}]
// },{
//     path:'/:pathMatch(.*)*',
//     component:NotFound,
//     name:"NotFound"
//     },


const router = createRouter({
    history:createWebHistory(),
    routes
})

export default router