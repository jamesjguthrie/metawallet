/*
 * Transactions.js - Store
 */
Ext.define('FW.store.LTCTransactions', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.LTCTransactions',
        autoLoad: true,
        autoSync: true
        // Set this proxy to store data in localStorage
        // proxy: {
        //     type: 'localstorage',
        //     id: 'LTCTransactions'
        // },
    }
});
