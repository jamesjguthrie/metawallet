/*
 * Transactions.js - Store
 */
Ext.define('FW.store.MONTransactions', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.MONTransactions',
        autoLoad: true,
        autoSync: true
        // Set this proxy to store data in localStorage
        // proxy: {
        //     type: 'localstorage',
        //     id: 'MONTransactions'
        // },
    }
});
