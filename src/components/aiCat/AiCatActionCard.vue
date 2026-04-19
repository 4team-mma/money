<script setup>
import { useAccountStore } from '@/stores/useAccountStore';

const props = defineProps({
    actionItem: Object,
    index: Number,
    totalLength: Number,
    messageId: Number
});

const emit = defineEmits(['confirm', 'cancel']);
const accountStore = useAccountStore();
</script>

<template>
    <div class="action-card" style="margin-bottom: 12px;">
        <div class="card-header">
            {{ actionItem.record_type === 'transfer' ? '🔄 轉帳確認' : '📝 收支確認' }}
            <span style="font-size: 12px; color: #94a3b8; font-weight: normal; margin-left: auto;">
                ({{ index + 1 }}/{{ totalLength }})
            </span>
        </div>

        <div class="card-body">
            <div class="data-row">
                <span class="label">日期：</span>
                <input type="date" v-model="actionItem.record_date" class="value ai-select" style="max-width: 130px;" />
            </div>

            <div class="data-row">
                <span class="label">金額：</span>
                <span class="value amount"
                    :style="{ color: actionItem.record_type === 'income' ? '#10b981' : (actionItem.record_type === 'expense' ? '#ef4444' : '#3b82f6') }">
                    {{ actionItem.record_type === 'income' ? '+' : (actionItem.record_type === 'expense' ? '-' : '') }}
                    $ {{ actionItem.add_amount }}
                </span>
            </div>

            <template v-if="actionItem.record_type !== 'transfer'">
                <div class="data-row"><span class="label">類別：</span><span class="value">{{ actionItem.add_class
                        }}</span></div>
                <div class="data-row"><span class="label">項目：</span><span class="value">{{ actionItem.add_note }}</span>
                </div>

                <div class="data-row">
                    <span class="label">帳戶：</span>
                    <select v-model="actionItem.account_name" class="value ai-select">
                        <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">
                            {{ acc.itemName }}
                        </option>
                    </select>
                </div>
                <div class="data-row"><span class="label">標籤：</span><span class="value tag-text">{{
                        actionItem.add_member }} / {{ actionItem.add_tag }}</span></div>
            </template>

            <template v-else>
                <div class="data-row">
                    <span class="label">轉出 (From)：</span>
                    <select v-model="actionItem.from_account" class="value ai-select">
                        <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">{{
                            acc.itemName }}</option>
                    </select>
                </div>
                <div class="data-row">
                    <span class="label">轉入 (To)：</span>
                    <select v-model="actionItem.to_account" class="value ai-select">
                        <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">{{
                            acc.itemName }}</option>
                    </select>
                </div>
                <div class="data-row"><span class="label">備註：</span><span class="value">{{ actionItem.add_note }}</span>
                </div>
            </template>
        </div>

        <div class="card-footer">
            <button class="btn cancel" @click="emit('cancel', messageId, index)">取消</button>
            <button class="btn confirm" @click="emit('confirm', messageId, index, actionItem)">確認送出</button>
        </div>
    </div>
</template>

<style scoped>
/* 貼上原本 action-card, card-header, card-body, card-footer, data-row 等所有卡片專屬的 CSS */
.action-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    width: 100%;
    min-width: 200px;
}

.card-header {
    background: #f8fafc;
    padding: 8px 12px;
    font-weight: bold;
    font-size: 0.85rem;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
}

.card-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
}

.data-row .label {
    color: #64748b;
}

.data-row .value {
    font-weight: bold;
    color: #1e293b;
}

.data-row .amount {
    color: #ef4444;
    font-size: 1.1rem;
}

.card-footer {
    display: flex;
    border-top: 1px solid #e2e8f0;
}

.card-footer .btn {
    flex: 1;
    padding: 10px 0;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
}

.card-footer .btn.cancel {
    color: #64748b;
    border-right: 1px solid #e2e8f0;
}

.card-footer .btn.cancel:hover {
    background: #f1f5f9;
}

.card-footer .btn.confirm {
    color: #3b82f6;
}

.card-footer .btn.confirm:hover {
    background: #eff6ff;
}

.ai-select {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 0.9rem;
    outline: none;
    cursor: pointer;
    flex: 1;
    max-width: 140px;
}

.tag-text {
    font-size: 0.8rem;
    color: #3b82f6;
    background: #eff6ff;
    padding: 2px 6px;
    border-radius: 4px;
}
</style>