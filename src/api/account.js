import api from '@/api'

export const accountApi = {
    getList: () => api.get('/accounts/'),
    create: (data) => api.post('/accounts/', {
        account_name: data.name,
        account_type: data.type,
        currency: data.currency,
        initial_balance: Number(data.initial),
        exclude_from_assets: data.exclude || false,
        account_icon: data.icon
    }),
    delete: (accountId) => api.delete(`/accounts/${accountId}`), // 建議路徑修正
    update: (accountId, data) => api.put(`/accounts/${accountId}`, data)
};