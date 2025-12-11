import { createRouter,createWebHistory } from "vue-router";

import Home from "../view/Home.vue";
import Book from "../view/Book.vue";
import Account from "../view/Account.vue";
import Add from "../view/Add.vue";
import Chart from "../view/Chart.vue";
import Inn from "@/view/Inn.vue";
import Trans from "@/view/Trans.vue";


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
//   children:[
//     { path:"Inn", component:Inn, name:"Inn"},
//     { path:"Trans", component:Trans, name:"Trans"}
//   ]
},
{
    path:'/chart',
    component:Chart,
    name:Chart},
{
    path:'/Inn',
    component:Inn,
    name:Inn
},
{
    path:'/Trans',
    component:Trans,
    name:Trans
},


]
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