// import { defineStore } from 'pinia';
// import { computed, ref } from 'vue';


// export const useBoxStore = defineStore('item', () => {

//     const Items = ref([]);
//     // 新增項目
//     function addItem(newItem) {

//         if (newItem.trim()) {
//             Items.value
//                 .push({
//                     'id': Date.now(),
//                     'select': false,
//                     'itemName': newItem
//                 });
        
//         }

//     }

//     // 刪除項目
//     // [1,2,3,4]    要刪除 3   撈取3以外的資料=> [1,2,4]
//     function removeItem(removeId) {
//         // 篩選非刪除的id放回原本的清單
//         Items.value = Items.value.filter(x => x.id != removeId);
//     }

//     // 已經完成數量
//     const selectCount = computed(() => {
//         return Items.value.filter(x => x.select).length;
//     })

//     return { Items, addItem, removeItem, selectCount };
// })